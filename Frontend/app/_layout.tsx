/**
 * ROOT LAYOUT
 * This is the main layout wrapper for the entire application.
 * It handles global UI elements and navigation structure.
 */
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { LogBox } from 'react-native';

// Ignore specific warnings if needed
LogBox.ignoreLogs(['Warning: ...']); 

export default function RootLayout() {
  // Clean up any stale navigation state on app load
  useEffect(() => {
    // This can help clear any persistent state causing issues
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(screens)" />
      {/* Remove any other screens here that might be causing duplicates */}
    </Stack>
  );
}