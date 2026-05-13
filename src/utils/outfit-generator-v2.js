import {
  DAILY_OUTFIT_RULES,
  SCORING_WEIGHTS,
  GARMENT_CATEGORIES,
  GARMENT_CATEGORIES_LABELS,
} from './constants';
import { getExcludedSeasonTagsForTemperature } from './weather-mapper';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysSince(date) {
  if (!date) return Infinity;
  const d = typeof date === 'string' ? new Date(date) : date.toDate?.() || new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const CATEGORY_ORDER = [
  GARMENT_CATEGORIES.TOP,
  GARMENT_CATEGORIES.BOTTOM,
  GARMENT_CATEGORIES.DRESS,
  GARMENT_CATEGORIES.SHOES,
  GARMENT_CATEGORIES.ACCESSORY,
];

export function computeGarmentScore(garment, recentGarmentIds, weatherTemp) {
  let score = 0;
  if (recentGarmentIds.has(garment.id)) score += SCORING_WEIGHTS.RECENTLY_USED_PENALTY;
  const d = daysSince(garment.last_used_at);
  if (d > 180) score += SCORING_WEIGHTS.FORGOTTEN_BONUS;
  if (garment.times_used <= 3) score += SCORING_WEIGHTS.LOW_USAGE_BONUS;
  if (garment.is_favorite) score += SCORING_WEIGHTS.FAVORITE_BONUS;
  if (weatherTemp != null) {
    const excludedTags = getExcludedSeasonTagsForTemperature(weatherTemp);
    const garmentTags = garment.season_tags || [];
    if (garmentTags.some((tag) => excludedTags.includes(tag))) {
      score += SCORING_WEIGHTS.SEASON_MISMATCH_PENALTY;
    }
  }
  return score;
}

function selectBest(garments, recentGarmentIds, weatherTemp, preferredExcludeIds) {
  if (!garments || garments.length === 0) return null;
  let best = null;
  let bestScore = -Infinity;
  for (const garment of garments) {
    let score = computeGarmentScore(garment, recentGarmentIds, weatherTemp);
    if (preferredExcludeIds?.has(garment.id)) score -= 15;
    score += Math.random() * 3;
    if (score > bestScore) { bestScore = score; best = garment; }
  }
  return best;
}

export function generateOutfitName(selectedGarments) {
  if (!selectedGarments || selectedGarments.length === 0) return 'Outfit';
  return selectedGarments.map((g) => g.name || g.emoji || 'Prenda').join(' + ');
}

export function groupByCategory(garments) {
  const groups = {};
  for (const cat of CATEGORY_ORDER) groups[cat] = [];
  for (const g of garments) {
    if (!g.category) {
      console.warn('[OutfitGen] Garment without category, skipping:', g.id);
      continue;
    }
    if (groups[g.category]) {
      groups[g.category].push(g);
    } else {
      console.warn('[OutfitGen] Unknown category:', g.category, 'for garment', g.id);
    }
  }
  return groups;
}

function pickBody(mode, byCategory, recentGarmentIds, weatherTemp, preferredExcludeIds) {
  const result = [];
  if (mode === 'dress') {
    const dress = selectBest(byCategory[GARMENT_CATEGORIES.DRESS], recentGarmentIds, weatherTemp, preferredExcludeIds);
    if (!dress) return { garments: [], reason: 'No hay vestidos disponibles.' };
    result.push({
      garment_id: dress.id,
      position: 1,
      category_used: dress.category,
      garment_data: dress,
    });
  } else {
    const top = selectBest(byCategory[GARMENT_CATEGORIES.TOP], recentGarmentIds, weatherTemp, preferredExcludeIds);
    const bottom = selectBest(byCategory[GARMENT_CATEGORIES.BOTTOM], recentGarmentIds, weatherTemp, preferredExcludeIds);
    if (!top) return { garments: [], reason: 'No hay partes superiores disponibles.' };
    if (!bottom) return { garments: [], reason: 'No hay partes inferiores disponibles.' };
    result.push({
      garment_id: top.id,
      position: 1,
      category_used: top.category,
      garment_data: top,
    });
    result.push({
      garment_id: bottom.id,
      position: 2,
      category_used: bottom.category,
      garment_data: bottom,
    });
  }
  return { garments: result, reason: null };
}

function pickRequired(category, byCategory, recentGarmentIds, weatherTemp, preferredExcludeIds, position) {
  const garment = selectBest(byCategory[category], recentGarmentIds, weatherTemp, preferredExcludeIds);
  if (!garment) return { garment: null, reason: `No hay ${GARMENT_CATEGORIES_LABELS?.[category] || category} disponibles.` };
  return {
    garment: {
      garment_id: garment.id,
      position,
      category_used: garment.category,
      garment_data: garment,
    },
    reason: null,
  };
}

/**
 * Generates an automatic outfit from available garments.
 * Strict: NEVER returns incomplete outfits.
 * If the primary mode fails, falls back to the alternative mode automatically.
 * Business rules:
 *  - Formato A: TOP + BOTTOM + SHOES + ACCESSORY
 *  - Formato B: DRESS + SHOES + ACCESSORY
 */
export function selectDailyOutfitGarments(garments, recentGarmentIds, weatherTemp, preferredExcludeIds = new Set(), preferredMode = 'auto') {
  const byCategory = groupByCategory(garments);

  const counts = {};
  for (const [cat, list] of Object.entries(byCategory)) {
    counts[cat] = list.length;
  }
  console.log('[OutfitGen] Available per category:', counts, '| preferredMode:', preferredMode);

  const hasDress = byCategory[GARMENT_CATEGORIES.DRESS].length > 0;
  const hasTopBottom = byCategory[GARMENT_CATEGORIES.TOP].length > 0 && byCategory[GARMENT_CATEGORIES.BOTTOM].length > 0;

  // Determine the order of modes to try
  let firstMode, secondMode;
  if (hasDress && hasTopBottom) {
    if (preferredMode === 'dress') {
      firstMode = 'dress'; secondMode = 'top-bottom';
    } else if (preferredMode === 'top-bottom') {
      firstMode = 'top-bottom'; secondMode = 'dress';
    } else {
      firstMode = Math.random() > 0.5 ? 'dress' : 'top-bottom';
      secondMode = firstMode === 'dress' ? 'top-bottom' : 'dress';
    }
  } else if (hasDress) {
    firstMode = 'dress'; secondMode = null;
  } else {
    firstMode = 'top-bottom'; secondMode = null;
  }

  // Try primary mode, fall back to secondary if needed
  let lastError = null;
  for (const mode of [firstMode, secondMode]) {
    if (!mode) continue;

    console.log('[OutfitGen] Trying mode:', mode);
    const body = pickBody(mode, byCategory, recentGarmentIds, weatherTemp, preferredExcludeIds);
    if (body.reason || body.garments.length === 0) {
      lastError = `[${mode}] ${body.reason || 'No se pudo seleccionar el cuerpo del outfit.'}`;
      console.log('[OutfitGen] Body pick failed:', lastError);
      continue;
    }

    let position = body.garments.length + 1;

    const shoesResult = pickRequired(GARMENT_CATEGORIES.SHOES, byCategory, recentGarmentIds, weatherTemp, preferredExcludeIds, position);
    if (!shoesResult.garment) {
      lastError = `[${mode}] ${shoesResult.reason}`;
      console.log('[OutfitGen] Shoes pick failed:', lastError);
      continue;
    }
    position++;

    const accResult = pickRequired(GARMENT_CATEGORIES.ACCESSORY, byCategory, recentGarmentIds, weatherTemp, preferredExcludeIds, position);
    if (!accResult.garment) {
      lastError = `[${mode}] ${accResult.reason}`;
      console.log('[OutfitGen] Accessory pick failed:', lastError);
      continue;
    }

    // All required garments selected — build final result
    const result = [...body.garments, shoesResult.garment, accResult.garment];
    const garmentData = result.map((s) => s.garment_data);
    const selected = result.map((s) => ({ id: s.garment_id, cat: s.category_used }));
    console.log('[OutfitGen] Mode succeeded:', mode, 'Selected:', selected);

    const outfitMode = result.some((g) => g.category_used === GARMENT_CATEGORIES.DRESS) ? 'dress' : 'top-bottom';

    return {
      garments: result,
      name: generateOutfitName(garmentData),
      description: generateOutfitName(garmentData),
      wasAutomatic: true,
      outfitMode,
    };
  }

  // Both modes failed
  console.log('[OutfitGen] All modes failed. Last error:', lastError);
  return {
    garments: [],
    name: 'Outfit inválido',
    description: lastError || 'No se pudo generar un outfit válido.',
    wasAutomatic: true,
    outfitMode: 'none',
  };
}

/**
 * Validates whether an automatic outfit CAN be generated from the available garments.
 * Requirements:
 *  - At least 2 garments total
 *  - Must have body coverage: (TOP+BOTTOM) or DRESS
 *  - Must have SHOES
 *  - Must have ACCESSORY
 */
export function canGenerateOutfit(garments) {
  if (!garments || garments.length < DAILY_OUTFIT_RULES.MIN_GARMENTS_REQUIRED) {
    return { allowed: false, reason: `Se necesitan al menos ${DAILY_OUTFIT_RULES.MIN_GARMENTS_REQUIRED} prendas en total.` };
  }

  const cats = new Set(garments.map((g) => g.category));
  const hasTop = cats.has(GARMENT_CATEGORIES.TOP);
  const hasBottom = cats.has(GARMENT_CATEGORIES.BOTTOM);
  const hasDress = cats.has(GARMENT_CATEGORIES.DRESS);
  const hasShoes = cats.has(GARMENT_CATEGORIES.SHOES);
  const hasAccessory = cats.has(GARMENT_CATEGORIES.ACCESSORY);

  if (!hasTop && !hasDress) {
    return { allowed: false, reason: 'Falta: necesitas una Parte Superior o un Vestido.' };
  }
  if (!hasBottom && !hasDress) {
    return { allowed: false, reason: 'Falta: necesitas una Parte Inferior o un Vestido.' };
  }
  if (!hasShoes) {
    return { allowed: false, reason: 'Necesitas al menos un calzado en tu inventario.' };
  }
  if (!hasAccessory) {
    return { allowed: false, reason: 'Necesitas al menos un accesorio en tu inventario.' };
  }

  return { allowed: true, reason: null };
}

/**
 * Centralized validator for a generated outfit result.
 * Returns { valid: boolean, errors: string[] }
 *
 * Only TWO valid formats:
 *   Formato A: TOP + BOTTOM + SHOES + ACCESSORY
 *   Formato B: DRESS + SHOES + ACCESSORY
 */
export function validateOutfit(outfitResult) {
  const errors = [];
  const items = outfitResult?.garments;
  if (!items || items.length === 0) {
    return { valid: false, errors: ['El outfit está vacío.'] };
  }

  const cats = items.map((g) => g.category_used || g.garment_data?.category).filter(Boolean);
  if (cats.length === 0) {
    return { valid: false, errors: ['El outfit no tiene categorías detectables.'] };
  }

  const counts = {};
  for (const c of cats) counts[c] = (counts[c] || 0) + 1;
  console.log('[validateOutfit] Categories:', counts);

  const hasTop = counts[GARMENT_CATEGORIES.TOP] > 0;
  const hasBottom = counts[GARMENT_CATEGORIES.BOTTOM] > 0;
  const hasDress = counts[GARMENT_CATEGORIES.DRESS] > 0;
  const hasShoes = counts[GARMENT_CATEGORIES.SHOES] > 0;
  const hasAccessory = counts[GARMENT_CATEGORIES.ACCESSORY] > 0;

  // Duplicate category check
  for (const [cat, count] of Object.entries(counts)) {
    if (count > 1) {
      errors.push(`Categoría duplicada: ${cat} aparece ${count} veces.`);
    }
  }

  // Dress + bottom/top forbidden
  if (hasDress && hasBottom) errors.push('No puedes combinar un Vestido con una Parte Inferior.');
  if (hasDress && hasTop) errors.push('No puedes combinar un Vestido con una Parte Superior.');

  // Body coverage
  if (hasDress) {
    if (!hasTop && !hasBottom) {
      // Valid: dress mode
    } else {
      errors.push('Modo vestido inválido: no puede tener top ni bottom.');
    }
  } else {
    if (!hasTop) errors.push('Falta una Parte Superior.');
    if (!hasBottom) errors.push('Falta una Parte Inferior.');
  }

  // Required categories
  if (!hasShoes) errors.push('Falta Calzado.');
  if (!hasAccessory) errors.push('Faltan Accesorios.');

  // Garment validation
  for (const item of items) {
    const g = item.garment_data || item;
    if (!g || !g.id) {
      errors.push('Prenda inválida en el outfit.');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a MANUALLY selected outfit composition.
 * Returns { valid: boolean, errors: string[] }
 */
export function validateOutfitComposition(selectedGarments) {
  const errors = [];
  if (!selectedGarments || selectedGarments.length === 0) {
    return { valid: false, errors: ['Selecciona al menos una prenda.'] };
  }

  const cats = selectedGarments.map((g) => g.category).filter(Boolean);
  const counts = {};
  for (const c of cats) counts[c] = (counts[c] || 0) + 1;
  console.log('[OutfitGen] validateOutfitComposition — categories:', counts);

  const hasTop = counts[GARMENT_CATEGORIES.TOP] > 0;
  const hasBottom = counts[GARMENT_CATEGORIES.BOTTOM] > 0;
  const hasDress = counts[GARMENT_CATEGORIES.DRESS] > 0;
  const hasShoes = counts[GARMENT_CATEGORIES.SHOES] > 0;
  const hasAccessory = counts[GARMENT_CATEGORIES.ACCESSORY] > 0;

  for (const [cat, count] of Object.entries(counts)) {
    if (count > 1) {
      errors.push(`No puedes seleccionar más de una prenda de la misma categoría.`);
    }
  }

  if (hasDress && hasBottom) errors.push('No puedes combinar un Vestido con una Parte Inferior.');
  if (hasDress && hasTop) errors.push('No puedes combinar un Vestido con una Parte Superior.');

  if (!hasDress) {
    if (!hasTop) errors.push('Falta una Parte Superior.');
    if (!hasBottom) errors.push('Falta una Parte Inferior.');
  }

  if (!hasShoes) errors.push('Falta Calzado.');
  if (!hasAccessory) errors.push('Faltan Accesorios.');

  return { valid: errors.length === 0, errors };
}

/**
 * Translates any internal/technical error string into a user-friendly message.
 * Technical patterns (null, undefined, internal keys) are never shown to the user.
 * Unknown errors fall back to a safe generic message and are logged for debugging.
 */
export function translateOutfitError(error) {
  if (!error) return 'Completa todas las categorías del outfit.';

  // --- Top missing (all variants) ---
  if (/(?:top\s*=\s*(?:undefined|null)|falta\s+top\b|falta una parte superior\b)/i.test(error)) {
    return 'Necesitas agregar una parte superior.';
  }
  // --- Bottom missing ---
  if (/(?:bottom\s*=\s*(?:undefined|null)|falta\s+bottom\b|falta una parte inferior\b)/i.test(error)) {
    return 'Necesitas agregar una parte inferior.';
  }
  // --- Shoes missing ---
  if (/(?:shoes\s*=\s*(?:undefined|null)|falta\s+shoes\b|falta calzado\b|faltan calzado\b|necesitas al menos un calzado\b)/i.test(error)) {
    return 'Necesitas agregar calzado.';
  }
  // --- Accessory missing ---
  if (/(?:accessory\s*=\s*(?:undefined|null)|falta\s+accessory\b|falta acceso\w*\b|faltan acceso\w*\b|necesitas al menos un acceso\w*\b)/i.test(error)) {
    return 'Necesitas agregar accesorios.';
  }
  // --- Dress missing (null/undefined id) ---
  if (/dress\s*=\s*(?:undefined|null)/i.test(error)) {
    return 'Necesitas agregar un vestido.';
  }
  // --- Dress + top/bottom conflict ---
  if (/vestido.*superior|superior.*vestido/i.test(error)) {
    return 'No puedes combinar un vestido con una parte superior.';
  }
  if (/vestido.*inferior|inferior.*vestido/i.test(error)) {
    return 'No puedes combinar un vestido con una parte inferior.';
  }
  // --- Duplicate categories ---
  if (/(?:duplicada|más de una prenda)/i.test(error)) {
    return 'No puedes seleccionar más de una prenda de la misma categoría.';
  }
  // --- Empty / no selection ---
  if (/(?:no hay selección|está vacío|no tiene categorías detectables)/i.test(error)) {
    return 'Completa todas las categorías del outfit.';
  }
  // --- Not enough total garments ---
  if (/al menos una prenda/i.test(error)) {
    return 'Selecciona al menos una prenda para guardar.';
  }
  if (/al menos.*prendas/i.test(error)) {
    return 'No tienes suficientes prendas para generar un outfit.';
  }
  // --- Needs top or dress ---
  if (/superior o un vestido/i.test(error)) {
    return 'Necesitas una parte superior o un vestido.';
  }
  // --- Needs bottom or dress ---
  if (/inferior o un vestido/i.test(error)) {
    return 'Necesitas una parte inferior o un vestido.';
  }
  // --- Garment not found in inventory ---
  if (/(?:no encontrada en inventario|prenda.*inválida)/i.test(error)) {
    return 'Una prenda seleccionada ya no está disponible.';
  }
  // --- No garments available in category ---
  if (/no hay.*disponible/i.test(error)) {
    return 'No hay prendas disponibles en esa categoría.';
  }
  // --- Generic generation failure ---
  if (/no se pudo generar|inválido/i.test(error)) {
    return 'No se pudo generar un outfit válido. Intenta de nuevo.';
  }

  // Fallback: log unknown technical error, return safe user message
  console.warn('[Outfit] Error interno sin traducción:', error);
  return 'Completa todas las categorías del outfit.';
}

/**
 * Validates a UI selection map (selectedById) against available garments.
 * Only checks categories REQUIRED for the detected mode:
 *   - DRESS mode → DRESS + SHOES + ACCESSORY (TOP/BOTTOM optional)
 *   - TOP+BOTTOM mode → TOP + BOTTOM + SHOES + ACCESSORY (DRESS optional)
 * Returns technical errors internally (must be translated before display).
 */
export function validateSelection(selectedById, garmentsByCategory) {
  const errors = [];
  if (!selectedById) {
    return { valid: false, errors: ['No hay selección de outfit'] };
  }

  // Step 1: Resolve every present ID to a garment (skip missing keys — they may be optional)
  const resolved = {};
  for (const cat of CATEGORY_ORDER) {
    const id = selectedById[cat];
    if (!id) continue; // key not present, null, undefined, or empty — skip (may be optional)
    const garment = (garmentsByCategory[cat] || []).find((g) => g.id === id);
    if (!garment) {
      errors.push(`Outfit inválido: ${cat}=${id} no encontrada en inventario`);
    } else {
      resolved[cat] = garment;
    }
  }

  const hasTop = !!resolved[GARMENT_CATEGORIES.TOP];
  const hasBottom = !!resolved[GARMENT_CATEGORIES.BOTTOM];
  const hasDress = !!resolved[GARMENT_CATEGORIES.DRESS];
  const hasShoes = !!resolved[GARMENT_CATEGORIES.SHOES];
  const hasAccessory = !!resolved[GARMENT_CATEGORIES.ACCESSORY];

  // Step 2: Validate composition rules — ONLY check categories required by the active mode
  if (hasDress) {
    // DRESS MODE: dress + shoes + accessory required
    if (hasTop) errors.push('No puedes combinar Vestido con Parte Superior');
    if (hasBottom) errors.push('No puedes combinar Vestido con Parte Inferior');
    if (!hasShoes) errors.push('Outfit inválido: falta shoes');
    if (!hasAccessory) errors.push('Outfit inválido: falta accessory');
  } else if (hasTop && hasBottom) {
    // TOP+BOTTOM MODE: top + bottom + shoes + accessory required
    if (!hasShoes) errors.push('Outfit inválido: falta shoes');
    if (!hasAccessory) errors.push('Outfit inválido: falta accessory');
  } else {
    // Missing body coverage entirely
    if (!hasTop && !hasDress) errors.push('Outfit inválido: falta top');
    if (!hasBottom && !hasDress) errors.push('Outfit inválido: falta bottom');
  }

  const valid = errors.length === 0;
  if (valid) {
    const mode = hasDress ? 'dress' : 'top-bottom';
    console.log('[Outfit] Outfit válido generado, modo:', mode);
  } else {
    console.log('[Outfit] Selección inválida:', errors.join('; '));
  }
  return { valid, errors };
}

export function getDateString(date) {
  if (!date) return todayString();
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { todayString, daysSince };
