import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration from the Firebase console
// Use environment variables for security
const firebaseConfig = {
    apiKey: "AIzaSyBwp0KA3UgdwRcVtYIMsXdaOAoHTZegZHQ",
    authDomain: "slugspace-81ae7.firebaseapp.com",
    projectId: "slugspace-81ae7",
    storageBucket: "slugspace-81ae7.firebasestorage.app",
    messagingSenderId: "678826861270",
    appId: "1:678826861270:web:be59577ba03b06b5d5df77",
    measurementId: "G-8D0LDHW1XP"
};

// Initialize Firebase
let app;
if (!getApps().length) {
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
const analytics = getAnalytics(app);

export { app, auth, db, storage, analytics };
