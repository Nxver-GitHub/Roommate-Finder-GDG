import React from 'react';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ProfileCreationProvider } from '../../../src/contexts/ProfileCreationContext';
import { COLORS } from '../../../src/utils/theme';

export default function ProfileCreationLayout() {
  return (
    <ProfileCreationProvider>
      <Stack 
        screenOptions={{ 
          headerShown: true,
          headerStyle: { 
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text.primary,
          headerTitle: "Create Profile",
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerBackground: () => (
            <LinearGradient
              colors={['rgba(67, 113, 203, 0.95)', 'rgba(27, 41, 80, 0.9)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{ flex: 1 }}
            />
          ),
        }}
      >
        <Stack.Screen name="index" />
      </Stack>
    </ProfileCreationProvider>
  );
} 