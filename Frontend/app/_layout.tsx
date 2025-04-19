import 'react-native-get-random-values'; // <-- ADD THIS LINE AT THE VERY TOP

/**
 * ROOT LAYOUT
 * This is the main layout wrapper for the entire application.
 * It handles global UI elements and navigation structure.
 */
import React, { useEffect, useState, useCallback } from 'react';
import { Stack, SplashScreen, useRouter, useSegments, usePathname } from 'expo-router';
import { LogBox, View, ActivityIndicator } from 'react-native';
import { User } from 'firebase/auth'; // Import User type from firebase/auth
import { authStateListener } from '../src/firebase/auth'; // Adjust path if needed
// Import necessary Firestore functions
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../src/firebase/config'; // Import db instance
import { COLORS } from '../src/utils/theme';

// Ignore specific warnings if needed
LogBox.ignoreLogs(['Warning: ...']); 

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Placeholder type for profile - replace with your actual type later
type UserProfile = { isProfileComplete?: boolean; [key: string]: any } | null;

export default function RootLayout() {
  const [authUser, setAuthUser] = useState<User | null>(null); // Firebase Auth user
  const [userProfile, setUserProfile] = useState<UserProfile>(null); // Firestore profile data
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Auth loading state
  // Profile loading is slightly different now - it's loading until the first snapshot arrives
  const [isProfileLoading, setIsProfileLoading] = useState(true); 
  const router = useRouter();
  const segments = useSegments(); // Gets the current navigation segments
  const pathname = usePathname(); // Get current pathname

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribeAuth = authStateListener((firebaseUser) => {
      console.log('Auth state changed. User:', firebaseUser?.uid ?? 'null');
      setAuthUser(firebaseUser);
      if (!firebaseUser) {
        // If user logs out, clear profile and stop profile loading
        setUserProfile(null);
        setIsProfileLoading(false); 
      } else {
        // If user logs in, start profile loading until snapshot arrives
        setIsProfileLoading(true); 
      }
      setIsAuthLoading(false); 
    });

    // Cleanup subscription on unmount
    return () => {
      console.log('Unsubscribing from auth state listener');
      unsubscribeAuth();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect for Listening to Profile Data changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    if (authUser?.uid) {
      console.log('Auth user detected, setting up profile listener...');
      setIsProfileLoading(true); // Ensure loading is true while listener sets up
      const userDocRef = doc(db, 'users', authUser.uid);

      unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const profileData = { id: docSnap.id, ...docSnap.data() };
          console.log('Profile snapshot received:', profileData ? 'Found' : 'Not Found', 'isComplete:', profileData?.isProfileComplete);
          setUserProfile(profileData);
        } else {
          console.warn("Profile snapshot: No such document for ID:", authUser.uid);
          setUserProfile(null); // Set profile to null if document doesn't exist
        }
        setIsProfileLoading(false); // Stop loading once the first snapshot arrives (or confirms non-existence)
      }, (error) => {
        console.error("Error listening to profile snapshot:", error);
        setUserProfile(null); // Clear profile on error
        setIsProfileLoading(false); // Stop loading on error
      });

    } else {
      // No user logged in, clear profile and ensure listener is cleaned up
      setUserProfile(null);
      setIsProfileLoading(false); // Not loading profile if no user
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }
       console.log('No auth user, profile listener not active.');
    }

    // Cleanup function for the profile listener
    return () => {
      if (unsubscribeProfile) {
        console.log('Unsubscribing from profile listener');
        unsubscribeProfile();
      }
    };
  }, [authUser]); // Re-run listener setup ONLY when authUser changes

  // Effect for Navigation Logic
  useEffect(() => {
    // Now wait for BOTH auth and the profile listener's first result
    const isLoading = isAuthLoading || isProfileLoading; 

    if (isLoading) {
      console.log(`Still loading: Auth=${isAuthLoading}, Profile=${isProfileLoading}`);
      return; // Don't navigate until loaded
    }

     // Hide splash screen once everything is loaded
    SplashScreen.hideAsync().catch(console.warn); // Handle potential error hiding splash

    const inAuthGroup = segments[0] === '(auth)';
    // Adjusted check to ensure it's exactly the create-profile index route
    const inCreateProfileScreen = pathname === '/(auth)/create-profile'; 
    const inAppGroup = segments[0] === '(screens)';

    console.log(`Navigation Check: isLoading=${isLoading}, User=${authUser?.uid}, Profile Complete=${userProfile?.isProfileComplete}, Path=${pathname}, InAuth=${inAuthGroup}, InCreateProfile=${inCreateProfileScreen}, InApp=${inAppGroup}`);

    if (authUser) {
      // --- User is Logged In ---
      const profileIsActuallyComplete = userProfile?.isProfileComplete === true;

      if (!profileIsActuallyComplete) {
        // Profile incomplete or doesn't exist
        if (!inCreateProfileScreen) {
          console.log(`Redirecting to create-profile (Profile Complete: ${profileIsActuallyComplete})...`);
          router.replace('/(auth)/create-profile');
        } else {
           console.log('Already in create-profile, staying.');
        }
      } else {
        // Profile is complete
        if (!inAppGroup) {
          console.log('Profile complete, redirecting to (screens)...');
          router.replace('/(screens)');
        } else {
          console.log('Profile complete and already in (screens), staying.');
        }
      }
    } else {
      // --- User is Logged Out ---
      // Redirect to login if not already in an auth screen (and not create-profile)
      if (!inAuthGroup || inCreateProfileScreen) { 
        console.log('User logged out, redirecting to (auth)/index...');
        router.replace('/(auth)'); // Go to the main auth screen (likely login)
      } else {
         console.log('User logged out and already in (auth), staying.');
      }
    }
    // Dependencies: Check navigation whenever loading state, user, profile, or location changes
  }, [isAuthLoading, isProfileLoading, authUser, userProfile, segments, router, pathname]); 

  // Loading indicator display
  const isLoading = isAuthLoading || (!!authUser && isProfileLoading);
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background.default }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Return the Stack
  return (
    <Stack 
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: COLORS.background.default,
        },
        headerTitleStyle: {
          color: COLORS.text.primary,
          fontWeight: '600',
        },
        headerTintColor: COLORS.text.primary,
        contentStyle: {
          backgroundColor: COLORS.background.default,
        },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(screens)" />
    </Stack>
  );
}