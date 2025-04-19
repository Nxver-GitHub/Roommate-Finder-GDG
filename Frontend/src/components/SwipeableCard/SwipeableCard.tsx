import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState } from 'react';
import {
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  Text,
  View,
  Image,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Briefcase, Check, X, Star, Heart } from 'lucide-react-native';
import { COLORS, SHADOWS, BORDER_RADIUS, SPACING } from '../../utils/theme';

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
  const scale = useRef(new Animated.Value(isFirst ? 1 : 0.9)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardActiveGlow = useRef(new Animated.Value(0)).current;
  const pulsateAnim = useRef(new Animated.Value(0)).current;
  const wiggleAnim = useRef(new Animated.Value(0)).current;
  
  // Create a ref to store the LATEST value of the isFirst prop
  const isFirstRef = useRef(isFirst);
  
  // State for sparkle animations
  const [sparkleOpacity] = useState(Array.from({ length: 4 }, () => new Animated.Value(0)));
  const [sparklePositions] = useState(
    Array.from({ length: 4 }, () => ({
      x: Math.random() * SCREEN_WIDTH * 0.9,
      y: Math.random() * 400,
    }))
  );

  // Keep the isFirstRef updated whenever the prop changes
  useEffect(() => {
    isFirstRef.current = isFirst;
    console.log(`Card ${profile.id}: useEffect updated isFirstRef.current to: ${isFirst}`);
    
    // Animate scale change when the card becomes the top card
    if (isFirst) {
      // Scale up animation
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      
      // Begin glow animation for top card
      startGlowAnimation();
      
      // Begin sparkle animations with staggered timing
      startSparkleAnimations();
      
      // Start pulsate animation for high compatibility scores
      if (profile.compatibilityScore && profile.compatibilityScore > 75) {
        startPulsateAnimation();
      }
      
      // Start wiggle animation for attention
      setTimeout(() => startWiggleAnimation(), 1000);
    } else {
      // Scale down animation
      Animated.timing(scale, {
        toValue: 0.92,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      
      // Reset animations for non-top cards
      Animated.timing(cardActiveGlow, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }).start();
      
      // Reset sparkles
      sparkleOpacity.forEach(opacity => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
      });
    }
  }, [isFirst, profile.id]);

  // Animation functions
  const startGlowAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardActiveGlow, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(cardActiveGlow, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  };

  const startSparkleAnimations = () => {
    sparkleOpacity.forEach((opacity, index) => {
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 700 + Math.random() * 500,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 700 + Math.random() * 500,
              useNativeDriver: Platform.OS !== 'web',
            }),
            Animated.delay(Math.random() * 1000),
          ])
        ).start();
      }, index * 300);
    });
  };
  
  const startPulsateAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulsateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulsateAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    ).start();
  };
  
  const startWiggleAnimation = () => {
    Animated.sequence([
      Animated.timing(wiggleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: -1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: 0.5,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: -0.5,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(wiggleAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start();
  };

  // Define swipe actions internally
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  };

  const swipeLeft = () => {
    console.log(`Card ${profile.id}: swipeLeft called`);
    
    // First fade out glow
    Animated.parallel([
      Animated.timing(cardActiveGlow, {
        toValue: 0,
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(position, {
        toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 }, // Animate off-screen left
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start(() => {
      console.log(`Card ${profile.id}: swipeLeft finished, calling onSwipeComplete`);
      // Call the completion handler AFTER animation
      onSwipeComplete('left');
    });
  };

  const swipeRight = () => {
    console.log(`Card ${profile.id}: swipeRight called`);
    
    // First enhance the glow for a positive swipe
    Animated.parallel([
      Animated.timing(cardActiveGlow, {
        toValue: 2, // Extra glow for positive swipe
        duration: 150,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(position, {
        toValue: { x: SCREEN_WIDTH * 1.5, y: 0 }, // Animate off-screen right
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: Platform.OS !== 'web',
      })
    ]).start(() => {
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
          
          // Fade glow based on swipe direction
          if (gesture.dx > 0) {
            // Right swipe - increase glow
            cardActiveGlow.setValue(Math.min(1 + (gesture.dx / SCREEN_WIDTH), 2));
          } else if (gesture.dx < 0) {
            // Left swipe - decrease glow
            cardActiveGlow.setValue(Math.max(0, 1 - (Math.abs(gesture.dx) / SCREEN_WIDTH)));
          }
        }
      },
      onPanResponderGrant: (evt, gestureState) => {
        if (isFirstRef.current) {
          console.log(`Card ${profile.id}: PanResponder granted`);
          // Slightly scale up card when touched
          Animated.spring(scale, {
            toValue: 1.03,
            friction: 5,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        }
      },
      onPanResponderRelease: (event, gesture) => {
        if (!isFirstRef.current) return; // Check ref again
        console.log(`Card ${profile.id}: PanResponder released, dx=${gesture.dx}`);
        
        // Reset the scale
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: Platform.OS !== 'web',
        }).start();
        
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
          // Also reset glow
          Animated.timing(cardActiveGlow, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => startGlowAnimation());
        }
      },
      onPanResponderTerminate: (evt, gestureState) => {
        // Reset only if it was the active card
        if (isFirstRef.current) {
          console.log(`Card ${profile.id}: PanResponder terminated, resetting position.`);
          resetPosition();
          
          // Reset scale
          Animated.spring(scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
          
          // Reset glow
          Animated.timing(cardActiveGlow, {
            toValue: 1,
            duration: 300,
            useNativeDriver: Platform.OS !== 'web',
          }).start(() => startGlowAnimation());
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
  
  // Calculate wiggle rotation
  const wiggleRotation = wiggleAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-2deg', '0deg', '2deg'],
    extrapolate: 'clamp',
  });

  // Apply animated styles
  const animatedCardStyle = {
    transform: [
      { rotate: isFirst ? rotate : wiggleRotation },
      { scale },
      ...position.getTranslateTransform()
    ],
    opacity: cardOpacity
  };
  
  const scoreSize = pulsateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1]
  });
  
  const glowOpacity = cardActiveGlow.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, 0.4, 0.7],
    extrapolate: 'clamp',
  });
  
  const glowColor = cardActiveGlow.interpolate({
    inputRange: [0, 1, 2],
    outputRange: ['rgba(244, 67, 54, 0.4)', 'rgba(243, 218, 118, 0.4)', 'rgba(76, 175, 80, 0.4)'],
    extrapolate: 'clamp',
  });

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
  
  // Determine if this profile has a high compatibility score
  const hasHighScore = profile.compatibilityScore !== undefined && profile.compatibilityScore >= 75;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        animatedCardStyle,
        { zIndex: isFirst ? 2 : 1 }, // Improved zIndex
      ]}
      // Conditionally attach handlers based on the 'isFirst' PROP.
      // The handlers themselves check 'isFirstRef.current' internally.
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      {/* Background Glow for active card */}
      {isFirst && (
        <Animated.View 
          style={[
            styles.cardGlow,
            {
              backgroundColor: glowColor,
              opacity: glowOpacity,
            }
          ]} 
        />
      )}
      
      {/* Sparkle animations on top card */}
      {isFirst && sparkleOpacity.map((opacity, index) => (
        <Animated.View 
          key={`sparkle-${index}`}
          style={[
            styles.sparkle,
            {
              left: sparklePositions[index].x,
              top: sparklePositions[index].y,
              opacity,
            }
          ]}
        >
          <Star size={14} color={COLORS.secondary} fill={COLORS.secondary} />
        </Animated.View>
      ))}
      
      <View style={styles.card}>
        <Image source={{ uri: mainImageUrl }} style={styles.image} />

        {/* Compatibility Score Badge */}
        {profile.compatibilityScore !== undefined && (
          <Animated.View 
            style={[
              styles.scoreBadge,
              hasHighScore && {
                transform: [{ scale: scoreSize }],
                backgroundColor: 'rgba(76, 175, 80, 0.9)',
              }
            ]}
          >
            <Text style={styles.scoreText}>
              {Math.round(profile.compatibilityScore)}% Match
            </Text>
          </Animated.View>
        )}

        {/* Icon Overlays for Like/Nope */}
        {isFirst && ( // Only show indicators on the top card
          <>
            {/* Check Mark for Like */}
            <Animated.View style={[styles.overlayIcon, styles.likeIconContainer, { opacity: likeOpacity }]}>
              <View style={styles.iconBubble}>
                <Check size={100} color="#4CAF50" strokeWidth={4} />
              </View>
            </Animated.View>
            {/* X Mark for Nope */}
            <Animated.View style={[styles.overlayIcon, styles.nopeIconContainer, { opacity: nopeOpacity }]}>
              <View style={styles.iconBubble}>
                <X size={100} color="#F44336" strokeWidth={4} />
              </View>
            </Animated.View>
          </>
        )}

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
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
            <Text style={styles.bio} numberOfLines={3}>
              {bio}
            </Text>
          )}
        </LinearGradient>
      </View>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'visible',
  },
  cardGlow: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: BORDER_RADIUS.lg + 3,
    zIndex: -1,
  },
  card: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.background.elevated,
    ...SHADOWS.lg,
  },
  sparkle: {
    position: 'absolute',
    width: 14,
    height: 14,
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    borderBottomLeftRadius: BORDER_RADIUS.lg,
    borderBottomRightRadius: BORDER_RADIUS.lg,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  occupation: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  location: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  bio: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 6,
  },
  overlayIcon: {
    position: 'absolute',
    top: '40%',
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    padding: 10,
  },
  likeIconContainer: {
    right: 30,
    transform: [{ rotate: '15deg' }],
  },
  nopeIconContainer: {
    left: 30,
    transform: [{ rotate: '-15deg' }],
  },
  scoreBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  scoreText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});