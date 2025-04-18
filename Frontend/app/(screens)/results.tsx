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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
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

const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/100/374151/e5e7eb?text=No+Pic';
const MATCHES_COLLECTION = 'matches';

export default function ResultsScreen() {
  const router = useRouter();
  const [matches, setMatches] = useState<UserProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = getCurrentUser();

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

    return (
      <TouchableOpacity
        style={styles.matchCard}
        onPress={() => handleMatchPress(item)}
      >
        <Image source={{ uri: profileImageUrl }} style={styles.profileImage} />
        <View style={styles.matchInfo}>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.occupation}>{matchOccupation}</Text>
          <Text style={styles.messagePreview}>Tap to chat!</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading Matches...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Matches' }} />
      <View style={styles.header}>
         <Text style={styles.headerTitle}>Your Matches</Text>
      </View>

      {matches.length === 0 ? (
         <View style={styles.centerContainer}>
           <Text style={styles.emptyText}>No matches yet.</Text>
           <Text style={styles.emptySubText}>Keep discovering to find potential roommates!</Text>
         </View>
       ) : (
        <FlatList
          data={matches}
          renderItem={renderMatchItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
        />
       )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
     paddingHorizontal: 20,
     paddingVertical: 15,
     borderBottomWidth: 1,
     borderBottomColor: '#333',
  },
  headerTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  profileImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#374151',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  matchInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  occupation: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 6,
  },
  messagePreview: {
    fontSize: 14,
    color: '#60a5fa',
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginBottom: 8,
  },
   emptySubText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
}); 