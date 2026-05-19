import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '../config/firebase';

export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
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
  'auth/invalid-email': 'El formato del correo electrónico no es válido.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Verifica tu conexión a Internet.',
  'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/requires-recent-login': 'Debes iniciar sesión de nuevo para continuar.',
  'auth/operation-not-allowed': 'El inicio de sesión con correo y contraseña no está habilitado. Contacta al administrador.',
  'auth/api-key-not-valid': 'Error de configuración de la aplicación. La API key no es válida.',
  'auth/claims-too-large': 'Error interno. Intenta de nuevo.',
  'auth/id-token-expired': 'La sesión expiró. Inicia sesión de nuevo.',
};

export function getAuthErrorMessage(error) {
  return ERROR_MESSAGES[error.code] || 'Ocurrió un error inesperado. Intenta de nuevo.';
}

export async function ensureSignedIn() {
  const user = getCurrentUser();
  if (user) return user.uid;
  throw new Error('Usuario no autenticado');
}
