
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore'; // Import Firestore if needed later

// Your web app's Firebase configuration
// Ensure these environment variables are set in your .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Crucial for Realtime Database
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the configuration to help debug environment variable issues
// Be careful not to log sensitive keys in production environments
console.log("Firebase Config Loaded:", {
    apiKeyProvided: !!firebaseConfig.apiKey, // Log presence, not value
    authDomain: firebaseConfig.authDomain,
    databaseURL: firebaseConfig.databaseURL, // Log the URL causing the issue
    projectId: firebaseConfig.projectId,
    storageBucketProvided: !!firebaseConfig.storageBucket,
    messagingSenderIdProvided: !!firebaseConfig.messagingSenderId,
    appIdProvided: !!firebaseConfig.appId,
});

// **Critical Validation for databaseURL**
if (!firebaseConfig.databaseURL) {
    console.error(
        "FirebaseError: FATAL - Missing 'databaseURL' in Firebase configuration. \n" +
        "Please ensure the 'NEXT_PUBLIC_FIREBASE_DATABASE_URL' environment variable is set correctly in your '.env.local' file (or your deployment environment). \n" +
        "The URL should look like: https://<your-project-id>-default-rtdb.<region>.firebasedatabase.app OR https://<your-project-id>.firebaseio.com"
    );
    // Optionally throw an error here to prevent the app from proceeding without a DB URL
    // throw new Error("Missing Firebase Database URL configuration.");
} else if (!firebaseConfig.databaseURL.startsWith('https://') || (!firebaseConfig.databaseURL.includes('.firebaseio.com') && !firebaseConfig.databaseURL.includes('.firebasedatabase.app'))) {
     console.warn(
         "FirebaseWarning: The provided 'databaseURL' might be invalid. \n" +
         `Current value: ${firebaseConfig.databaseURL}\n` +
         "Expected format: https://<your-project-id>-default-rtdb.<region>.firebasedatabase.app OR https://<your-project-id>.firebaseio.com"
     );
}


if (!firebaseConfig.projectId) {
    console.error("FirebaseError: Missing 'projectId' in Firebase configuration. Check your environment variables (NEXT_PUBLIC_FIREBASE_PROJECT_ID).");
}


// Initialize Firebase
let firebaseApp: FirebaseApp | null = null; // Initialize as null
if (getApps().length === 0) {
  // Only attempt initialization if essential config is present
  if (firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.databaseURL) {
      try {
        firebaseApp = initializeApp(firebaseConfig);
        console.log("Firebase initialized successfully.");
      } catch (error: any) {
        console.error("Firebase initialization error:", error.message);
        // Log the config again on error for easier debugging
        console.error("Firebase config at time of error:", {
          authDomain: firebaseConfig.authDomain,
          databaseURL: firebaseConfig.databaseURL,
          projectId: firebaseConfig.projectId,
        });
        // Handle the error appropriately, maybe show an error message to the user
        // or prevent the app from rendering further if Firebase is critical.
      }
  } else {
       console.error("FirebaseError: Skipping Firebase initialization due to missing essential configuration (apiKey, projectId, or databaseURL). Please check environment variables.");
  }
} else {
  firebaseApp = getApps()[0];
  console.log("Firebase app already exists.");
}

// Get a reference to the Realtime Database service
let database: Database | null = null; // Initialize as null
// Only attempt to get database if firebaseApp was successfully initialized
if (firebaseApp) {
    try {
        database = getDatabase(firebaseApp);
        console.log("Firebase Realtime Database instance obtained.");
    } catch (error: any) {
        console.error("Error getting Firebase Realtime Database instance:", error.message);
        // The error "Cannot parse Firebase url" likely originates here if the URL is malformed *despite* being present.
        console.error("This often happens if the 'databaseURL' in your Firebase config is incorrect or missing. Please verify:", firebaseConfig.databaseURL);
        // Handle the error, potentially setting database to a fallback or throwing
    }
} else {
     console.error("FirebaseError: Cannot get Database instance because Firebase App initialization failed or was skipped.");
}


// Optional: Get Firestore instance if you plan to use it
// let firestore: Firestore | null = null;
// if (firebaseApp) {
//     try {
//         firestore = getFirestore(firebaseApp);
//     } catch (error) {
//         console.error("Error getting Firestore instance:", error);
//     }
// }


// Export potentially null values, components using them should handle this possibility
export { firebaseApp, database /*, firestore */ };
