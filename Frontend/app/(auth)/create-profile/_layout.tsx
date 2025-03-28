import React from 'react';
import { Stack } from 'expo-router';
import { ProfileCreationProvider } from '../../../src/contexts/ProfileCreationContext';

export default function ProfileCreationLayout() {
  return (
    <ProfileCreationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </ProfileCreationProvider>
  );
} 