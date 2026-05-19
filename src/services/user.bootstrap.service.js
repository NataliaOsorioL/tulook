import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { seedForUser, validateFirestoreData } from '../database/seed';
import { FIRESTORE_COLLECTIONS } from '../utils/constants';
import { createUserProfile, getUserProfile } from './user.service';

const LEGACY_USER_ID = process.env.EXPO_PUBLIC_FIXED_USER_ID || 'seed-user-001';

function snapshotToRecords(snapshot) {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

async function getRecordsByUser(collectionName, userId) {
  const q = query(
    collection(db, collectionName),
    where('user_id', '==', userId),
  );
  const snapshot = await getDocs(q);
  return snapshotToRecords(snapshot);
}

async function getOutfitGarmentsByOutfitIds(outfitIds) {
  const records = [];

  for (let i = 0; i < outfitIds.length; i += 10) {
    const chunk = outfitIds.slice(i, i + 10);
    if (chunk.length === 0) continue;

    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS),
      where('outfit_id', 'in', chunk),
    );
    const snapshot = await getDocs(q);
    records.push(...snapshotToRecords(snapshot));
  }

  return records;
}

function cloneData(record, overrides = {}) {
  const { id, ...data } = record;
  return {
    ...data,
    ...overrides,
    migrated_from_user_id: LEGACY_USER_ID,
    migrated_from_id: id,
    updated_at: serverTimestamp(),
  };
}

function garmentSignature(garment) {
  return [
    garment.name || '',
    garment.category || '',
    garment.subtype || '',
    garment.color_hex || '',
    garment.image_url || '',
    garment.emoji || '',
  ].join('|');
}

async function migrateLegacyUserData(userId) {
  if (!userId || userId === LEGACY_USER_ID) {
    return { migrated: false, reason: 'same-user' };
  }

  const currentGarments = await getRecordsByUser(FIRESTORE_COLLECTIONS.GARMENTS, userId);
  if (currentGarments.some((garment) => garment.migrated_from_user_id === LEGACY_USER_ID)) {
    return { migrated: false, reason: 'already-migrated' };
  }

  const legacyGarments = await getRecordsByUser(FIRESTORE_COLLECTIONS.GARMENTS, LEGACY_USER_ID);
  if (legacyGarments.length === 0) {
    return { migrated: false, reason: 'legacy-empty' };
  }

  const legacyOutfits = await getRecordsByUser(FIRESTORE_COLLECTIONS.OUTFITS, LEGACY_USER_ID);
  const legacyDailyOutfits = await getRecordsByUser(FIRESTORE_COLLECTIONS.DAILY_OUTFITS, LEGACY_USER_ID);
  const legacyOutfitGarments = await getOutfitGarmentsByOutfitIds(
    legacyOutfits.map((outfit) => outfit.id),
  );

  const batch = writeBatch(db);
  const garmentIdMap = new Map();
  const outfitIdMap = new Map();
  const currentGarmentsBySignature = new Map(
    currentGarments.map((garment) => [garmentSignature(garment), garment]),
  );
  let clonedGarments = 0;

  for (const garment of legacyGarments) {
    const existing = currentGarmentsBySignature.get(garmentSignature(garment));
    if (existing) {
      garmentIdMap.set(garment.id, existing.id);
      continue;
    }

    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.GARMENTS));
    garmentIdMap.set(garment.id, ref.id);
    batch.set(ref, cloneData(garment, { user_id: userId }));
    clonedGarments += 1;
  }

  for (const outfit of legacyOutfits) {
    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFITS));
    outfitIdMap.set(outfit.id, ref.id);
    batch.set(ref, cloneData(outfit, { user_id: userId }));
  }

  for (const outfitGarment of legacyOutfitGarments) {
    const newOutfitId = outfitIdMap.get(outfitGarment.outfit_id);
    const newGarmentId = garmentIdMap.get(outfitGarment.garment_id);
    if (!newOutfitId || !newGarmentId) continue;

    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS));
    batch.set(
      ref,
      cloneData(outfitGarment, {
        outfit_id: newOutfitId,
        garment_id: newGarmentId,
      }),
    );
  }

  for (const dailyOutfit of legacyDailyOutfits) {
    const newOutfitId = outfitIdMap.get(dailyOutfit.outfit_id);
    if (!newOutfitId) continue;

    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.DAILY_OUTFITS));
    batch.set(
      ref,
      cloneData(dailyOutfit, {
        user_id: userId,
        outfit_id: newOutfitId,
      }),
    );
  }

  await batch.commit();

  return {
    migrated: true,
    garments: clonedGarments,
    reusedGarments: legacyGarments.length - clonedGarments,
    outfits: legacyOutfits.length,
    outfitGarments: legacyOutfitGarments.length,
    dailyOutfits: legacyDailyOutfits.length,
  };
}

export async function initializeAppForUser(userId, email) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      await createUserProfile(userId, {
        name: email?.split('@')[0] || 'Usuario',
        email: email || '',
      });
    }

    const migration = await migrateLegacyUserData(userId);
    if (migration.migrated) {
      console.log('[Bootstrap] Datos legacy migrados:', migration);
    }

    const seed = await seedForUser(userId);
    if (!seed.skipped) {
      console.log('[Bootstrap] Seed inicial creado para usuario nuevo');
    }

    const validation = await validateFirestoreData(userId);
    for (const v of validation) {
      const icon = v.ok ? 'ok' : 'error';
      console.log(`[Bootstrap] Validacion ${icon} ${v.check}: ${v.count || 0}`);
    }
  } catch (err) {
    console.warn('[Bootstrap] Error en inicializacion:', err.message);
  }
}
