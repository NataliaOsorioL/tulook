import { seedForUser, validateFirestoreData } from '../database/seed';
import { createUserProfile, getUserProfile } from './user.service';

export async function initializeAppForUser(userId, email) {
  try {
    const profile = await getUserProfile(userId);
    if (!profile) {
      await createUserProfile(userId, {
        name: email?.split('@')[0] || 'Usuario',
        email: email || '',
      });
    }

    const seed = await seedForUser(userId);
    if (!seed.skipped) {
    }

    const validation = await validateFirestoreData(userId);
    for (const v of validation) {
      const icon = v.ok ? '✓' : '✗';
    }
  } catch (err) {
    console.warn('[Bootstrap] Error en inicialización:', err.message);
  }
}
