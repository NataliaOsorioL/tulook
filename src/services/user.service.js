import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { FIRESTORE_COLLECTIONS, TEMPERATURE_UNITS, THEME_OPTIONS } from '../utils/constants';

export async function createUserProfile(uid, { name, email, avatarUrl = null }) {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const now = serverTimestamp();

  const userData = {
    name,
    email,
    avatar_url: avatarUrl,
    temperature_unit: TEMPERATURE_UNITS.CELSIUS,
    theme: THEME_OPTIONS.LIGHT,
    notifications: true,
    location_lat: null,
    location_lng: null,
    created_at: now,
    updated_at: now,
  };

  await setDoc(userRef, userData);
  return { id: uid, ...userData };
}

export async function getUserProfile(uid) {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...snapshot.data() };
}

export async function updateUserProfile(uid, updates) {
  const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
  const data = { ...updates, updated_at: serverTimestamp() };

  await updateDoc(userRef, data);
  return { id: uid, ...data };
}
