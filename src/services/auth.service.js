import { getUserProfile, createUserProfile } from './user.service';

const FIXED_USER_ID = process.env.EXPO_PUBLIC_FIXED_USER_ID || 'seed-user-001';

export function initAuth() {
  // no-op — auth no se usa en esta fase
}

export async function ensureSignedIn() {
  try {
    const profile = await getUserProfile(FIXED_USER_ID);
    if (!profile) {
      await createUserProfile(FIXED_USER_ID, {
        name: 'Nati',
        email: 'nati@tulook.app',
      });
    }
  } catch {
    // continuar aunque falle la creación del perfil
  }
  return FIXED_USER_ID;
}

export function getCurrentUserId() {
  return FIXED_USER_ID;
}
