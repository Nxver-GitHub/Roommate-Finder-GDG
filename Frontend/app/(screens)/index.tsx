import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, Text, ActivityIndicator, TouchableOpacity, Alert, Modal } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { getCurrentUser } from '../../src/firebase/auth';
import { getDiscoverableUsersWithScores, recordSwipe } from '../../src/firebase/firestore';
import { SwipeableDeck } from '../../src/components/SwipeableCard/SwipeableDeck';
import { Filter as FilterIcon } from 'lucide-react-native';
import { useFilters } from '../../src/contexts/FilterContext';
import { SearchFilters, defaultFilters } from '../../src/services/searchService';
import { UserProfileData } from '../../src/types/profile';

export default function DiscoverScreen() {
    const router = useRouter();
    const { activeFilters } = useFilters();
    const [profiles, setProfiles] = useState<UserProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUser, setMatchedUser] = useState<UserProfileData | null>(null);

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
            console.log("Discover: Fetching profiles with compatibility scoring:", JSON.stringify(activeFilters, null, 2));
            const fetchedProfiles = await getDiscoverableUsersWithScores(currentUser.uid, activeFilters);

            console.log(`Discover: Received ${fetchedProfiles.length} profiles with compatibility scores.`);

            setProfiles(fetchedProfiles);

        } catch (err) {
            console.error("Discover: Failed to fetch/process profiles -", err);
            setError("Failed to load profiles. Please try again.");
            setProfiles([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilters, refreshing]);

    useFocusEffect(
        useCallback(() => {
            console.log("Discover screen is focused - fetching profiles");
            fetchProfiles();
            return () => {
                // Optional cleanup
            };
        }, [fetchProfiles])
    );

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

    const handleSwipeRight = async (profile: UserProfileData) => {
        console.log("Swiped right (like) on:", profile.id);
        const currentUser = getCurrentUser();
        if (currentUser?.uid && profile.id) {
            try {
                // Use await to get the result of recordSwipe
                const result = await recordSwipe(currentUser.uid, profile.id, true);
                
                // Check if it's a match
                if (result.matched) {
                    console.log("It's a match! Matched with:", result.matchedUserId || profile.id);
                    
                    // Set the matched user for the modal
                    setMatchedUser(result.matchedUserProfile || profile);
                    
                    // Show match modal
                    setMatchModalVisible(true);
                }
            } catch (err) {
                console.error("Error recording like swipe:", err);
            }
        }
    };

    const handleDeckEmpty = () => {
        console.log("Deck is empty, no more profiles to show.");
    };

    const navigateToSearch = () => {
        router.push('/(screens)/search');
    };

    // Function to handle going to messages with the matched user
    const handleGoToMessages = () => {
        setMatchModalVisible(false);
        if (matchedUser?.id) {
            router.push(`/conversation/${matchedUser.id}`);
        }
    };

    // Function to continue browsing
    const handleContinueBrowsing = () => {
        setMatchModalVisible(false);
        // User continues on the discover screen
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
                  <Text style={styles.emptyText}>No roommates found matching your criteria.</Text>
                  <Text style={styles.emptySubText}>Try adjusting your filters or check back later!</Text>
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
            
            {/* Match Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={matchModalVisible}
                onRequestClose={() => setMatchModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.matchTitle}>It's a Match!</Text>
                        <Text style={styles.matchSubtitle}>
                            You and {matchedUser?.basicInfo?.firstName || 'this user'} have liked each other.
                        </Text>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.primaryButton]}
                            onPress={handleGoToMessages}
                        >
                            <Text style={styles.primaryButtonText}>Send a Message</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={[styles.modalButton, styles.secondaryButton]}
                            onPress={handleContinueBrowsing}
                        >
                            <Text style={styles.secondaryButtonText}>Keep Browsing</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: '#1f2937',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },
    matchTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    matchSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButton: {
        width: '100%',
        padding: 15,
        borderRadius: 8,
        marginVertical: 5,
        alignItems: 'center',
    },
    primaryButton: {
        backgroundColor: '#0891b2',
    },
    primaryButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#0891b2',
    },
    secondaryButtonText: {
        color: '#0891b2',
        fontSize: 16,
        fontWeight: 'bold',
    },
});