import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration from the Firebase console
// Use environment variables for security
const firebaseConfig = {
    // Use process.env to access environment variables
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
if (!getApps().length) {
  // Add basic validation to check if required variables are loaded
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.error("ERROR: Firebase configuration is missing required environment variables (API Key or Project ID). Check your .env file and ensure Metro server was restarted.");
      // Depending on the app's structure, you might throw an error here
      // or return early/show an error UI state.
      // For now, we'll log the error.
  }

  app = initializeApp(firebaseConfig);
  // Initialize Auth with persistence for React Native
  initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApp();
}



const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
// Initialize analytics only if measurementId is available
const analytics = firebaseConfig.measurementId ? getAnalytics(app) : null;

export { app, auth, db, storage, analytics };
