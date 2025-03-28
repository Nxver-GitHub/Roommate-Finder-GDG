import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useSecondaryTabs } from '../../../src/context/SecondaryTabsContext';

// This is a placeholder for all conversations
// In most apps, this would redirect to the messages screen
export default function ConversationsIndexScreen() {
  const router = useRouter();
  
  // Redirect to messages screen
  React.useEffect(() => {
    router.replace('/(screens)/messages');
  }, []);
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting to messages...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  text: {
    color: '#fff',
    fontSize: 16,
  },
}); 