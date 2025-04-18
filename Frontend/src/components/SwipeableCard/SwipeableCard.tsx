import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Briefcase, Check, X } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

// Define user profile type matching your data structure
interface UserProfileData {
  id?: string;
  basicInfo?: { 
    firstName?: string; 
    lastName?: string; 
    age?: number; 
    occupation?: string;
    bio?: string;
  };
  preferences?: { 
    location?: string; 
    budget?: { min?: number; max?: number }; 
  };
  photoURL?: string | null;
  photos?: string[];
  compatibilityScore?: number;
  [key: string]: any;
}

interface SwipeableCardProps {
  profile: UserProfileData;
  onSwipeComplete: (direction: 'left' | 'right') => void;
  isFirst: boolean;
}

// Define the type for the ref
export interface SwipeableCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  resetPosition: () => void;
}

// Define a placeholder image URI
const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/400/374151/e5e7eb?text=No+Photo';

// Use forwardRef to allow parent component to call methods
export const SwipeableCard = forwardRef<SwipeableCardRef, SwipeableCardProps>(({
  profile,
  onSwipeComplete,
  isFirst,
}, ref) => {
  const position = useRef(new Animated.ValueXY()).current;
  // Create a ref to store the LATEST value of the isFirst prop
  const isFirstRef = useRef(isFirst);

  // Keep the isFirstRef updated whenever the prop changes
  useEffect(() => {
    isFirstRef.current = isFirst;
    // Log when the ref is updated for debugging
    console.log(`Card ${profile.id}: useEffect updated isFirstRef.current to: ${isFirst}`);
  }, [isFirst, profile.id]); // Depend on isFirst prop

  // Define swipe actions internally
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: Platform.OS !== 'web', // Use native driver where possible
    }).start();
  };

  const swipeLeft = () => {
    console.log(`Card ${profile.id}: swipeLeft called`);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 }, // Animate off-screen left
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      console.log(`Card ${profile.id}: swipeLeft finished, calling onSwipeComplete`);
      // Call the completion handler AFTER animation
      onSwipeComplete('left');
    });
  };

  const swipeRight = () => {
    console.log(`Card ${profile.id}: swipeRight called`);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 }, // Animate off-screen right
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      console.log(`Card ${profile.id}: swipeRight finished, calling onSwipeComplete`);
      // Call the completion handler AFTER animation
      onSwipeComplete('right');
    });
  };

  // Expose methods via ref for the Deck to use
  useImperativeHandle(ref, () => ({
    swipeLeft,
    swipeRight,
    resetPosition,
  }));

  // Keep the PanResponder instance stable with useRef,
  // but make sure callbacks read the latest state from isFirstRef.current.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Read the latest value from the ref
        const shouldSet = isFirstRef.current;
        console.log(`Card ${profile.id}: onStartShouldSetPanResponder - shouldSet = ${shouldSet}`);
        return shouldSet;
      },
      onPanResponderMove: (event, gesture) => {
        // Only move if this card is currently the first one
        if (isFirstRef.current) {
          position.setValue({ x: gesture.dx, y: gesture.dy });
        }
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (isFirstRef.current) {
          console.log(`Card ${profile.id}: PanResponder granted`);
        }
      },
      onPanResponderRelease: (event, gesture) => {
        if (!isFirstRef.current) return; // Check ref again
        console.log(`Card ${profile.id}: PanResponder released, dx=${gesture.dx}`);
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Reset only if it was the active card
        if (isFirstRef.current) {
          console.log(`Card ${profile.id}: PanResponder terminated, resetting position.`);
          resetPosition();
        }
      },
      onShouldBlockNativeResponder: (evt, gestureState) => true,
    })
  ).current; // Keep .current here

  // Calculate rotation and opacity based on position
  const rotate = position.x.interpolate({
      inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      outputRange: ['-10deg', '0deg', '10deg'],
      extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
      inputRange: [0, SWIPE_THRESHOLD / 2],
      outputRange: [0, 1],
      extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
      inputRange: [-SWIPE_THRESHOLD / 2, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
  });

  // Apply animated styles
  const animatedCardStyle = {
    transform: [
        { rotate },
        ...position.getTranslateTransform()
    ],
  };

  // Get image URL
  const mainImageUrl = profile.photoURL || 
                      (profile.photos && profile.photos.length > 0 ? profile.photos[0] : null) || 
                      PLACEHOLDER_IMAGE_URI;

  // Prepare name, age, etc.
  const displayName = `${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.trim() || 'User';
  const age = profile.basicInfo?.age || '';
  const occupation = profile.basicInfo?.occupation || '';
  const location = profile.preferences?.location || '';
  const bio = profile.basicInfo?.bio || '';

  return (
    <Animated.View
      style={[
        styles.card,
        animatedCardStyle,
        { zIndex: isFirst ? 1 : 0 }, // Simple zIndex based on being top
      ]}
      // Conditionally attach handlers based on the 'isFirst' PROP.
      // The handlers themselves check 'isFirstRef.current' internally.
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <Image source={{ uri: mainImageUrl }} style={styles.image} />

      {/* Compatibility Score Badge */}
      {profile.compatibilityScore !== undefined && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreText}>
            {Math.round(profile.compatibilityScore)}% Match
          </Text>
        </View>
      )}

      {/* Icon Overlays for Like/Nope */}
      {isFirst && ( // Only show indicators on the top card
        <>
          {/* Check Mark for Like */}
          <Animated.View style={[styles.overlayIcon, styles.likeIconContainer, { opacity: likeOpacity }]}>
            <Check size={100} color="#4CAF50" strokeWidth={4} />
          </Animated.View>
          {/* X Mark for Nope */}
          <Animated.View style={[styles.overlayIcon, styles.nopeIconContainer, { opacity: nopeOpacity }]}>
            <X size={100} color="#F44336" strokeWidth={4} />
          </Animated.View>
        </>
      )}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.infoContainer}
      >
        <Text style={styles.name}>
          {displayName}{age ? `, ${age}` : ''}
        </Text>
        
        {occupation && (
          <View style={styles.detailRow}>
            <Briefcase size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.occupation}>{occupation}</Text>
          </View>
        )}
        
        {location && (
          <View style={styles.detailRow}>
            <MapPin size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.location}>{location}</Text>
          </View>
        )}
        
        {bio && (
          <Text numberOfLines={3} style={styles.bio}>
            {bio}
          </Text>
        )}
      </LinearGradient>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  card: {
    position: 'absolute', // Important for stacking
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a', // Dark background fallback
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  // Styles for the Icon Overlays
  overlayIcon: {
    position: 'absolute',
    top: '50%', // Center vertically roughly
    marginTop: -50, // Adjust based on icon size
    width: 100, // Container size
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Optional subtle background
    borderRadius: 50, // Make it circular
  },
  likeIconContainer: {
    right: 30, // Position on the right
    transform: [{ rotate: '15deg' }], // Tilt slightly
  },
  nopeIconContainer: {
    left: 30, // Position on the left
    transform: [{ rotate: '-15deg' }], // Tilt slightly
  },
  // --- End Icon Overlay Styles ---
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 40, // Gradient start point
  },
  name: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  occupation: {
    color: 'white',
    fontSize: 16,
  },
  location: {
    color: 'white',
    fontSize: 16,
  },
  bio: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  scoreBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(8, 145, 178, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});