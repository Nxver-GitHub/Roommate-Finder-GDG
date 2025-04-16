import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SwipeableCard } from './SwipeableCard';
import { Check, X, RefreshCw } from 'lucide-react-native';

// Use your actual profile data type
interface UserProfileData {
  id?: string;
  basicInfo?: { 
    firstName?: string; 
    lastName?: string; 
    age?: number; 
  };
  preferences?: { 
    location?: string; 
    budget?: { min?: number; max?: number }; 
  };
  photoURL?: string | null;
  [key: string]: any;
}

interface SwipeableDeckProps {
  profiles: UserProfileData[];
  onSwipeLeft: (profile: UserProfileData) => void;
  onSwipeRight: (profile: UserProfileData) => void;
  onDeckEmpty: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SwipeableDeck: React.FC<SwipeableDeckProps> = ({
  profiles,
  onSwipeLeft,
  onSwipeRight,
  onDeckEmpty,
  onRefresh,
  isRefreshing = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Reset index if profiles change
  useEffect(() => {
    if (profiles.length > 0) {
      setCurrentIndex(0);
    }
  }, [profiles]);

  // Check if deck is empty
  useEffect(() => {
    if (currentIndex >= profiles.length && profiles.length > 0) {
      onDeckEmpty();
    }
  }, [currentIndex, profiles, onDeckEmpty]);

  const handleSwipeLeft = useCallback((profile: UserProfileData) => {
    setCurrentIndex(prev => prev + 1);
    onSwipeLeft(profile);
  }, [onSwipeLeft]);

  const handleSwipeRight = useCallback((profile: UserProfileData) => {
    setCurrentIndex(prev => prev + 1);
    onSwipeRight(profile);
  }, [onSwipeRight]);

  // Manual controls for swiping
  const handleManualSwipeLeft = () => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      handleSwipeLeft(profiles[currentIndex]);
    }
  };

  const handleManualSwipeRight = () => {
    if (profiles.length > 0 && currentIndex < profiles.length) {
      handleSwipeRight(profiles[currentIndex]);
    }
  };

  // If no profiles or all profiles swiped
  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No more profiles to show</Text>
        {onRefresh && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <ActivityIndicator color="#0891b2" />
            ) : (
              <>
                <RefreshCw size={20} color="#fff" style={styles.refreshIcon} />
                <Text style={styles.refreshText}>Find More Roommates</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Render the cards and controls
  return (
    <View style={styles.container}>
      {/* Container for the swipeable cards */}
      <View style={styles.deckContainer}>
        {profiles
          .slice(currentIndex, currentIndex + 3)
          .reverse()
          .map((profile, index) => (
            <SwipeableCard
              key={profile.id || `deck-${currentIndex + index}`}
              profile={profile}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              isFirst={index === profiles.slice(currentIndex, currentIndex + 3).length - 1}
            />
          ))}
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, styles.noButton]}
          onPress={handleManualSwipeLeft}
        >
          <X size={35} color="#F44336" strokeWidth={3} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.button, styles.yesButton]}
          onPress={handleManualSwipeRight}
        >
          <Check size={35} color="#4CAF50" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  deckContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: SCREEN_HEIGHT * 0.7,
    position: 'relative',
    marginTop: 10,
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '70%',
    paddingBottom: 30,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
  },
  noButton: {
    borderColor: '#F44336',
  },
  yesButton: {
    borderColor: '#4CAF50',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 20,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#0891b2',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshIcon: {
    marginRight: 10,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 16,
  }
});