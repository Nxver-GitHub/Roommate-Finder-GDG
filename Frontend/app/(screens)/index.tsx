import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getCurrentUser } from '../../src/firebase/auth';
import { getDiscoverableUsers, recordSwipe } from '../../src/firebase/firestore';
import { SwipeableDeck } from '../../src/components/SwipeableCard/SwipeableDeck';
import { Filter as FilterIcon } from 'lucide-react-native';
import { useFilters } from '../../src/contexts/FilterContext';
import { SearchFilters, defaultFilters } from '../../src/services/searchService';

interface UserProfileData {
    id?: string;
    basicInfo?: { firstName?: string; lastName?: string; age?: number; };
    preferences?: { location?: string; budget?: { min?: number; max?: number }; };
    photoURL?: string | null;
    [key: string]: any;
}

const calculateMatchScore = (profile: UserProfileData, filters: SearchFilters): number => {
    let score = 0;
    const weight = {
        gender: 5,
        budgetOverlap: 3,
        lifestyleBoolean: 2,
        lifestyleRatingProximity: 1,
    };

    if (filters.genderPreference && filters.genderPreference !== 'Any') {
        if (profile.basicInfo?.gender === filters.genderPreference) {
            score += weight.gender;
        } else {
            score -= weight.gender;
        }
    }

    const userMinBudget = profile.preferences?.budget?.min ?? 0;
    const userMaxBudget = profile.preferences?.budget?.max ?? Infinity;
    const filterMin = filters.budgetRange.min;
    const filterMax = filters.budgetRange.max;
    if (Math.max(userMinBudget, filterMin) <= Math.min(userMaxBudget, filterMax)) {
        score += weight.budgetOverlap;
    }

    if (filters.lifestyle?.smoking !== null && profile.lifestyle?.smoking === filters.lifestyle.smoking) {
        score += weight.lifestyleBoolean;
    } else if (filters.lifestyle?.smoking !== null && profile.lifestyle?.smoking !== filters.lifestyle.smoking) {
        score -= weight.lifestyleBoolean;
    }
    if (filters.lifestyle?.pets !== null && profile.lifestyle?.pets === filters.lifestyle.pets) {
        score += weight.lifestyleBoolean;
    } else if (filters.lifestyle?.pets !== null && profile.lifestyle?.pets !== filters.lifestyle.pets) {
        score -= weight.lifestyleBoolean;
    }
    
    if (filters.lifestyle?.cleanliness !== null && filters.lifestyle.cleanliness > 0) {
        const userCleanliness = profile.lifestyle?.cleanliness ?? 3;
        const diff = Math.abs(userCleanliness - filters.lifestyle.cleanliness);
        score += Math.max(0, weight.lifestyleRatingProximity * (5 - diff));
    }

    return score;
};

export default function DiscoverScreen() {
    const router = useRouter();
    const { activeFilters } = useFilters();
    const [profiles, setProfiles] = useState<UserProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProfiles = useCallback(async () => {
        setError(null);
        setLoading(!refreshing);
        const currentUser = getCurrentUser();
        if (!currentUser?.uid) {
            console.log("Discover: No current user found.");
            setLoading(false);
            setRefreshing(false);
            return;
        }

        try {
            console.log("Discover: Fetching ALL profiles...");
            const fetchedProfiles = await getDiscoverableUsers(currentUser.uid);

            console.log(`Discover: Calculating scores based on filters:`, activeFilters);
            
            const profilesWithScores = fetchedProfiles.map(profile => ({
                ...profile,
                _matchScore: calculateMatchScore(profile, activeFilters)
            }));

            const sortedProfiles = profilesWithScores.sort((a, b) => b._matchScore - a._matchScore);
            
            console.log(`Discover: Setting ${sortedProfiles.length} profiles, sorted by score.`);
            setProfiles(sortedProfiles);

        } catch (err) {
            console.error("Discover: Failed to fetch/process profiles -", err);
            setError("Failed to load profiles. Please try again.");
            setProfiles([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilters, refreshing]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
    }, []);

    const handleSwipeLeft = (profile: UserProfileData) => {
        console.log("Swiped left (dislike) on:", profile.id);
        const currentUser = getCurrentUser();
        if (currentUser?.uid && profile.id) {
            recordSwipe(currentUser.uid, profile.id, false)
                .catch(err => console.error("Error recording dislike swipe:", err));
        }
    };

    const handleSwipeRight = (profile: UserProfileData) => {
        console.log("Swiped right (like) on:", profile.id);
        const currentUser = getCurrentUser();
        if (currentUser?.uid && profile.id) {
            recordSwipe(currentUser.uid, profile.id, true)
                .catch(err => console.error("Error recording like swipe:", err));
        }
    };

    const handleDeckEmpty = () => {
        console.log("Deck is empty, no more profiles to show.");
    };

    const navigateToSearch = () => {
        router.push('/(screens)/search');
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen 
              options={{ 
                title: 'Discover',
                headerRight: () => (
                  <TouchableOpacity onPress={navigateToSearch} style={styles.filterButton}>
                    <FilterIcon size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                ),
              }} 
            />
            
            {loading ? (
               <View style={styles.centerContainer}>
                  <ActivityIndicator size="large" color="#38bdf8" />
                  <Text style={styles.loadingText}>Finding Roommates...</Text>
               </View>
            ) : error ? (
               <View style={styles.centerContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                     <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
               </View>
            ) : profiles.length === 0 ? (
               <View style={styles.centerContainer}>
                  <Text style={styles.emptyText}>No roommates found nearby.</Text>
                  <Text style={styles.emptySubText}>Expand your search or check back later!</Text>
                  <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
                      <Text style={styles.retryText}>Refresh</Text>
                  </TouchableOpacity>
               </View>
            ) : (
               <SwipeableDeck
                  profiles={profiles}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                  onDeckEmpty={handleDeckEmpty}
                  onRefresh={onRefresh}
                  isRefreshing={refreshing}
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
    filterButton: {
        marginRight: 15,
        padding: 5,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
        padding: 20,
    },
    loadingText: {
        fontSize: 18,
        color: '#9ca3af',
        marginTop: 16,
    },
    errorText: {
        fontSize: 18,
        color: '#ef4444',
        textAlign: 'center',
        marginBottom: 20, 
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    emptySubText: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#38bdf8',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});