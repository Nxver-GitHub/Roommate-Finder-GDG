import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile, // To set initial display name if needed
  GoogleAuthProvider,
  signInWithCredential, // For native Google Sign-In
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';
import { setUserProfile } from './firestore'; // To create profile doc after signup
import { Alert, Platform } from 'react-native';
// Uncomment for native Google Sign-In
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider as FirebaseAuthGoogleAuthProvider } from 'firebase/auth'; // Alias to avoid name clash if needed
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

// Register the redirect URI handler for web
WebBrowser.maybeCompleteAuthSession();

// Replace with your own values from Google Cloud Console
const GOOGLE_CLIENT_ID = "678826861270-nkag0q3e5ljgo8uf571ibe5i6jkn3ivv.apps.googleusercontent.com"; // Web client ID from Google Cloud Console
const GOOGLE_EXPO_CLIENT_ID = "YOUR_EXPO_CLIENT_ID"; // Expo client ID (if you have one)

// --- Configuration ---
// Define allowed email domains (e.g., '@ucsc.edu', '@ucla.edu')
// IMPORTANT: Client-side validation is NOT secure. Add server-side validation (Cloud Function) later.
const ALLOWED_EMAIL_DOMAINS = ['@ucsc.edu']; // Add more as needed

// --- Email/Password ---

/**
 * Validates email domain and signs up a user.
 * Sends email verification after successful signup.
 * Creates a basic user profile document in Firestore.
 */
export const signUpWithSchoolEmail = async (email, password, name) => {
  // 1. Basic Client-Side Domain Check
  const isValidDomain = ALLOWED_EMAIL_DOMAINS.some(domain => email.endsWith(domain));
  if (!isValidDomain) {
    throw new Error(`Email must be from an allowed domain (${ALLOWED_EMAIL_DOMAINS.join(', ')}).`);
  }

  try {
    // 2. Create Firebase Auth User
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 3. Send Email Verification
    await sendEmailVerification(user);
    console.log('Verification email sent.');

    // 4. Update Firebase Auth Profile
    await updateProfile(user, { displayName: name });

    // 5. Create User Profile in Firestore
    await setUserProfile(user.uid, {
        email: user.email,
        name: name,
        emailVerified: user.emailVerified,
        isProfileComplete: false,
    });

    console.log('User signed up and profile created:', user.uid);
    return userCredential;
  } catch (error) {
    console.error("Sign Up Error:", error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email address is already registered.');
    }
    throw new Error('Sign up failed. Please try again.');
  }
};

export const signInWithEmail = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

// --- Simple Google Sign-In placeholder ---
export const handleGoogleSignIn = async () => {
  // Show a temporary message
  Alert.alert(
    "Google Sign-In Unavailable",
    "Google Sign-In is currently being configured. Please use email/password login for now.",
    [{ text: "OK" }]
  );
  
  // Throw a specific error so the login component can handle it
  throw new Error("GOOGLE_AUTH_DISABLED");
};

// --- General Auth ---

export const signOut = () => {
  console.log('Signing out...');
  return firebaseSignOut(auth);
};

// Listener for auth state changes
export const authStateListener = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      // Potentially add logic here to check email verification status if needed
      // console.log("User is signed in:", user.uid, "Verified:", user.emailVerified);
    } else {
      // User is signed out
      // console.log("User is signed out");
    }
    callback(user); // Pass the user object (or null) to the callback
  });
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Updates the photoURL field of the currently authenticated Firebase user.
 */
export const updateUserAuthProfilePicture = async (photoURL: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    console.error("Cannot update auth profile picture: No user logged in.");
    return false;
  }
  try {
    await updateProfile(user, { photoURL: photoURL });
    console.log("Firebase Auth user photoURL updated successfully.");
    return true;
  } catch (error) {
    console.error("Error updating Firebase Auth user photoURL:", error);
    Alert.alert("Error", "Could not update your main profile picture reference.");
    return false;
  }
};
