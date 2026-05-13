import {
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, doc,
  deleteDoc, writeBatch, serverTimestamp, increment,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIRESTORE_COLLECTIONS } from '../utils/constants';
import { uploadImageToGitHub, deleteImageFromGitHub } from './github.service';

function garmentToObject(doc) {
  return { id: doc.id, ...doc.data() };
}

export async function getGarmentsByUser(userId, opts = {}) {
  const constraints = [where('user_id', '==', userId)];

  if (opts.category) {
    constraints.push(where('category', '==', opts.category));
  }

  const q = query(collection(db, FIRESTORE_COLLECTIONS.GARMENTS), ...constraints);
  const snapshot = await getDocs(q);
  let garments = snapshot.docs.map(garmentToObject);

  garments.sort((a, b) => {
    const aTime = a.created_at?.toMillis?.() ?? a.created_at?.getTime?.() ?? 0;
    const bTime = b.created_at?.toMillis?.() ?? b.created_at?.getTime?.() ?? 0;
    return bTime - aTime;
  });

  if (opts.limit) {
    garments = garments.slice(0, opts.limit);
  }

  return garments;
}

export async function getRecentGarments(userId, maxCount = 3) {
  return getGarmentsByUser(userId, { limit: maxCount });
}

export async function createGarment(userId, data) {
  const now = new Date();
  const garmentData = {
    user_id: userId,
    name: data.name,
    category: data.category,
    color_hex: data.color_hex || '#CCC',
    color_name: data.color_name || null,
    size: data.size || null,
    quantity: data.quantity || 1,
    image_url: data.image_url || null,
    github_path: data.github_path || null,
    github_sha: data.github_sha || null,
    emoji: data.emoji || null,
    is_favorite: data.is_favorite || false,
    season_tags: data.season_tags || [],
    times_used: 0,
    last_used_at: null,
    created_at: now,
    updated_at: now,
  };

  const ref = await addDoc(collection(db, FIRESTORE_COLLECTIONS.GARMENTS), garmentData);
  return { id: ref.id, ...garmentData };
}

export async function incrementGarmentUsage(garmentIds) {
  const now = serverTimestamp();
  const updates = garmentIds.map((id) =>
    updateDoc(doc(db, FIRESTORE_COLLECTIONS.GARMENTS, id), {
      times_used: increment(1),
      last_used_at: now,
      updated_at: now,
    }),
  );
  await Promise.all(updates);
}

export async function getGarmentsByIds(garmentIds) {
  if (garmentIds.length === 0) return [];

  const allGarments = [];
  for (let i = 0; i < garmentIds.length; i += 10) {
    const batch = garmentIds.slice(i, i + 10);
    const q = query(
      collection(db, FIRESTORE_COLLECTIONS.GARMENTS),
      where('__name__', 'in', batch),
    );
    const snapshot = await getDocs(q);
    allGarments.push(...snapshot.docs.map(garmentToObject));
  }
  return allGarments;
}

export async function uploadGarmentImage(userId, localUri) {
  const result = await uploadImageToGitHub(userId, localUri);
  return {
    image_url: result.download_url,
    github_path: result.path,
    github_sha: result.sha,
  };
}

export async function createGarmentFromEmoji(userId, emoji, category) {
  return createGarment(userId, {
    name: emoji,
    category,
    color_hex: '#CCC',
    color_name: null,
    image_url: null,
    quantity: 1,
    is_favorite: false,
    season_tags: [],
    emoji,
  });
}

/**
 * Delete a single garment and its GitHub image (best-effort).
 * Does NOT cascade-delete outfit_garments records — the UI handles orphan references.
 */
export async function deleteGarment(garmentId) {
  const ref = doc(db, FIRESTORE_COLLECTIONS.GARMENTS, garmentId);

  // Try to get garment data for GitHub image cleanup
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      if (data.github_path && data.github_sha) {
        deleteImageFromGitHub(data.github_path, data.github_sha).catch(() => {});
      }
    }
  } catch { /* non-critical */ }

  await deleteDoc(ref);
}

/**
 * Delete ALL garments and all outfit data for a user.
 * Handles batch limits (Firestore max 500 per batch).
 */
export async function deleteAllGarments(userId) {
  // Get all garments
  const garments = await getGarmentsByUser(userId);
  const garmentIds = garments.map((g) => g.id);

  // Best-effort GitHub image cleanup (non-blocking)
  for (const g of garments) {
    if (g.github_path && g.github_sha) {
      deleteImageFromGitHub(g.github_path, g.github_sha).catch(() => {});
    }
  }

  // Batch delete garments (500 per batch)
  for (let i = 0; i < garmentIds.length; i += 500) {
    const batch = writeBatch(db);
    const chunk = garmentIds.slice(i, i + 500);
    for (const id of chunk) {
      batch.delete(doc(db, FIRESTORE_COLLECTIONS.GARMENTS, id));
    }
    await batch.commit();
  }

  return garmentIds.length;
}
