import { Stack } from "expo-router";
import React from "react";

export default function ConversationLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Hide the default header
        animation: "slide_from_right", // Smooth animation
        contentStyle: { backgroundColor: '#121212' }, // Dark background
      }}
    />
  );
} 