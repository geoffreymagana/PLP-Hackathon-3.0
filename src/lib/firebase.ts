// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDOU76hQDJPQh2zXmxAGnzkPwb07RuKl8M",
  authDomain: "pathfinder-ai-slfsq.firebaseapp.com",
  projectId: "pathfinder-ai-slfsq",
  storageBucket: "pathfinder-ai-slfsq.appspot.com",
  messagingSenderId: "1012247995163",
  appId: "1:1012247995163:web:96eed302e3367bcca929be"
};

// Initialize Firebase for client-side usage, ensuring it's only done once.
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
