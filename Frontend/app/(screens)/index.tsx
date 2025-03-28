import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator, Platform, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { RefreshCcw } from 'lucide-react-native';
import { fetchProfiles } from '../../src/services/mockData';
import { SwipeableDeck } from '../../src/components/SwipeableCard/SwipeableDeck';

export default function HomeScreen() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [matches, setMatches] = useState([]);
  const [emptyState, setEmptyState] = useState(false);

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setEmptyState(false);
      const data = await fetchProfiles();
      setProfiles(data);
      setError('');
    } catch (err) {
      setError('Failed to load profiles');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleSwipeLeft = useCallback((profile) => {
    console.log('Rejected', profile.name);
    // Here you would typically send this info to your backend
  }, []);

  const handleSwipeRight = useCallback((profile) => {
    console.log('Liked', profile.name);
    // Simulate a match with 30% probability
    if (Math.random() < 0.3) {
      setMatches(prev => [...prev, profile]);
      // In a real app, you'd show a match notification here
    }
    // Here you would typically send this info to your backend
  }, []);

  const handleDeckEmpty = useCallback(() => {
    console.log('No more profiles to show');
    setEmptyState(true);
    // In a real app, you might fetch more profiles or show a message
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading potential roommates...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.retryText} onPress={loadProfiles}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (emptyState || (profiles && profiles.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Discover</Text>
        </View>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>You've seen all available profiles</Text>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadProfiles}
          >
            <RefreshCcw size={24} color="#333" />
            <Text style={styles.refreshButtonText}>
              Check for new profiles
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
      </View>

      <View style={styles.deckContainer}>
        <SwipeableDeck
          profiles={profiles}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          onDeckEmpty={handleDeckEmpty}
          onRefresh={loadProfiles}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    marginTop: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 20,
  },
  errorText: {
    color: '#F44336',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryText: {
    color: '#FFD700',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    marginTop: 20,
  },
  refreshButtonText: {
    color: '#333',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  deckContainer: {
    flex: 1,
  },
});