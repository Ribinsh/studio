
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore'; // Import Firestore if needed later

// Your web app's Firebase configuration
// Ensure these environment variables are set in your .env.local file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Crucial for Realtime Database
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
let firebaseApp: FirebaseApp;
if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
  console.log("Firebase initialized.");
} else {
  firebaseApp = getApps()[0];
  console.log("Firebase app already exists.");
}

// Get a reference to the Realtime Database service
const database: Database = getDatabase(firebaseApp);
// Optional: Get Firestore instance if you plan to use it
// const firestore: Firestore = getFirestore(firebaseApp);

export { firebaseApp, database /*, firestore */ };
