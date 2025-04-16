import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform } from 'react-native';
import { Settings, CreditCard as Edit2, User, Edit, LogOut, User as UserIcon, MapPin, DollarSign, CalendarDays, Clock, BedDouble, Cigarette, Dog } from 'lucide-react-native';
import { router, useRouter } from 'expo-router';
import { getCurrentUser, signOut } from '../../src/firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { styled } from 'nativewind';
import { format, isValid } from 'date-fns';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledImage = styled(Image);
const StyledScrollView = styled(ScrollView);

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
      <StyledView className="flex-1 justify-center items-center bg-gray-900">
        <ActivityIndicator size="large" color="#0891b2" />
      </StyledView>
    );
  }

  if (!profile) {
    return (
      <StyledView className="flex-1 justify-center items-center bg-gray-900 p-5">
        <StyledText className="text-white text-lg text-center mb-4">
          Could not load profile. Data might be missing.
        </StyledText>
        <StyledTouchableOpacity
          className="mt-4 bg-red-600 py-2 px-4 rounded-lg flex-row items-center"
          onPress={handleSignOut}
          disabled={signOutLoading}
        >
           {signOutLoading 
             ? <ActivityIndicator color="#fff" style={{ marginRight: 8 }}/> 
             : <LogOut size={18} color="#fff" style={{ marginRight: 8 }} />
           }
           <StyledText className="text-white font-bold">Sign Out</StyledText>
        </StyledTouchableOpacity>
      </StyledView>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/(screens)/edit-profile')}
        >
          <Edit size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.contentContainer}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <Image 
              source={{ uri: profile.photoURL || 'https://via.placeholder.com/100' }} 
              style={styles.profileImage} 
            />
            <View style={styles.profileHeaderText}>
              <Text style={styles.profileName}>
                {`${profile.basicInfo?.firstName || ''} ${profile.basicInfo?.lastName || ''}`.trim() || 'User Name'}
              </Text>
              <Text style={styles.profileSubtitle}>
                {profile.basicInfo?.age ? `${profile.basicInfo.age} years old` : ''}
                {profile.basicInfo?.gender ? ` • ${profile.basicInfo.gender}` : ''}
              </Text>
              <Text style={styles.profileSubtitle}>{profile.basicInfo?.occupation || 'Occupation N/A'}</Text>
            </View>
          </View>
          {profile.basicInfo?.bio && (
            <>
             <View style={styles.separator} />
             <Text style={styles.sectionTitle}>About Me</Text>
             <Text style={styles.bioText}>{profile.basicInfo.bio}</Text>
            </>
          )}
        </View>

        <View style={styles.infoCard}>
           <Text style={styles.cardTitle}>My Preferences</Text>
           <View style={styles.infoRow}>
             <DollarSign size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Budget: {formatBudget(profile.preferences?.budget)}</Text>
           </View>
           <View style={styles.infoRow}>
             <CalendarDays size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Move-in: {formatMoveInDate(profile.preferences?.moveInDate)}</Text>
           </View>
           <View style={styles.infoRow}>
             <Clock size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Duration: {profile.preferences?.duration || 'N/A'}</Text>
           </View>
            <View style={styles.infoRow}>
             <MapPin size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Location: {profile.preferences?.location || 'N/A'}</Text>
           </View>
           <View style={styles.infoRow}>
             <BedDouble size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Room Type: {profile.preferences?.roomType || 'N/A'}</Text>
           </View>
        </View>

         <View style={styles.infoCard}>
           <Text style={styles.cardTitle}>My Lifestyle</Text>
           <Text style={styles.infoText}>Cleanliness: {profile.lifestyle?.cleanliness || 'N/A'}/5</Text>
           <Text style={styles.infoText}>Noise Level: {profile.lifestyle?.noise || 'N/A'}/5</Text>
           <Text style={styles.infoText}>Guests: {profile.lifestyle?.guestComfort || 'N/A'}/5</Text>
           <Text style={styles.infoText}>Schedule: {profile.lifestyle?.schedule || 'N/A'}</Text>
           <View style={styles.infoRow}>
              <Cigarette size={18} color="#ccc" style={styles.infoIcon} />
              <Text style={styles.infoText}>Ok with Smoking: {formatBool(profile.lifestyle?.smoking)}</Text>
           </View>
           <View style={styles.infoRow}>
             <Dog size={18} color="#ccc" style={styles.infoIcon} />
             <Text style={styles.infoText}>Ok with Pets: {formatBool(profile.lifestyle?.pets)}</Text>
           </View>
         </View>
         
         {profile.photos && profile.photos.length > 0 && (
           <View style={styles.infoCard}>
             <Text style={styles.cardTitle}>My Photos</Text>
             <View style={styles.photosContainer}>
               {profile.photos.slice(0, 4).map((photoUri, index) => (
                 <Image key={index} source={{ uri: photoUri }} style={styles.photoThumbnail} />
               ))}
             </View>
           </View>
         )}

        <StyledTouchableOpacity
          className="mt-6 mb-10 bg-red-600 py-3 px-8 rounded-lg flex-row items-center justify-center w-full"
          onPress={handleSignOut}
          disabled={signOutLoading}
        >
          {signOutLoading ? (
             <ActivityIndicator color="#ffffff" style={{ marginRight: 8 }} />
          ) : (
             <LogOut size={18} color="#ffffff" style={{ marginRight: 8 }}/>
          )}
          <StyledText className="text-white text-lg font-bold">Sign Out</StyledText>
        </StyledTouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#444',
    marginRight: 16,
  },
  profileHeaderText: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#AEAEB2',
    marginBottom: 2,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#444',
    marginVertical: 12,
  },
  sectionTitle: {
     fontSize: 16,
     fontWeight: '600',
     color: '#E5E5EA',
     marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#AEAEB2',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#E5E5EA',
    lineHeight: 21,
    flex: 1,
  },
  photosContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
  },
   photoThumbnail: {
     width: '48%',
     aspectRatio: 1,
     borderRadius: 8,
     margin: '1%',
     backgroundColor: '#444',
   },
});