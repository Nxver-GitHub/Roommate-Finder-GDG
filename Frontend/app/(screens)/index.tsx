import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  Text, 
  ActivityIndicator, 
  TouchableOpacity, 
  Modal, 
  Animated,
  Platform,
  StatusBar,
  Image
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { getCurrentUser } from '../../src/firebase/auth';
import { getDiscoverableUsersWithScores, recordSwipe } from '../../src/firebase/firestore';
import { SwipeableDeck } from '../../src/components/SwipeableCard/SwipeableDeck';
import { Filter as FilterIcon, MessageCircle, Star, X as CloseIcon } from 'lucide-react-native';
import { useFilters } from '../../src/contexts/FilterContext';
import { SearchFilters, defaultFilters } from '../../src/services/searchService';
import { UserProfileData } from '../../src/types/profile';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';

export default function DiscoverScreen() {
    const router = useRouter();
    const { activeFilters } = useFilters();
    const [profiles, setProfiles] = useState<UserProfileData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchModalVisible, setMatchModalVisible] = useState(false);
    const [matchedUser, setMatchedUser] = useState<UserProfileData | null>(null);
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const matchAnimation = useRef(new Animated.Value(0)).current;
    const sparkleAnims = useRef([...Array(6)].map(() => new Animated.Value(0))).current;
    
    // Start fade-in animation when screen mounts
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: Platform.OS !== 'web',
        }).start();
    }, []);

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
                    
                    // Reset and start match animation
                    matchAnimation.setValue(0);
                    
                    // Reset all sparkle animations
                    sparkleAnims.forEach(anim => anim.setValue(0));
                    
                    // Show match modal
                    setMatchModalVisible(true);
                    
                    // Start match animations
                    Animated.timing(matchAnimation, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: Platform.OS !== 'web',
                    }).start();
                    
                    // Start staggered sparkle animations
                    sparkleAnims.forEach((anim, index) => {
                        setTimeout(() => {
                            Animated.loop(
                                Animated.sequence([
                                    Animated.timing(anim, {
                                        toValue: 1,
                                        duration: 700 + Math.random() * 500,
                                        useNativeDriver: Platform.OS !== 'web',
                                    }),
                                    Animated.timing(anim, {
                                        toValue: 0.3,
                                        duration: 700 + Math.random() * 500,
                                        useNativeDriver: Platform.OS !== 'web',
                                    }),
                                ])
                            ).start();
                        }, index * 200);
                    });
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
    
    // Calculate animation values
    const matchScale = matchAnimation.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0.5, 1.1, 1],
    });
    
    const matchOpacity = matchAnimation.interpolate({
        inputRange: [0, 0.3, 1],
        outputRange: [0, 1, 1],
    });

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
            
            {/* Add an explicit filter button */}
            <TouchableOpacity 
                onPress={navigateToSearch}
                style={styles.topRightFilterButton}
                activeOpacity={0.7}
            >
                <LinearGradient
                    colors={[COLORS.secondary, '#E5B93C']} 
                    style={styles.filterButtonGradient}
                >
                    <FilterIcon size={22} color="#000000" />
                </LinearGradient>
            </TouchableOpacity>
            
            <Stack.Screen 
                options={{ 
                    title: '',
                    headerTransparent: true,
                    headerShown: false, // Hide the header since we're adding our own button
                }} 
            />
            
            <Animated.View 
                style={[
                    styles.contentContainer,
                    { opacity: fadeAnim }
                ]}
            >
                {loading ? (
                   <View style={styles.centerContainer}>
                      <ActivityIndicator size="large" color={COLORS.secondary} />
                      <Text style={styles.loadingText}>Finding Roommates...</Text>
                   </View>
                ) : error ? (
                   <View style={styles.centerContainer}>
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity 
                          onPress={onRefresh} 
                          style={styles.retryButton}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[COLORS.primary, '#3667C2']}
                            style={styles.retryButtonGradient}
                          >
                            <Text style={styles.retryText}>Retry</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                   </View>
                ) : profiles.length === 0 ? (
                   <View style={styles.centerContainer}>
                      <View style={styles.emptyStateContainer}>
                        <Star size={50} color={COLORS.secondary} />
                        <Text style={styles.emptyText}>No roommates found matching your criteria.</Text>
                        <Text style={styles.emptySubText}>Try adjusting your filters or check back later!</Text>
                        <TouchableOpacity 
                          onPress={onRefresh} 
                          style={styles.refreshButton}
                          activeOpacity={0.8}
                        >
                          <LinearGradient
                            colors={[COLORS.primary, '#3667C2']}
                            style={styles.refreshButtonGradient}
                          >
                            <Text style={styles.refreshText}>Refresh</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
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
            </Animated.View>
            
            {/* Match Modal with Enhanced Animation */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={matchModalVisible}
                onRequestClose={() => setMatchModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={40} tint="dark" style={styles.blurBackground}>
                        {/* Floating stars/sparkles animations */}
                        {sparkleAnims.map((anim, index) => (
                            <Animated.View 
                                key={`sparkle-${index}`}
                                style={[
                                    styles.sparkle,
                                    {
                                        left: `${15 + (index * 15)}%`,
                                        top: `${10 + (index * 12)}%`,
                                        transform: [{ scale: anim }],
                                        opacity: anim,
                                    }
                                ]}
                            >
                                <Star 
                                    size={20 + (index % 3) * 10} 
                                    color={COLORS.secondary} 
                                    fill={COLORS.secondary} 
                                />
                            </Animated.View>
                        ))}
                        
                        <Animated.View 
                            style={[
                                styles.matchContainer,
                                {
                                    opacity: matchOpacity,
                                    transform: [{ scale: matchScale }]
                                }
                            ]}
                        >
                            <LinearGradient
                                colors={['#242938', '#1E2130']}
                                style={styles.matchGradient}
                            >
                                <TouchableOpacity 
                                    style={styles.closeButton}
                                    onPress={() => setMatchModalVisible(false)}
                                >
                                    <CloseIcon size={20} color={COLORS.text.secondary} />
                                </TouchableOpacity>
                                
                                <Text style={styles.matchTitle}>It's a Match!</Text>
                                
                                <View style={styles.matchImageContainer}>
                                    <Image 
                                        source={{ 
                                            uri: matchedUser?.photoURL || 
                                                (matchedUser?.photos && matchedUser.photos.length > 0 
                                                    ? matchedUser.photos[0] 
                                                    : 'https://via.placeholder.com/150')
                                        }} 
                                        style={styles.matchImage} 
                                    />
                                </View>
                                
                                <Text style={styles.matchSubtitle}>
                                    You and {matchedUser?.basicInfo?.firstName || 'this user'} have liked each other.
                                </Text>
                                
                                <Text style={styles.matchText}>
                                    Start a conversation now to discuss your housing plans!
                                </Text>
                                
                                <TouchableOpacity
                                    style={styles.messageButton}
                                    onPress={handleGoToMessages}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={[COLORS.primary, '#3667C2']}
                                        style={styles.messageButtonGradient}
                                    >
                                        <MessageCircle size={20} color="#FFFFFF" style={styles.messageIcon} />
                                        <Text style={styles.messageButtonText}>Send a Message</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                
                                <TouchableOpacity
                                    style={styles.continueButton}
                                    onPress={handleContinueBrowsing}
                                >
                                    <Text style={styles.continueButtonText}>Keep Browsing</Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </Animated.View>
                    </BlurView>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background.default,
        position: 'relative',
    },
    contentContainer: {
        flex: 1,
        marginTop: 80, // Add space for the logo at the top
    },
    filterButton: {
        marginRight: SPACING.md,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        ...SHADOWS.sm,
        marginTop: Platform.OS === 'ios' ? 40 : 20, // Adjust position for header transparency
    },
    filterButtonGradient: {
        padding: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SPACING.xl,
    },
    loadingText: {
        fontSize: 18,
        color: COLORS.text.secondary,
        marginTop: SPACING.md,
    },
    errorContainer: {
        padding: SPACING.lg,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        width: '100%',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 18,
        color: COLORS.danger,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    emptyStateContainer: {
        padding: SPACING.xl,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: 'rgba(67, 113, 203, 0.1)',
        alignItems: 'center',
        width: '100%',
        ...SHADOWS.md,
        borderWidth: 1,
        borderColor: 'rgba(67, 113, 203, 0.15)',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text.primary,
        textAlign: 'center',
        marginVertical: SPACING.md,
    },
    emptySubText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.lg,
    },
    retryButton: {
        width: '100%',
        height: 44,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.sm,
    },
    retryButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    retryText: {
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    refreshButton: {
        width: '80%',
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        ...SHADOWS.md,
        marginTop: SPACING.md,
    },
    refreshButtonGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshText: {
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurBackground: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sparkle: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    matchContainer: {
        width: '85%',
        maxWidth: 340,
        borderRadius: BORDER_RADIUS.lg,
        overflow: 'hidden',
        ...SHADOWS.lg,
    },
    matchGradient: {
        padding: SPACING.xl,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: SPACING.md,
        right: SPACING.md,
        padding: SPACING.xs,
        zIndex: 1,
    },
    matchTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.secondary,
        marginBottom: SPACING.lg,
    },
    matchImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: COLORS.secondary,
        marginBottom: SPACING.lg,
        ...SHADOWS.md,
    },
    matchImage: {
        width: '100%',
        height: '100%',
    },
    matchSubtitle: {
        fontSize: 18,
        color: COLORS.text.primary,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    matchText: {
        fontSize: 14,
        color: COLORS.text.secondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
    },
    messageButton: {
        width: '100%',
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        overflow: 'hidden',
        marginBottom: SPACING.md,
        ...SHADOWS.md,
    },
    messageButtonGradient: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageIcon: {
        marginRight: SPACING.xs,
    },
    messageButtonText: {
        color: COLORS.text.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    continueButton: {
        paddingVertical: SPACING.sm,
    },
    continueButtonText: {
        color: COLORS.text.secondary,
        fontSize: 16,
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
    topRightFilterButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 70 : 60,
        right: 20,
        zIndex: 20,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
        ...SHADOWS.md,
    },
});