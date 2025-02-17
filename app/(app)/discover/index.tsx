import { useRef, useState } from 'react';
import { StyleSheet, View, Text, Image, Animated, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useMatches } from '../../../hooks/useMatches';

const SWIPE_THRESHOLD = 120;

export default function Discover() {
  const [currentProfile, setCurrentProfile] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const { createMatch } = useMatches();
  const position = useRef(new Animated.ValueXY()).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
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

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: 500, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      createMatch(currentProfile.id);
      nextProfile();
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -500, y: 0 },
      duration: 250,
      useNativeDriver: true,
    }).start(nextProfile);
  };

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  };

  const nextProfile = () => {
    position.setValue({ x: 0, y: 0 });
    setCurrentProfile(profiles[0]);
    setProfiles(profiles.slice(1));
  };

  const rotate = position.x.interpolate({
    inputRange: [-300, 0, 300],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, 150],
    outputRange: [0, 1],
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-150, 0],
    outputRange: [1, 0],
  });

  const cardStyle = {
    transform: [
      { translateX: position.x },
      { translateY: position.y },
      { rotate },
    ],
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#001A57', '#003399']}
        style={[StyleSheet.absoluteFill, { opacity: 0.1 }]}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Find Roommates</Text>
      </View>

      <View style={styles.cardContainer}>
        {currentProfile ? (
          <Animated.View
            style={[styles.card, cardStyle]}
            {...panResponder.panHandlers}>
            <Image
              source={{ uri: currentProfile.photoUrl }}
              style={styles.cardImage}
            />
            <View style={styles.cardContent}>
              <Text style={styles.cardName}>{currentProfile.name}</Text>
              <Text style={styles.cardDetails}>
                {currentProfile.major} • {currentProfile.year}
              </Text>
              <Text style={styles.cardBio}>{currentProfile.bio}</Text>
            </View>

            <Animated.View
              style={[styles.overlay, styles.likeOverlay, { opacity: likeOpacity }]}>
              <Text style={[styles.overlayText, styles.likeText]}>LIKE</Text>
            </Animated.View>

            <Animated.View
              style={[styles.overlay, styles.nopeOverlay, { opacity: nopeOpacity }]}>
              <Text style={[styles.overlayText, styles.nopeText]}>NOPE</Text>
            </Animated.View>
          </Animated.View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={48} color="#001A57" />
            <Text style={styles.emptyStateText}>
              No more profiles to show right now.
              Check back later for new potential roommates!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001A57',
  },
  cardContainer: {
    flex: 1,
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    height: '100%',
  },
  cardImage: {
    height: '60%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cardContent: {
    padding: 20,
  },
  cardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001A57',
    marginBottom: 5,
  },
  cardDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  cardBio: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 3,
  },
  likeOverlay: {
    right: 40,
    borderColor: '#4CAF50',
  },
  nopeOverlay: {
    left: 40,
    borderColor: '#FF3B30',
  },
  overlayText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  likeText: {
    color: '#4CAF50',
  },
  nopeText: {
    color: '#FF3B30',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});