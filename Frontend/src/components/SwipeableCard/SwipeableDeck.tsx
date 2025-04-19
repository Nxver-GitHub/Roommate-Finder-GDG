import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  Animated,
  Platform
} from 'react-native';
import { SwipeableCard, SwipeableCardRef } from './SwipeableCard';
import { Check, X, RefreshCw, Search } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../utils/theme';

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
  
  // Animation refs
  const buttonScaleLeft = useRef(new Animated.Value(1)).current;
  const buttonScaleRight = useRef(new Animated.Value(1)).current;
  const emptyStateAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // When profiles array changes, start with initial index
    console.log("Profiles changed, resetting index to 0");
    setCurrentIndex(0);
  }, [profiles]);

  useEffect(() => {
    // Animate empty state when deck becomes empty
    if (currentIndex >= profiles.length && profiles.length > 0) {
      console.log("Deck is empty, calling onDeckEmpty");
      onDeckEmpty();
      
      // Animate the empty state entrance
      Animated.timing(emptyStateAnimation, {
        toValue: 1,
        duration: 600,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else {
      // Reset animation when cards are available
      emptyStateAnimation.setValue(0);
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
    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleLeft, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(buttonScaleLeft, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
    
    currentCardRef.current?.swipeLeft();
  };

  const handleManualSwipeRight = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleRight, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(buttonScaleRight, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
    
    currentCardRef.current?.swipeRight();
  };

  // Animations for empty state
  const emptyOpacity = emptyStateAnimation;
  const emptyTranslateY = emptyStateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [30, 0]
  });

  if (!profiles || profiles.length === 0 || currentIndex >= profiles.length) {
    return (
      <Animated.View 
        style={[
          styles.emptyContainer,
          {
            opacity: emptyOpacity,
            transform: [{ translateY: emptyTranslateY }]
          }
        ]}
      >
        <LinearGradient
          colors={['rgba(67, 113, 203, 0.2)', 'rgba(59, 183, 149, 0.1)']}
          style={styles.emptyGradient}
        >
          <View style={styles.emptyIconContainer}>
            <Search size={50} color={COLORS.secondary} />
          </View>
          <Text style={styles.emptyText}>No more profiles to show</Text>
          <Text style={styles.emptySubtext}>
            We've run out of potential roommates for now. Try refreshing or adjusting your search filters.
          </Text>
          
          {onRefresh && (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={onRefresh} 
              disabled={isRefreshing}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, '#3667C2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.refreshGradient}
              >
                {isRefreshing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <RefreshCw size={20} color="#fff" style={styles.refreshIcon} />
                    <Text style={styles.refreshText}>Find More Roommates</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </LinearGradient>
      </Animated.View>
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
        <Animated.View style={{ transform: [{ scale: buttonScaleLeft }] }}>
          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={handleManualSwipeLeft}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#F44336', '#E53935']}
              style={styles.buttonGradient}
            >
              <X size={35} color="#FFFFFF" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
        
        <Animated.View style={{ transform: [{ scale: buttonScaleRight }] }}>
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={handleManualSwipeRight}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#43A047']}
              style={styles.buttonGradient}
            >
              <Check size={35} color="#FFFFFF" strokeWidth={3} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
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
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  emptyGradient: {
    width: '100%',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(240, 210, 100, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(240, 210, 100, 0.3)',
  },
  emptyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  refreshButton: {
    width: '100%',
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  refreshGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
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