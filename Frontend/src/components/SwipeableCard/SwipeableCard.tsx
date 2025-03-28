import React, { useRef, useState, useEffect } from 'react';
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
import { ArrowRight, ArrowLeft, Heart, X } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

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

interface SwipeableCardProps {
  profile: UserProfile;
  onSwipeLeft: (profile: UserProfile) => void;
  onSwipeRight: (profile: UserProfile) => void;
  isFirst: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  profile,
  onSwipeLeft,
  onSwipeRight,
  isFirst,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const position = useRef(new Animated.ValueXY()).current;
  
  // Reset position when a new card becomes the top card
  useEffect(() => {
    position.setValue({ x: 0, y: 0 });
  }, [isFirst, profile.id]);
  
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  // Opacity for the "Like" indicator
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH * 0.2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Opacity for the "Nope" indicator
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 0.2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  
  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 4,
      useNativeDriver: false,
    }).start();
  };
  
  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipeLeft(profile);
    });
  };
  
  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: false,
    }).start(() => {
      onSwipeRight(profile);
    });
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isFirst,
    onMoveShouldSetPanResponder: () => isFirst,
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
  });

  const nextImage = () => {
    if (currentImageIndex < profile.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
    opacity: isFirst ? 1 : 0.9,
    zIndex: isFirst ? 1 : 0,
    top: isFirst ? 0 : 10,
  };

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      <Image
        source={{ uri: profile.images[currentImageIndex] }}
        style={styles.image}
      />

      {/* Image navigation dots */}
      <View style={styles.imageDots}>
        {profile.images.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { opacity: index === currentImageIndex ? 1 : 0.5 },
            ]}
          />
        ))}
      </View>

      {/* Left/Right image navigation */}
      {profile.images.length > 1 && (
        <>
          <View style={[styles.imageNavLeft, { opacity: currentImageIndex > 0 ? 1 : 0.3 }]}>
            <ArrowLeft
              size={24}
              color="#fff"
              onPress={prevImage}
              style={styles.imageNavIcon}
            />
          </View>
          <View
            style={[
              styles.imageNavRight,
              {
                opacity: currentImageIndex < profile.images.length - 1 ? 1 : 0.3,
              },
            ]}
          >
            <ArrowRight
              size={24}
              color="#fff"
              onPress={nextImage}
              style={styles.imageNavIcon}
            />
          </View>
        </>
      )}

      {/* Like indicator */}
      {isFirst && (
        <Animated.View
          style={[styles.likeContainer, { opacity: likeOpacity }]}
        >
          <Heart size={80} color="#4CAF50" fill="#4CAF50" />
        </Animated.View>
      )}

      {/* Nope indicator */}
      {isFirst && (
        <Animated.View
          style={[styles.nopeContainer, { opacity: nopeOpacity }]}
        >
          <X size={80} color="#F44336" />
        </Animated.View>
      )}

      {/* Profile info */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.9)']}
        style={styles.infoContainer}
      >
        <Text style={styles.name}>
          {profile.name}, {profile.age}
        </Text>
        <Text style={styles.occupation}>{profile.occupation}</Text>
        {profile.distance && (
          <Text style={styles.distance}>{profile.distance} miles away</Text>
        )}
        <Text numberOfLines={3} style={styles.bio}>
          {profile.bio}
        </Text>

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestBadge}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_WIDTH * 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#333',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageDots: {
    position: 'absolute',
    top: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
    margin: 3,
  },
  imageNavLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 15,
  },
  imageNavRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 60,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 15,
  },
  imageNavIcon: {
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 3,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  likeContainer: {
    position: 'absolute',
    top: 50,
    right: 40,
    transform: [{ rotate: '15deg' }],
    zIndex: 1000,
  },
  nopeContainer: {
    position: 'absolute',
    top: 50,
    left: 40,
    transform: [{ rotate: '-15deg' }],
    zIndex: 1000,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  occupation: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
    marginBottom: 4,
  },
  distance: {
    fontSize: 14,
    color: 'white',
    opacity: 0.7,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: 'white',
    opacity: 0.8,
    marginBottom: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  interestBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
  },
  interestText: {
    color: 'white',
    fontSize: 12,
  },
});