import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SwipeableCard } from './SwipeableCard';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';

// These will be replaced with real user profile types later
type UserProfile = {
  id: string;
  name: string;
  age: number;
  occupation: string;
  bio: string;
  images: string[];
  distance?: number;
  interests?: string[];
};

interface SwipeableDeckProps {
  profiles: UserProfile[];
  onSwipeLeft: (profile: UserProfile) => void;
  onSwipeRight: (profile: UserProfile) => void;
  onDeckEmpty: () => void;
  onRefresh?: () => void;
}

export const SwipeableDeck: React.FC<SwipeableDeckProps> = ({
  profiles,
  onSwipeLeft,
  onSwipeRight,
  onDeckEmpty,
  onRefresh,
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

  const handleSwipeLeft = useCallback((profile: UserProfile) => {
    setCurrentIndex(prev => prev + 1);
    onSwipeLeft(profile);
  }, [onSwipeLeft]);

  const handleSwipeRight = useCallback((profile: UserProfile) => {
    setCurrentIndex(prev => prev + 1);
    onSwipeRight(profile);
  }, [onSwipeRight]);

  // Simplified rendering - we won't render any placeholder UI here
  // The empty state is now fully handled by the HomeScreen
  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Next card (shown underneath current card) */}
      {currentIndex + 1 < profiles.length && (
        <SwipeableCard
          key={`next-${profiles[currentIndex + 1].id}`}
          profile={profiles[currentIndex + 1]}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isFirst={false}
        />
      )}

      {/* Current card (the one user interacts with) */}
      <SwipeableCard
        key={`current-${profiles[currentIndex].id}`}
        profile={profiles[currentIndex]}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        isFirst={true}
      />

      {/* Bottom action buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.button, styles.nopeButton]}
          onPress={() => handleSwipeLeft(profiles[currentIndex])}
        >
          <ThumbsDown size={30} color="#F44336" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.likeButton]}
          onPress={() => handleSwipeRight(profiles[currentIndex])}
        >
          <ThumbsUp size={30} color="#4CAF50" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 120, // Allow space for the action buttons
  },
  actionButtons: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingHorizontal: 50,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  nopeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  likeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
});