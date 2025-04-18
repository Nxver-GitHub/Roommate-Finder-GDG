import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Animated } from 'react-native';
import { SwipeableCard, SwipeableCardRef } from './SwipeableCard';
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
const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_OUT_DURATION = 250;

export const SwipeableDeck: React.FC<SwipeableDeckProps> = ({
  profiles,
  onSwipeLeft,
  onSwipeRight,
  onDeckEmpty,
  onRefresh,
  isRefreshing = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentCardRef = useRef<SwipeableCardRef>(null);

  useEffect(() => {
    console.log("Profiles changed, resetting index to 0");
    setCurrentIndex(0);
  }, [profiles]);

  useEffect(() => {
    if (currentIndex >= profiles.length && profiles.length > 0) {
      console.log("Deck is empty, calling onDeckEmpty");
      onDeckEmpty();
    }
  }, [currentIndex, profiles, onDeckEmpty]);

  const handleSwipeComplete = useCallback((direction: 'left' | 'right') => {
    const swipedProfile = profiles[currentIndex];
    if (direction === 'left') {
      onSwipeLeft(swipedProfile);
    } else {
      onSwipeRight(swipedProfile);
    }
    setCurrentIndex(prevIndex => prevIndex + 1);
  }, [currentIndex, profiles, onSwipeLeft, onSwipeRight]);

  const handleManualSwipeLeft = () => {
    currentCardRef.current?.swipeLeft();
  };

  const handleManualSwipeRight = () => {
    currentCardRef.current?.swipeRight();
  };

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

  console.log(`Rendering deck. Current index: ${currentIndex}, Profile count: ${profiles.length}`);

  return (
    <View style={styles.container}>
      <View style={styles.deckContainer}>
        {profiles
          .slice(currentIndex)
          .reverse()
          .map((profile, indexInReversedSlice) => {
            const originalIndex = profiles.length - 1 - indexInReversedSlice;
            const isTopCard = originalIndex === currentIndex;
            
            console.log(`Rendering card: originalIndex=${originalIndex}, isTopCard=${isTopCard}, profileId=${profile.id}`);

            if (originalIndex < currentIndex + 3) {
               return (
                 <SwipeableCard
                   key={profile.id || `deck-card-${currentIndex + (profiles.slice(currentIndex).length - 1 - indexInReversedSlice)}`}
                   ref={isTopCard ? currentCardRef : null}
                   profile={profile}
                   onSwipeComplete={handleSwipeComplete}
                   isFirst={isTopCard}
                 />
               );
            }
            return null;
          })}
      </View>

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
    marginRight: 8,
  },
  refreshText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});