import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export async function login(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    console.warn('[Auth] Error al iniciar sesion:', {
      code: error?.code,
      message: error?.message,
      serverMessage: error?.customData?._tokenResponse?.error?.message,
    });
    console.warn(
      `[Auth] code=${error?.code || 'sin-code'} message=${error?.message || 'sin-message'}`
    );
    throw error;
  }
}

export async function registerUser(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  await signOut(auth);
}

export function onAuthChanged(callback) {
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

const ERROR_MESSAGES = {
  'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
  'auth/wrong-password': 'Contraseña incorrecta.',
  'auth/invalid-credential': 'Correo electrónico o contraseña incorrectos.',
  'auth/invalid-login-credentials': 'Correo electrónico o contraseña incorrectos.',
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/missing-email': 'Ingresa tu correo electrónico.',
  'auth/missing-password': 'Ingresa tu contraseña.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a Internet.',
  'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/requires-recent-login': 'Debes iniciar sesión de nuevo para continuar.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo y contraseña no está habilitado.',
  'auth/api-key-not-valid': 'Error de configuración: la API key de Firebase no es válida.',
  'auth/invalid-api-key': 'Error de configuración: la API key de Firebase no es válida.',
  'auth/app-not-authorized': 'Esta app no está autorizada para usar Firebase Auth.',
  'auth/unauthorized-domain': 'Este dominio no está autorizado en Firebase Auth.',
  'auth/configuration-not-found': 'Firebase Auth no está configurado para este proyecto.',
  'auth/internal-error': 'Firebase devolvió un error interno. Intenta de nuevo.',
  'auth/claims-too-large': 'Error interno. Intenta de nuevo.',
  'auth/id-token-expired': 'La sesión expiró. Inicia sesión de nuevo.',
};

export function getAuthErrorMessage(error) {
  const message = error?.message || '';
  const rawCode = error?.code || message.match(/\((auth\/[^)]+)\)/)?.[1] || '';
  const code = rawCode.startsWith('auth/api-key-not-valid')
    ? 'auth/api-key-not-valid'
    : rawCode;
  const serverMessage = error?.customData?._tokenResponse?.error?.message;

  if (ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }

  if (serverMessage === 'INVALID_LOGIN_CREDENTIALS') {
    return ERROR_MESSAGES['auth/invalid-login-credentials'];
  }

  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export async function ensureSignedIn() {
  const user = getCurrentUser();
  if (user) return user.uid;
  throw new Error('Usuario no autenticado');
}
