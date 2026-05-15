import { getGarmentsByUser, createGarment } from '../services/garment.service';
import { logger } from '../utils/logger';
import { GARMENT_CATEGORIES, SEASON_TAGS, FIRESTORE_COLLECTIONS } from '../utils/constants';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

export const SEED_GARMENTS = [
  {
    name: 'Camisa Lino',
    category: GARMENT_CATEGORIES.TOP,
    color_hex: '#FFF',
    color_name: 'Blanco',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SPRING, SEASON_TAGS.SUMMER],
    is_favorite: true,
  },
  {
    name: 'Jeans Rectos',
    category: GARMENT_CATEGORIES.BOTTOM,
    color_hex: '#2E5A88',
    color_name: 'Azul',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SPRING, SEASON_TAGS.FALL],
    is_favorite: false,
  },
  {
    name: 'Vestido Floral',
    category: GARMENT_CATEGORIES.DRESS,
    color_hex: 'multi',
    color_name: 'Multicolor',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SPRING, SEASON_TAGS.SUMMER],
    is_favorite: true,
  },
  {
    name: 'Chaqueta Café',
    category: GARMENT_CATEGORIES.TOP,
    color_hex: '#A67B5B',
    color_name: 'Café',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.FALL, SEASON_TAGS.WINTER],
    is_favorite: false,
  },
  {
    name: 'Jackets',
    category: GARMENT_CATEGORIES.TOP,
    color_hex: '#7BA3BE',
    color_name: 'Azul claro',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.FALL, SEASON_TAGS.WINTER],
    is_favorite: false,
  },
  {
    name: 'Jeans Verde Esmeralda',
    category: GARMENT_CATEGORIES.BOTTOM,
    color_hex: '#88A498',
    color_name: 'Verde',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SPRING, SEASON_TAGS.FALL],
    is_favorite: false,
  },
  {
    name: 'Mocasines',
    category: GARMENT_CATEGORIES.SHOES,
    color_hex: '#5C4033',
    color_name: 'Café oscuro',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SPRING, SEASON_TAGS.FALL],
    is_favorite: false,
  },
  {
    name: 'Sandalias',
    category: GARMENT_CATEGORIES.SHOES,
    color_hex: '#D2B48C',
    color_name: 'Beige',
    size: 'M',
    quantity: 1,
    season_tags: [SEASON_TAGS.SUMMER],
    is_favorite: false,
  },
  {
    name: 'Bufanda Gris',
    category: GARMENT_CATEGORIES.ACCESSORY,
    color_hex: '#808080',
    color_name: 'Gris',
    size: null,
    quantity: 1,
    season_tags: [SEASON_TAGS.FALL, SEASON_TAGS.WINTER],
    is_favorite: false,
  },
];

export async function hasExistingGarments(userId) {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.GARMENTS),
    where('user_id', '==', userId),
    limit(1),
  );
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function seedForUser(userId, userName = 'Nati') {
  const alreadySeeded = await hasExistingGarments(userId);
  if (alreadySeeded) {
    logger.debug(`[Seed] Usuario ${userId} ya tiene prendas. Seed omitido.`);
    return { skipped: true };
  }

  logger.debug(`[Seed] Poblando datos para usuario ${userId}...`);

  const createdGarments = [];
  for (const garment of SEED_GARMENTS) {
    try {
      const created = await createGarment(userId, garment);
      createdGarments.push(created);
      logger.debug(`[Seed] Prenda creada: ${created.name} [${created.category}]`);
    } catch (err) {
      logger.error(`[Seed] Error creando ${garment.name}:`, err.message);
    }
  }

  logger.debug(`[Seed] Poblado completado. ${createdGarments.length}/${SEED_GARMENTS.length} prendas creadas.`);
  return { skipped: false, garments: createdGarments };
}

export async function validateFirestoreData(userId) {
  const checks = [];
  const garments = await getGarmentsByUser(userId);
  checks.push({ check: 'garments_exist', ok: garments.length > 0, count: garments.length });

  const catCounts = {};
  for (const g of garments) {
    catCounts[g.category] = (catCounts[g.category] || 0) + 1;
  }

  const hasTop = (catCounts[GARMENT_CATEGORIES.TOP] || 0) > 0;
  const hasBottom = (catCounts[GARMENT_CATEGORIES.BOTTOM] || 0) > 0;
  const hasShoes = (catCounts[GARMENT_CATEGORIES.SHOES] || 0) > 0;
  const hasDress = (catCounts[GARMENT_CATEGORIES.DRESS] || 0) > 0;
  const hasAccessory = (catCounts[GARMENT_CATEGORIES.ACCESSORY] || 0) > 0;
  checks.push({ check: 'has_top', ok: hasTop, count: catCounts[GARMENT_CATEGORIES.TOP] || 0 });
  checks.push({ check: 'has_bottom', ok: hasBottom, count: catCounts[GARMENT_CATEGORIES.BOTTOM] || 0 });
  checks.push({ check: 'has_shoes', ok: hasShoes, count: catCounts[GARMENT_CATEGORIES.SHOES] || 0 });
  checks.push({ check: 'has_dress', ok: hasDress, count: catCounts[GARMENT_CATEGORIES.DRESS] || 0 });
  checks.push({ check: 'has_accessory', ok: hasAccessory, count: catCounts[GARMENT_CATEGORIES.ACCESSORY] || 0 });

  return checks;
}
