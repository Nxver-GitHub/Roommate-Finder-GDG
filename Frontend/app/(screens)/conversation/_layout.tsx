import { Stack } from 'expo-router';

export default function ConversationLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="[id]" 
        options={{
          headerShown: true,
          headerBackTitle: 'Back',
        }} 
      />
      {/* No other screens in this stack */}
    </Stack>
  );
} 