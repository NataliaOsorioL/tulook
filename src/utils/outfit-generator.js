import {
  DAILY_OUTFIT_RULES,
  SCORING_WEIGHTS,
  GARMENT_CATEGORIES,
} from './constants';
import { getExcludedSeasonTagsForTemperature } from './weather-mapper';

function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isSameDay(dateA, dateB) {
  if (!dateA || !dateB) return false;
  const a = typeof dateA === 'string' ? new Date(dateA) : dateA.toDate?.() || new Date(dateA);
  const b = typeof dateB === 'string' ? new Date(dateB) : dateB.toDate?.() || new Date(dateB);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysSince(date) {
  if (!date) return Infinity;
  const d = typeof date === 'string' ? new Date(date) : date.toDate?.() || new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function computeGarmentScore(garment, recentGarmentIds, weatherTemp) {
  let score = 0;

  if (recentGarmentIds.has(garment.id)) {
    score += SCORING_WEIGHTS.RECENTLY_USED_PENALTY;
  }

  const daysSinceLastUse = daysSince(garment.last_used_at);
  if (daysSinceLastUse > 180) {
    score += SCORING_WEIGHTS.FORGOTTEN_BONUS;
  }

  if (garment.times_used <= 3) {
    score += SCORING_WEIGHTS.LOW_USAGE_BONUS;
  }

  if (garment.is_favorite) {
    score += SCORING_WEIGHTS.FAVORITE_BONUS;
  }

  if (weatherTemp !== null && weatherTemp !== undefined) {
    const excludedTags = getExcludedSeasonTagsForTemperature(weatherTemp);
    const garmentTags = garment.season_tags || [];
    const hasExcluded = garmentTags.some((tag) => excludedTags.includes(tag));
    if (hasExcluded) {
      score += SCORING_WEIGHTS.SEASON_MISMATCH_PENALTY;
    }
  }

  return score;
}

function selectBest(garments, recentGarmentIds, weatherTemp) {
  if (!garments || garments.length === 0) return null;

  let best = null;
  let bestScore = -Infinity;

  for (const garment of garments) {
    const score = computeGarmentScore(garment, recentGarmentIds, weatherTemp);
    if (score > bestScore) {
      bestScore = score;
      best = garment;
    }
  }

  return best;
}

export function generateOutfitName(selectedGarments) {
  if (!selectedGarments || selectedGarments.length === 0) return 'Outfit';
  return selectedGarments.map((g) => g.name).join(' + ');
}

export function selectDailyOutfitGarments(garments, recentGarmentIds, weatherTemp) {
  const byCategory = {
    [GARMENT_CATEGORIES.TOP]: [],
    [GARMENT_CATEGORIES.BOTTOM]: [],
    [GARMENT_CATEGORIES.SHOES]: [],
    [GARMENT_CATEGORIES.ACCESSORY]: [],
  };

  for (const g of garments) {
    if (byCategory[g.category]) {
      byCategory[g.category].push(g);
    }
  }

  const top = selectBest(byCategory[GARMENT_CATEGORIES.TOP], recentGarmentIds, weatherTemp);
  const bottom = selectBest(byCategory[GARMENT_CATEGORIES.BOTTOM], recentGarmentIds, weatherTemp);
  const shoes = selectBest(byCategory[GARMENT_CATEGORIES.SHOES], recentGarmentIds, weatherTemp);
  const accessory = selectBest(byCategory[GARMENT_CATEGORIES.ACCESSORY], recentGarmentIds, weatherTemp);

  const selected = [top, bottom, shoes, accessory].filter(Boolean);

  return {
    garments: selected.map((g, i) => ({
      garment_id: g.id,
      position: i + 1,
      category_used: g.category,
      garment_data: g,
    })),
    name: generateOutfitName(selected),
    description: generateOutfitName(selected),
    wasAutomatic: true,
  };
}

export function canGenerateOutfit(garments) {
  if (!garments || garments.length < DAILY_OUTFIT_RULES.MIN_GARMENTS_REQUIRED) {
    return { allowed: false, reason: `Se necesitan al menos ${DAILY_OUTFIT_RULES.MIN_GARMENTS_REQUIRED} prendas` };
  }

  const categories = new Set(garments.map((g) => g.category));
  if (!categories.has(GARMENT_CATEGORIES.TOP)) {
    return { allowed: false, reason: 'No tienes prendas de la categoría Parte Superior' };
  }
  if (!categories.has(GARMENT_CATEGORIES.BOTTOM)) {
    return { allowed: false, reason: 'No tienes prendas de la categoría Parte Inferior' };
  }

  return { allowed: true, reason: null };
}

export function getDateString(date) {
  if (!date) return todayString();
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export { todayString, daysSince, isSameDay };
