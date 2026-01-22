import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDORUumZ4o6nDY_5q9AmicoUcSQUTNoemY",
  authDomain: "smartcycle-bdfc9.firebaseapp.com",
  projectId: "smartcycle-bdfc9",
  storageBucket: "smartcycle-bdfc9.firebasestorage.app",
  messagingSenderId: "1052115114708",
  appId: "1:1052115114708:web:35356c5d096742d6e9f941",
  measurementId: "G-62VB3NJH73"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
