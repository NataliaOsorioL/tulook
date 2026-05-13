import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAIq5sVcVYm2BN-GZ7ZH6Kkg-CHyZOcY1d0',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tulook-1521e.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'tulook-1521e',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tulook-1521e.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_SENDER_ID || '542456438762',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:542456438762:web:5fbf79c0717ae4e6bb1c93',
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;