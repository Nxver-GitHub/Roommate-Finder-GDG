import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/theme';

export default function AuthLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        contentStyle: {
          backgroundColor: COLORS.background.default
        }
      }} 
    />
  );
} 