import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

if (!apiKey) {
  throw new Error(
    '[Firebase] EXPO_PUBLIC_FIREBASE_API_KEY no está definida. Verifica que el archivo .env exista y que la variable esté presente. Luego reinicia con: npx expo start -c'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
