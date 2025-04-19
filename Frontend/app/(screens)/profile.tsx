import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  Platform,
  StatusBar 
} from 'react-native';
import { Settings, CreditCard, User, Edit, LogOut, User as UserIcon, MapPin, DollarSign, CalendarDays, Clock, BedDouble, Cigarette, Dog } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useRouter, Stack } from 'expo-router';
import { getCurrentUser, signOut } from '../../src/firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { format, isValid } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/utils/theme';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

interface UserProfileData {
  id?: string;
  email?: string;
  name?: string;
  photoURL?: string | null;
  basicInfo?: {
    firstName?: string;
    lastName?: string;
    age?: number;
    gender?: string;
    occupation?: string;
    bio?: string;
  };
  preferences?: {
    budget?: { min?: number; max?: number };
    moveInDate?: any;
    duration?: string;
    location?: string;
    roomType?: string;
  };
  lifestyle?: {
    cleanliness?: number;
    noise?: number;
    guestComfort?: number;
    schedule?: string;
    smoking?: boolean;
    pets?: boolean;
  };
  photos?: string[];
  isProfileComplete?: boolean;
  [key: string]: any;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [signOutLoading, setSignOutLoading] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.uid) {
      console.log("No authenticated user found on profile screen mount.");
      setLoading(false);
      Alert.alert("Error", "User not logged in.");
      router.replace('/(auth)');
      return;
    }

    setLoading(true);
    const userDocRef = doc(db, 'users', currentUser.uid);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const userProfileData = { id: docSnap.id, ...docSnap.data() } as UserProfileData;
        
        if (userProfileData.preferences?.moveInDate?.toDate) {
          userProfileData.preferences.moveInDate = userProfileData.preferences.moveInDate.toDate();
        }
        
        setProfile(userProfileData);
        console.log("Profile snapshot updated:", userProfileData.id);
      } else {
        console.warn("Profile document does not exist for user:", currentUser.uid);
        setProfile(null);
        Alert.alert("Error", "Could not load profile data.");
      }
      setLoading(false);
    }, (error) => {
      console.error("Error listening to profile snapshot:", error);
      Alert.alert("Error", "Failed to listen for profile updates.");
      setProfile(null);
      setLoading(false);
    });

    return () => {
       console.log("Unsubscribing from profile listener on ProfileScreen unmount");
       unsubscribe();
    }
  }, []);

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      console.log("User signed out successfully.");
    } catch (error) {
      console.error("Sign Out Error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
      setSignOutLoading(false);
    }
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
          <Text style={styles.loadingText}>Loading Your Profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
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
            <Text style={styles.errorText}>Could not load profile. Data might be missing.</Text>
            <TouchableOpacity 
              onPress={handleSignOut}
              style={styles.errorButton}
              disabled={signOutLoading}
            >
              <LinearGradient
                colors={['#ef4444', '#b91c1c']}
                style={styles.errorButtonGradient}
              >
                {signOutLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.errorButtonText}>Sign Out</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  const formatBudget = (budget?: { min?: number; max?: number }): string => {
    if (!budget || budget.min === undefined || budget.max === undefined) return 'N/A';
    return `$${budget.min} - $${budget.max} / month`;
  };

  const formatMoveInDate = (date?: Date): string => {
    if (!(date instanceof Date) || !isValid(date)) {
      try {
        const parsedDate = new Date(date);
        if (isValid(parsedDate)) {
          return format(parsedDate, 'MMMM dd, yyyy');
        }
      } catch (e) { /* Ignore */ }
      return 'N/A';
    }
    return format(date, 'MMMM dd, yyyy');
  };

  const formatBool = (value?: boolean): string => {
     return value === undefined ? 'N/A' : (value ? 'Yes' : 'No');
  }

  const formatRating = (value?: number): JSX.Element => {
    if (value === undefined) return <Text style={styles.infoText}>N/A</Text>;
    
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Animated.View 
          key={i} 
          entering={FadeInRight.delay(i * 100).duration(400)}
        >
          <Ionicons 
            name={i < value ? "star" : "star-outline"} 
            size={18} 
            color={i < value ? COLORS.secondary : COLORS.text.secondary}
            style={{ marginRight: 2 }}
          />
        </Animated.View>
      );
    }
    
    return (
      <View style={styles.ratingContainer}>
        <LinearGradient
          colors={['rgba(240, 210, 100, 0.3)', 'rgba(240, 210, 100, 0.1)']}
          style={styles.ratingGradient}
        >
          <View style={styles.starsContainer}>{stars}</View>
          <Text style={styles.ratingText}>{value}/5</Text>
        </LinearGradient>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
      
      {/* Header with App Logo */}
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.background.default, 'rgba(18, 18, 18, 0.95)']}
          style={styles.headerGradient}
        >
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.headerLogo} 
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/(screens)/edit-profile')}
          >
            <Edit size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      <Animated.ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        entering={FadeInDown.duration(600).springify()}
      >
        <Animated.View 
          style={styles.profileCardContainer}
          entering={FadeInDown.delay(200).duration(700).springify()}
        >
          <LinearGradient
            colors={['rgba(67, 113, 203, 0.4)', 'rgba(67, 113, 203, 0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileCardGradient}
          >
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.profileImageContainer}>
                  <Image 
                    source={{ uri: profile.photoURL || 'https://via.placeholder.com/100' }} 
                    style={styles.profileImage} 
                  />
                </View>
                <View style={styles.profileHeaderText}>
                  <Text style={styles.profileName}>
                    {`${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.trim() || 'User Name'}
                  </Text>
                  <Text style={styles.profileSubtitle}>
                    {profile.basicInfo?.age ? `${profile.basicInfo.age} years old` : ''}
                    {profile.basicInfo?.gender ? ` • ${profile.basicInfo.gender}` : ''}
                  </Text>
                  <Text style={styles.profileOccupation}>{profile.basicInfo?.occupation || 'Occupation N/A'}</Text>
                </View>
              </View>
              
              {profile.basicInfo?.bio && (
                <>
                  <View style={styles.separator} />
                  <Text style={styles.sectionTitle}>About Me</Text>
                  <Text style={styles.bioText}>{profile.basicInfo.bio}</Text>
                </>
              )}

              {profile.isProfileComplete && (
                <View style={styles.profileCompleteBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.text.primary} />
                  <Text style={styles.profileCompleteBadgeText}>Complete</Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          style={styles.sectionContainer}
          entering={FadeInDown.delay(300).duration(700).springify()}
        >
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.8)']}
            style={styles.sectionGradient}
          >
            <Text style={styles.sectionTitle}>My Preferences</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <DollarSign size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoText}>{formatBudget(profile.preferences?.budget)}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <CalendarDays size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Move-in Date</Text>
                <Text style={styles.infoText}>{formatMoveInDate(profile.preferences?.moveInDate)}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Clock size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoText}>{profile.preferences?.duration || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <MapPin size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoText}>{profile.preferences?.location || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <BedDouble size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Room Type</Text>
                <Text style={styles.infoText}>{profile.preferences?.roomType || 'N/A'}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View 
          style={styles.sectionContainer}
          entering={FadeInDown.delay(400).duration(700).springify()}
        >
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.8)']}
            style={styles.sectionGradient}
          >
            <Text style={styles.sectionTitle}>My Lifestyle</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="water-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Cleanliness</Text>
                {formatRating(profile.lifestyle?.cleanliness)}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="volume-medium-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Noise Level</Text>
                {formatRating(profile.lifestyle?.noise)}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="people-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Guest Comfort</Text>
                {formatRating(profile.lifestyle?.guestComfort)}
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Ionicons name="time-outline" size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Schedule</Text>
                <Text style={styles.infoText}>{profile.lifestyle?.schedule || 'N/A'}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Cigarette size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ok with Smoking</Text>
                <Text style={styles.infoText}>{formatBool(profile.lifestyle?.smoking)}</Text>
              </View>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.iconContainer}>
                <Dog size={18} color={COLORS.secondary} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ok with Pets</Text>
                <Text style={styles.infoText}>{formatBool(profile.lifestyle?.pets)}</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {profile.photos && profile.photos.length > 0 && (
          <Animated.View 
            style={styles.sectionContainer}
            entering={FadeInDown.delay(500).duration(700).springify()}
          >
            <LinearGradient
              colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.8)']}
              style={styles.sectionGradient}
            >
              <Text style={styles.sectionTitle}>My Photos</Text>
              <View style={styles.photosContainer}>
                {profile.photos.map((photoUri, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <LinearGradient
                      colors={['rgba(67, 113, 203, 0.6)', 'rgba(67, 113, 203, 0.3)']}
                      style={styles.photoGradient}
                    >
                      <Image source={{ uri: photoUri }} style={styles.photoThumbnail} />
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInDown.delay(600).duration(700).springify()}
        >
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={signOutLoading}
          >
            <LinearGradient
              colors={['#ef4444', '#b91c1c']}
              style={styles.signOutGradient}
            >
              {signOutLoading ? (
                <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
              ) : (
                <LogOut size={18} color="#ffffff" style={{ marginRight: 8 }} />
              )}
              <Text style={styles.signOutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  header: {
    backgroundColor: COLORS.background.default,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(67, 113, 203, 0.2)',
    ...SHADOWS.sm,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: Platform.OS === 'ios' ? SPACING.xs : SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerLogo: {
    width: 70,
    height: 35,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  headerButton: {
    padding: SPACING.sm,
  },
  profileCardContainer: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  profileCardGradient: {
    padding: SPACING.xs,
    borderRadius: BORDER_RADIUS.lg,
  },
  profileCard: {
    backgroundColor: COLORS.background.elevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    borderWidth: 3,
    borderColor: COLORS.secondary,
    borderRadius: 50,
    padding: 3,
    ...SHADOWS.md,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.background.input,
  },
  profileHeaderText: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  profileName: {
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  profileSubtitle: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.xs,
  },
  profileOccupation: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    marginVertical: SPACING.md,
  },
  sectionContainer: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  sectionGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.secondary,
    paddingLeft: SPACING.sm,
  },
  bioText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    backgroundColor: 'rgba(31, 41, 55, 0.4)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(67, 113, 203, 0.6)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
    ...SHADOWS.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 210, 100, 0.3)',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  infoText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  ratingContainer: {
    marginTop: 4,
  },
  ratingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: 'bold',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -SPACING.xs,
    marginTop: SPACING.sm,
  },
  photoContainer: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  photoGradient: {
    padding: 3,
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.background.input,
  },
  signOutButton: {
    marginVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
  },
  signOutText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
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
    width: 120,
    height: 64,
    marginTop: SPACING.sm,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
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
  profileCompleteBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    flexDirection: 'row',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  profileCompleteBadgeText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: 'bold',
    marginLeft: 2,
  },
});