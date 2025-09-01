
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, browserLocalPersistence } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  // Always use the Firebase auth domain for auth flows
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'pathfinder-ai-slfsq.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let provider: GoogleAuthProvider;


// Check if all required Firebase config keys are present
const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

if (isFirebaseConfigured) {
    // Initialize Firebase for client-side usage, ensuring it's only done once.
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Configure auth settings
    auth.useDeviceLanguage();
    
    db = getFirestore(app);
    storage = getStorage(app);
    provider = new GoogleAuthProvider();
    
    // Configure auth persistence and settings
    auth.setPersistence(browserLocalPersistence).catch(console.error);
    
    // Configure Google Auth Provider
    provider.setCustomParameters({
        prompt: 'select_account'
    });
} else {
    console.warn("Firebase configuration is missing or incomplete. Firebase services will be disabled.");
    // Provide mock/dummy objects to prevent crashes when config is missing
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
    provider = {} as GoogleAuthProvider;
}


export { app, auth, db, storage, isFirebaseConfigured, provider };
