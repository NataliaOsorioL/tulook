import {
  collection, query, where, getDocs, addDoc, getDoc, doc,
  orderBy, writeBatch, serverTimestamp, limit,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIRESTORE_COLLECTIONS } from '../utils/constants';
import { getGarmentsByUser, getGarmentsByIds, incrementGarmentUsage } from './garment.service';
import {
  selectDailyOutfitGarments,
  canGenerateOutfit,
  getDateString,
  todayString,
} from '../utils/outfit-generator-v2';

function snapshotToArray(snapshot) {
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getDailyOutfit(userId, date = todayString()) {
  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.DAILY_OUTFITS),
    where('user_id', '==', userId),
    where('assigned_date', '==', date),
    limit(1),
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export async function getRecentOutfitGarmentIds(userId, daysBack = 14) {
  const sinceDate = getDateString(
    new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000),
  );

  const q = query(
    collection(db, FIRESTORE_COLLECTIONS.DAILY_OUTFITS),
    where('user_id', '==', userId),
    where('assigned_date', '>=', sinceDate),
    orderBy('assigned_date', 'desc'),
  );
  const snapshot = await getDocs(q);
  const dailyRecords = snapshotToArray(snapshot);
  if (dailyRecords.length === 0) return new Set();

  const outfitIds = [...new Set(dailyRecords.map((r) => r.outfit_id))];

  const allGarmentIds = new Set();
  for (let i = 0; i < outfitIds.length; i += 10) {
    const batch = outfitIds.slice(i, i + 10);
    const ogQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS),
      where('outfit_id', 'in', batch),
    );
    const ogSnapshot = await getDocs(ogQuery);
    snapshotToArray(ogSnapshot).forEach((og) => allGarmentIds.add(og.garment_id));
  }

  return allGarmentIds;
}

export async function getOutfitWithGarments(outfitId) {
  const outfitSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.OUTFITS, outfitId));
  if (!outfitSnap.exists()) return null;

  const outfit = { id: outfitSnap.id, ...outfitSnap.data() };

  const ogQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS),
    where('outfit_id', '==', outfitId),
    orderBy('position', 'asc'),
  );
  const ogSnapshot = await getDocs(ogQuery);
  const ogRecords = snapshotToArray(ogSnapshot);

  if (ogRecords.length === 0) {
    return { ...outfit, garment_ids: [], outfit_garments: [], garments: [] };
  }

  const garmentIds = ogRecords.map((og) => og.garment_id);
  const garments = await getGarmentsByIds(garmentIds);

  const garmentsMap = new Map(garments.map((g) => [g.id, g]));

  const orderedGarments = ogRecords
    .map((og) => garmentsMap.get(og.garment_id))
    .filter(Boolean);

  return {
    ...outfit,
    garment_ids: garmentIds,
    outfit_garments: ogRecords,
    garments: orderedGarments,
    description: outfit.name,
  };
}

export async function generateAndSaveDailyOutfit(userId, weatherData = null) {
  const date = todayString();
  const allGarments = await getGarmentsByUser(userId);

  const validation = canGenerateOutfit(allGarments);
  if (!validation.allowed) {
    return { success: false, reason: validation.reason, outfit: null };
  }

  const recentGarmentIds = await getRecentOutfitGarmentIds(userId);
  const weatherTemp = weatherData?.temperature ?? null;

  const { garments: selectedItems, name, description, wasAutomatic } =
    selectDailyOutfitGarments(allGarments, recentGarmentIds, weatherTemp);

  if (selectedItems.length === 0) {
    return { success: false, reason: 'No se pudo seleccionar ninguna prenda', outfit: null };
  }

  const batch = writeBatch(db);

  const outfitRef = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFITS));
  batch.set(outfitRef, {
    user_id: userId,
    name,
    is_automatic: wasAutomatic,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  for (const item of selectedItems) {
    const ogRef = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS));
    batch.set(ogRef, {
      outfit_id: outfitRef.id,
      garment_id: item.garment_id,
      position: item.position,
      category_used: item.category_used,
    });
  }

  const dailyRef = doc(collection(db, FIRESTORE_COLLECTIONS.DAILY_OUTFITS));
  batch.set(dailyRef, {
    user_id: userId,
    outfit_id: outfitRef.id,
    assigned_date: date,
    weather_condition: weatherData?.description || null,
    weather_temp: weatherData?.temperature || null,
    weather_icon: weatherData?.icon || null,
    was_shown: false,
    created_at: serverTimestamp(),
  });

  await batch.commit();

  const garmentIds = selectedItems.map((item) => item.garment_id);
  incrementGarmentUsage(garmentIds).catch(() => {});

  return {
    success: true,
    reason: null,
    outfit: {
      id: outfitRef.id,
      daily_id: dailyRef.id,
      name,
      description,
      is_automatic: wasAutomatic,
      garment_ids: garmentIds,
      garments: selectedItems.map((item) => item.garment_data),
    },
  };
}

export async function saveOutfitManually(userId, selectedGarments, description) {
  const batch = writeBatch(db);

  const outfitRef = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFITS));
  batch.set(outfitRef, {
    user_id: userId,
    name: description || 'Outfit manual',
    is_automatic: false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  let position = 1;
  for (const garment of selectedGarments) {
    const ogRef = doc(collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS));
    batch.set(ogRef, {
      outfit_id: outfitRef.id,
      garment_id: garment.id,
      position: position++,
      category_used: garment.category,
    });
  }

  await batch.commit();

  const garmentIds = selectedGarments.map((g) => g.id);
  incrementGarmentUsage(garmentIds).catch(() => {});

  return {
    success: true,
    outfit: {
      id: outfitRef.id,
      name: description || 'Outfit manual',
      is_automatic: false,
      garment_ids: garmentIds,
      garments: selectedGarments,
    },
  };
}

export async function getOrGenerateDailyOutfit(userId, weatherData = null) {
  const date = todayString();
  const existing = await getDailyOutfit(userId, date);

  if (existing) {
    const fullOutfit = await getOutfitWithGarments(existing.outfit_id);
    if (fullOutfit) {
      return {
        isNew: false,
        outfit: fullOutfit,
        daily_record: existing,
      };
    }
  }

  const result = await generateAndSaveDailyOutfit(userId, weatherData);
  return {
    isNew: true,
    outfit: result.outfit,
    daily_record: null,
    error: result.success ? null : result.reason,
  };
}

/**
 * Delete ALL outfit data for a user (outfits, outfit_garments, daily_outfits).
 * Used when the user empties their entire closet.
 */
export async function deleteAllUserOutfits(userId) {
  // Get all outfits
  const outfitQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.OUTFITS),
    where('user_id', '==', userId),
  );
  const outfitSnapshot = await getDocs(outfitQuery);
  const outfitIds = outfitSnapshot.docs.map((d) => d.id);

  // Delete outfit_garments in batches of 10 (Firestore 'in' limit)
  for (let i = 0; i < outfitIds.length; i += 10) {
    const chunk = outfitIds.slice(i, i + 10);
    const ogQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.OUTFIT_GARMENTS),
      where('outfit_id', 'in', chunk),
    );
    const ogSnapshot = await getDocs(ogQuery);
    if (ogSnapshot.size > 0) {
      const batch = writeBatch(db);
      ogSnapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Delete daily_outfits (in batches of 500)
  const dailyQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.DAILY_OUTFITS),
    where('user_id', '==', userId),
  );
  const dailySnapshot = await getDocs(dailyQuery);
  if (dailySnapshot.size > 0) {
    for (let i = 0; i < dailySnapshot.docs.length; i += 500) {
      const batch = writeBatch(db);
      dailySnapshot.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }

  // Delete outfits (500 per batch)
  for (let i = 0; i < outfitIds.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = outfitIds.slice(i, i + 500);
    for (const id of chunk) {
      batch.delete(doc(db, FIRESTORE_COLLECTIONS.OUTFITS, id));
    }
    await batch.commit();
  }

  return { outfitsDeleted: outfitIds.length };
}
