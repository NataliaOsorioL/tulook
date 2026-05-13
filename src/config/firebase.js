import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIq5sVcVYm2BN-GZ7ZH6Kkg-CHyZOcY1d0",
  authDomain: "tulook-1521e.firebaseapp.com",
  projectId: "tulook-1521e",
  storageBucket: "tulook-1521e.appspot.com",
  messagingSenderId: "542456438762",
  appId: "1:542456438762:web:5fbf79c0717ae4e6bb1c93",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export default app;