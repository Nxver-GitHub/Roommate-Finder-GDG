import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser } from '../../src/firebase/auth';
import {
  collection,
  query,
  onSnapshot,
  doc,
  orderBy,
  getDoc,
} from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { getMatchedUserProfiles, validateAndFixMatches } from '../../src/firebase/firestore';
import { UserProfileData } from '../../src/types/profile';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/utils/theme';

const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/100/374151/e5e7eb?text=No+Pic';
const MATCHES_COLLECTION = 'matches';

export default function ResultsScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();
  const [pressedCardId, setPressedCardId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    const setupListener = async () => {
      if (!isMounted) return;

      if (!currentUser?.uid) {
        console.log("Results: No current user found for listener.");
        setMatches([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      const currentUserId = currentUser.uid;

      try {
        const fixedCount = await validateAndFixMatches(currentUserId);
        if (isMounted && fixedCount > 0) {
          console.log(`ResultsScreen: Fixed ${fixedCount} inconsistent matches.`);
        }
        if (!isMounted) return;

        console.log(`Results: Setting up match listener for user ${currentUserId}`);
        const matchesSubcollectionRef = collection(db, MATCHES_COLLECTION, currentUserId, 'userMatches');
        const q = query(matchesSubcollectionRef, orderBy('matchedAt', 'desc'));

        unsubscribe = onSnapshot(q, async (querySnapshot) => {
          if (!isMounted || !getCurrentUser()?.uid) {
            console.log("Results listener: Component unmounted or user logged out during snapshot update.");
            return;
          }
          console.log(`Results listener: Received update with ${querySnapshot.size} match documents.`);
          const matchIds: string[] = [];
          querySnapshot.forEach((doc) => {
            matchIds.push(doc.id);
          });

          if (matchIds.length > 0) {
            try {
              const matchedProfiles = await getMatchedUserProfiles(matchIds);
              if (!isMounted) return;
              console.log(`Results listener: Fetched ${matchedProfiles.length} profiles.`);
              setMatches(matchedProfiles);
              setError(null);
            } catch (profileError) {
              if (!isMounted) return;
              console.error("Results listener: Error fetching matched profiles:", profileError);
              setError("Failed to load profile details for matches.");
              setMatches([]);
            }
          } else {
            if (!isMounted) return;
            console.log("Results listener: No match IDs found, clearing matches.");
            setMatches([]);
          }
          setLoading(false);
        }, (err) => {
          if (!isMounted) return;
          if (err.code === 'permission-denied') {
            console.warn("Results listener: Permission denied. User likely logged out.");
            setError(null);
            setMatches([]);
          } else {
            console.error("Results listener: Error:", err);
            setError("Failed to listen for matches.");
          }
          setLoading(false);
          setMatches([]);
        });

      } catch (validationError) {
        if (!isMounted) return;
        console.error("ResultsScreen: Error validating matches:", validationError);
        setError("Error checking match consistency.");
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        console.log("Results: Unsubscribing match listener on cleanup.");
        unsubscribe();
      } else {
        console.log("Results: No active listener to unsubscribe on cleanup.");
      }
    };
  }, [currentUser?.uid]);

  const handleMatchPress = (profile: UserProfileData) => {
    if (!profile.id) {
      Alert.alert("Error", "Cannot start conversation with this match. Missing profile ID.");
      return;
    }
    console.log("Navigating to conversation with match:", profile.id);
    router.push(`/conversation/${profile.id}`);
  };

  const renderMatchItem = ({ item }: { item: UserProfileData }) => {
    const displayName = `${item.basicInfo?.firstName || ''} ${item.basicInfo?.lastName || ''}`.trim() || 'Matched User';
    const profileImageUrl = item.photoURL || PLACEHOLDER_IMAGE_URI;
    const matchOccupation = item.basicInfo?.occupation || 'Unknown Occupation';
    const isPressed = pressedCardId === item.id;

    return (
      <View style={styles.matchCardContainer}>
        <LinearGradient
          colors={[
            isPressed ? COLORS.secondary : 'rgba(67, 113, 203, 0.8)',
            isPressed ? '#E5B93C' : 'rgba(67, 113, 203, 0.4)'
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.matchCardGlow}
        >
          <TouchableOpacity
            style={[styles.matchCard, isPressed && styles.matchCardPressed]}
            onPress={() => handleMatchPress(item)}
            onPressIn={() => setPressedCardId(item.id)}
            onPressOut={() => setPressedCardId(null)}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[
                'rgba(31, 41, 55, 0.8)',
                'rgba(31, 41, 55, 0.9)'
              ]}
              style={styles.matchCardGradient}
            >
              <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
              <View style={styles.matchInfo}>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.occupation}>{matchOccupation}</Text>
                <View style={styles.messageContainer}>
                  <Ionicons name="chatbubble-outline" size={14} color={COLORS.secondary} style={styles.messageIcon} />
                  <Text style={styles.messagePreview}>Tap to chat!</Text>
                </View>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
        
        {/* App Logo centered at the top */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.logoGradient}
          >
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.centerLogo} 
              resizeMode="contain"
            />
          </LinearGradient>
        </View>
        
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.secondary} />
          <Text style={styles.loadingText}>Loading Matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
        
        {/* App Logo centered at the top */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent']}
            style={styles.logoGradient}
          >
            <Image 
              source={require('../../assets/images/logo.png')} 
              style={styles.centerLogo} 
              resizeMode="contain"
            />
          </LinearGradient>
        </View>
        
        <Stack.Screen options={{ headerShown: false }} />
        
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.7)']}
            style={styles.errorContainer}
          >
            <Ionicons name="alert-circle-outline" size={40} color="#ef4444" style={styles.errorIcon} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(screens)/')}
              style={styles.errorButton}
            >
              <LinearGradient
                colors={[COLORS.primary, '#3667C2']}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>Back to Discover</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
      
      {/* App Logo centered at the top */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.logoGradient}
        >
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.centerLogo} 
            resizeMode="contain"
          />
        </LinearGradient>
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Matches</Text>
        <View style={styles.headerRight}>
          {/* Empty view for alignment */}
        </View>
      </View>
      
      <Stack.Screen options={{ headerShown: false }} />

      {matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.7)']}
            style={styles.emptyContainer}
          >
            <Ionicons name="people-outline" size={50} color={COLORS.text.secondary} />
            <Text style={styles.emptyText}>No matches yet</Text>
            <Text style={styles.emptySubText}>Keep discovering to find potential roommates!</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(screens)/')}
              style={styles.emptyButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, '#E5B93C']}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Discover Roommates</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={matches}
            renderItem={renderMatchItem}
            keyExtractor={(item) => item.id || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logoGradient: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  centerLogo: {
    width: 90,
    height: 48,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40, // Same width as back button for alignment
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  matchCardContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  matchCardGlow: {
    padding: 2.5, // Increased padding for more prominent border
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  matchCard: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: COLORS.background.default,
  },
  matchCardPressed: {
    transform: [{ scale: 0.98 }], // Subtle scale effect when pressed
  },
  matchCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.elevated,
    marginRight: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  matchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  occupation: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageIcon: {
    marginRight: 4,
  },
  messagePreview: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  arrowContainer: {
    paddingLeft: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  errorContainer: {
    width: '90%',
    padding: SPACING.lg,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    ...SHADOWS.md,
  },
  errorIcon: {
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  errorButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  errorButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  errorButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
  },
  emptyContainer: {
    width: '90%',
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.15)',
    ...SHADOWS.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  emptyButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
  },
}); 