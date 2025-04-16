import React, { useRef, useState } from 'react';
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
  [key: string]: any;
}

interface SwipeableCardProps {
  profile: UserProfileData;
  onSwipeLeft: (profile: UserProfileData) => void;
  onSwipeRight: (profile: UserProfileData) => void;
  isFirst: boolean;
}

// Define a placeholder image URI
const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/400/374151/e5e7eb?text=No+Photo';

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isFirst,
}) => {
  const position = useRef(new Animated.ValueXY()).current;
  
  // Opacity for the text indicators
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2], // Fade in faster
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD / 2, 0], // Fade in faster
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onPanResponderMove: (event, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false, // Required for layout animations like rotation
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeLeft(profile));
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => onSwipeRight(profile));
  };

  // Get the main display image
  const mainImageUrl = profile.photoURL || 
                      (profile.photos && profile.photos.length > 0 ? profile.photos[0] : null) || 
                      PLACEHOLDER_IMAGE_URI;

  // Prepare name, age, etc.
  const displayName = `${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.trim() || 'User';
  const age = profile.basicInfo?.age || '';
  const occupation = profile.basicInfo?.occupation || '';
  const location = profile.preferences?.location || '';
  const bio = profile.basicInfo?.bio || '';

  const cardStyle = {
    transform: [
      {
        rotate: position.x.interpolate({
          inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
          outputRange: ['-15deg', '0deg', '15deg'], // Slightly more rotation
          extrapolate: 'clamp',
        }),
      },
      ...position.getTranslateTransform(),
    ],
  };

  return (
    <Animated.View
      style={[styles.card, cardStyle, { zIndex: isFirst ? 1 : 0 }]} // Ensure top card is interactable
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <Image source={{ uri: mainImageUrl }} style={styles.image} />

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
};

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
  }
});