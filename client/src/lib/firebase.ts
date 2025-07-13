import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Validate Firebase configuration
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.error('❌ Firebase API key is missing. Please check your .env file.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Set session persistence to prevent auto re-authentication
import { setPersistence, browserSessionPersistence } from 'firebase/auth';
setPersistence(auth, browserSessionPersistence).catch(console.error);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Firebase Storage
export const storage = getStorage(app);

// Connect to emulators in development
if (import.meta.env.DEV) {
  try {
    // Only connect if not already connected
    if (!auth.app.options.projectId?.includes('demo-')) {
      // These will only work if you have Firebase emulators running
      // Comment out these lines if you don't want to use emulators
      // connectAuthEmulator(auth, 'http://localhost:9099');
      // connectFirestoreEmulator(db, 'localhost', 8080);
      // connectStorageEmulator(storage, 'localhost', 9199);
    }
  } catch (error) {
    console.log('Emulators not available, using production Firebase');
  }
}

export default app;