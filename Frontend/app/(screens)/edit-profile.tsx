import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Switch, Image, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { getCurrentUser } from '../../src/firebase/auth';
import { getUserProfile, setUserProfile } from '../../src/firebase/firestore';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
// --- Import ALL necessary UI components ---
import { FormInput } from '../../src/components/ui/FormInput';
import { FormSelect } from '../../src/components/ui/FormSelect';
import { FormDatePicker } from '../../src/components/ui/FormDatePicker';
import { FormLocationInput, LocationData } from '../../src/components/ui/FormLocationInput';
import { FormRating } from '../../src/components/ui/FormRating';
// --- Import NEW components/functions ---
import { ProfilePhotoGallery } from '../../src/components/ui/ProfilePhotoGallery';
import { pickImage, uploadProfileImage, deleteProfileImage } from '../../src/firebase/storage';
import { arrayUnion, arrayRemove } from 'firebase/firestore'; // Import array manipulation functions
import { updateProfile } from 'firebase/auth'; // Import from firebase/auth
import { auth } from '../../src/firebase/config'; // Import auth instance
import { updateUserAuthProfilePicture } from '../../src/firebase/auth';
import { UserProfileData } from '../../src/types/profile';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/utils/theme';

// --- Combined Validation Schema for ALL fields ---
const schema = yup.object().shape({
  // Basic Info
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  age: yup.number().required('Age is required').min(18, 'Must be at least 18').max(100, 'Age seems unlikely').typeError('Age must be a number'),
  gender: yup.string().required('Gender is required'),
  occupation: yup.string().required('Occupation is required'),
  bio: yup.string().required('Bio is required').min(50, 'Bio must be at least 50 characters').max(500, 'Bio must not exceed 500 characters'),
  // Preferences
  budgetMin: yup.number().required('Min budget required').min(0, 'Min budget cannot be negative').typeError('Min budget must be a number'),
  budgetMax: yup.number().required('Max budget required').min(yup.ref('budgetMin'), 'Max budget must be greater than or equal to min budget').typeError('Max budget must be a number'),
  moveInDate: yup.date().required('Move-in date required').typeError('Invalid date format'),
  duration: yup.string().required('Lease duration is required'),
  location: yup.string().required('Preferred location is required'),
  roomType: yup.string().required('Room type preference is required'),
  // Lifestyle
  cleanliness: yup.number().required('Cleanliness rating required').min(1).max(5),
  noise: yup.number().required('Noise rating required').min(1).max(5),
  guestComfort: yup.number().required('Guest comfort rating required').min(1).max(5),
  schedule: yup.string().required('Schedule preference is required'),
  smoking: yup.boolean().required('Smoking preference required'),
  pets: yup.boolean().required('Pet preference required'),
});

// --- Define ALL Options ---
const genderOptions = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Non-binary', value: 'non-binary' },
  { label: 'Other', value: 'other'},
  { label: 'Prefer not to say', value: 'prefer-not-to-say' },
];
const durationOptions = [
  { label: 'Less than 6 months', value: 'short' },
  { label: '6 months - 1 year', value: 'medium' },
  { label: 'More than 1 year', value: 'long' },
  { label: 'Flexible', value: 'flexible'},
];
const roomTypeOptions = [
  { label: 'Private Room', value: 'private' },
  { label: 'Shared Room', value: 'shared' },
  { label: 'Either', value: 'either' },
];
const scheduleOptions = [
  { label: 'Early Bird', value: 'early_bird' },
  { label: 'Night Owl', value: 'night_owl' },
  { label: 'Flexible', value: 'flexible' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileData | null>(null); // Holds the original fetched profile
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // --- NEW STATE for photos and upload status ---
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDirtyPhotos, setIsDirtyPhotos] = useState(false); // Track if photos changed
  // --- NEW STATE for selected profile pic URL ---
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  // Track overall dirty state (form OR photos OR profile pic selection)
  const [isProfilePicDirty, setIsProfilePicDirty] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty: isFormDirty },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(schema),
    mode: 'onChange', // Validate on change to give feedback earlier
  });

  const budgetMinValue = watch('budgetMin'); // Watch for budgetMax validation message

  // Fetch profile and set ALL form defaults
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const currentUser = getCurrentUser();
      if (currentUser?.uid) {
        try {
          const userProfileData = await getUserProfile(currentUser.uid);
          if (userProfileData) {
            setProfile(userProfileData);
            setPhotos(userProfileData.photos || []);
            // --- Initialize profilePicUrl state ---
            setProfilePicUrl(userProfileData.photoURL || null); // Use the specific field name (e.g., photoURL)
            setIsProfilePicDirty(false); // Reset dirty state
            setIsDirtyPhotos(false); // Reset photo dirty state on load

            // --- Safely get and convert moveInDate ---
            let moveInDateValue = new Date(); // Default to today
            const prefMoveInDate = userProfileData.preferences?.moveInDate;
            if (prefMoveInDate) {
                // Check if it's a Firestore Timestamp
                if (typeof prefMoveInDate.toDate === 'function') {
                    moveInDateValue = prefMoveInDate.toDate();
                // Check if it's already a Date object (less likely from Firestore)
                } else if (prefMoveInDate instanceof Date) {
                    moveInDateValue = prefMoveInDate;
                // Check if it's a string representation (ISO 8601)
                } else if (typeof prefMoveInDate === 'string') {
                   const parsedDate = new Date(prefMoveInDate);
                   if (!isNaN(parsedDate.getTime())) { // Check if parsing was successful
                      moveInDateValue = parsedDate;
                   }
                }
                // Add more checks if other formats are possible
            }
            // --- End Date Conversion ---

            // Reset form with ALL fetched data, providing defaults if missing
            reset({
              // Basic Info
              firstName: userProfileData.basicInfo?.firstName || '',
              lastName: userProfileData.basicInfo?.lastName || '',
              age: userProfileData.basicInfo?.age?.toString() || '',
              gender: userProfileData.basicInfo?.gender || 'prefer-not-to-say',
              occupation: userProfileData.basicInfo?.occupation || '',
              bio: userProfileData.basicInfo?.bio || '',
              // Preferences
              budgetMin: userProfileData.preferences?.budget?.min?.toString() || '0',
              budgetMax: userProfileData.preferences?.budget?.max?.toString() || '1000',
              moveInDate: moveInDateValue,
              duration: userProfileData.preferences?.duration || 'medium',
              location: userProfileData.preferences?.location || '',
              roomType: userProfileData.preferences?.roomType || 'either',
              // Lifestyle
              cleanliness: userProfileData.lifestyle?.cleanliness || 3,
              noise: userProfileData.lifestyle?.noise || 3,
              guestComfort: userProfileData.lifestyle?.guestComfort || 3,
              schedule: userProfileData.lifestyle?.schedule || 'flexible',
              smoking: userProfileData.lifestyle?.smoking ?? false,
              pets: userProfileData.lifestyle?.pets ?? false,
            });
          } else {
            console.warn("No profile data found for user:", currentUser.uid);
            Alert.alert("Error", "Could not load profile data to edit. Please try again later.");
            // Consider navigating back or showing an error message within the screen
            // router.back();
          }
        } catch (error) {
          console.error("Error fetching profile for edit:", error);
          Alert.alert("Error", "Failed to fetch profile data. Check console for details.");
          // router.back();
        }
      } else {
         // This case should ideally be handled by the root layout (_layout.tsx) redirecting unauthenticated users
         console.warn("Edit Profile screen accessed without logged-in user.");
         Alert.alert("Authentication Error", "You need to be logged in to edit your profile.");
         router.replace('/(auth)'); // Redirect to login/auth flow
      }
      setLoading(false);
    };
    fetchProfile();
  }, [reset]); // reset is stable

  // --- Function to handle adding a photo ---
  const handleAddPhoto = async () => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    if (photos.length >= 6) { // Check against max photos (e.g., 6)
        Alert.alert("Limit Reached", "You can upload a maximum of 6 photos.");
        return;
    }

    const pickedImage = await pickImage();
    if (!pickedImage || !pickedImage.uri) return;

    setIsUploadingPhoto(true);
    const downloadURL = await uploadProfileImage(currentUser.uid, pickedImage.uri);
    setIsUploadingPhoto(false);

    if (downloadURL) {
        // Update local state immediately for better UX
        setPhotos(prevPhotos => [...prevPhotos, downloadURL]);
        setIsDirtyPhotos(true); // Mark photos as changed

        // Update Firestore document (add the URL to the photos array)
        try {
            await setUserProfile(currentUser.uid, {
                photos: arrayUnion(downloadURL) // Use arrayUnion to add element
            });
            console.log("Photo URL added to Firestore");
        } catch (error) {
            console.error("Error adding photo URL to Firestore:", error);
            Alert.alert("Error", "Could not save photo reference to profile.");
            // Optionally revert local state change
            setPhotos(prevPhotos => prevPhotos.filter(p => p !== downloadURL));
            setIsDirtyPhotos(false);
        }
    }
  };

  // --- Function to handle removing a photo ---
  const handleRemovePhoto = async (photoUrl: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser || !photoUrl) return;

    let deletedFromStorage = false;

    // 1. Check if it's a valid Firebase Storage URL before attempting deletion
    if (photoUrl.startsWith('https://') || photoUrl.startsWith('gs://')) {
      console.log("Attempting to delete valid URL from storage:", photoUrl);
      deletedFromStorage = await deleteProfileImage(photoUrl);
      if (!deletedFromStorage) {
        // If storage deletion failed for a valid URL, alert the user and stop
        Alert.alert("Error", "Failed to delete photo from storage. It might have already been deleted.");
        return; 
      }
    } else if (photoUrl.startsWith('file://')) {
      // If it's a local file URI, assume it never uploaded correctly.
      // Mark as 'deleted' locally to remove it from Firestore/state.
      console.warn("Removing local file URI reference (likely failed upload):", photoUrl);
      deletedFromStorage = true; // Treat as success for local cleanup purposes
    } else {
      // Unrecognized URL format
      console.error("Cannot delete photo with unrecognized URL format:", photoUrl);
      Alert.alert("Error", "Cannot process photo deletion due to an unrecognized URL format.");
      return;
    }

    // 2. If storage deletion was successful (or skipped for local URI), update state and Firestore
    if (deletedFromStorage) {
      // Update local state
      setPhotos(prevPhotos => prevPhotos.filter(p => p !== photoUrl));
      setIsDirtyPhotos(true); // Mark photos as changed

      // Update Firestore document (remove the URL from the photos array)
      try {
        await setUserProfile(currentUser.uid, {
          photos: arrayRemove(photoUrl) // Use arrayRemove to remove element
        });
        console.log("Photo URL reference removed from Firestore");

        // Additionally, check if the deleted photo was the main profile picture
        if (photoUrl === profilePicUrl) {
          console.log("Deleted photo was the main profile picture. Resetting profilePicUrl.");
          // Reset profile pic URL locally and in Firestore
          setProfilePicUrl(null); 
          await setUserProfile(currentUser.uid, { photoURL: null });
          // Also update Firebase Auth if possible (optional, depends on requirements)
          await updateUserAuthProfilePicture(null); 
          setIsProfilePicDirty(true); // Mark profile pic as changed
        }

      } catch (error) {
        console.error("Error removing photo URL from Firestore:", error);
        Alert.alert("Error", "Could not update photo references in profile.");
        // Revert local state change if Firestore update fails
        setPhotos(prevPhotos => [...prevPhotos, photoUrl]); 
        setIsDirtyPhotos(false);
      }
    }
  };

  // --- NEW Function to handle selecting a photo as the profile picture ---
  const handleSelectAsProfilePic = async (newProfilePicUrl: string) => {
      const currentUser = getCurrentUser();
      if (!currentUser || newProfilePicUrl === profilePicUrl) return; // No user or already selected

      console.log("Attempting to set profile picture:", newProfilePicUrl);
      // 1. Update local state immediately for responsiveness
      const previousProfilePicUrl = profilePicUrl; // Store previous URL in case of rollback
      setProfilePicUrl(newProfilePicUrl);
      setIsProfilePicDirty(true); // Mark profile pic as changed

      try {
          // 2. Update the main profile picture URL in Firestore
          await setUserProfile(currentUser.uid, {
              photoURL: newProfilePicUrl // Update the specific field in Firestore
          });
          console.log("Firestore photoURL updated.");

          // 3. (Optional but recommended) Update Firebase Auth user profile
          const authUpdated = await updateUserAuthProfilePicture(newProfilePicUrl);
          if (!authUpdated) {
              // If auth update fails, maybe alert user but keep Firestore change? Or revert?
              // For simplicity, we'll proceed but log the warning.
              console.warn("Auth profile picture update failed, but Firestore was updated.");
          }

          // If all successful, keep the local state and dirty flag
      } catch (error) {
          console.error("Error setting new profile picture:", error);
          Alert.alert("Error", "Could not set the new profile picture.");
          // Rollback local state if Firestore update failed
          setProfilePicUrl(previousProfilePicUrl);
          setIsProfilePicDirty(false);
      }
  };

  // --- Updated save function to include all sections ---
  const handleSaveChanges = async (data: any) => {
    setSaving(true);
    const currentUser = getCurrentUser();
    if (!currentUser) {
       Alert.alert("Error", "Not logged in.");
       setSaving(false);
       return;
    }

    try {
      // Prepare data for each section from the validated form 'data'
      const updatedBasicInfo = {
        firstName: data.firstName,
        lastName: data.lastName,
        age: parseInt(data.age, 10) || 0,
        gender: data.gender,
        occupation: data.occupation,
        bio: data.bio,
      };
      const updatedPreferences = {
         budget: {
           min: parseInt(data.budgetMin, 10) || 0,
           max: parseInt(data.budgetMax, 10) || 0,
         },
         moveInDate: data.moveInDate instanceof Date ? data.moveInDate : new Date(), // Ensure it's a Date object for Firestore
         duration: data.duration,
         location: data.location,
         roomType: data.roomType,
      };
      const updatedLifestyle = {
        cleanliness: data.cleanliness,
        noise: data.noise,
        guestComfort: data.guestComfort,
        schedule: data.schedule,
        smoking: data.smoking,
        pets: data.pets,
      };

      // Merge updates into Firestore document
      await setUserProfile(currentUser.uid, {
         basicInfo: updatedBasicInfo,
         preferences: updatedPreferences,
         lifestyle: updatedLifestyle,
         // lastUpdated: serverTimestamp() // Optional: Import serverTimestamp from 'firebase/firestore'
      });

      console.log("Profile successfully updated in Firestore for user:", currentUser.uid);
      Alert.alert("Success", "Profile updated!");
      setIsDirtyPhotos(false); // Reset photo dirty flag after successful save
      setIsProfilePicDirty(false); // Reset profile pic dirty flag after successful form save
      router.back(); // Navigate back after successful save

    } catch (error) {
       console.error("Error saving profile:", error);
       Alert.alert("Error", `Failed to save changes: ${error.message || 'Unknown error'}`);
    } finally {
       setSaving(false);
    }
  };

  // Determine overall dirtiness (form OR photos OR profile pic changed)
  const isAnythingDirty = isFormDirty || isDirtyPhotos || isProfilePicDirty;

  // --- Loading and Error States ---
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Animated.View entering={ZoomIn.springify().delay(100)}>
          <LinearGradient
            colors={[COLORS.primary, 'rgba(39, 64, 117, 0.9)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.loadingCard}
          >
            <ActivityIndicator size="large" color={COLORS.secondary} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    );
  }
  
  if (!profile) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Animated.View entering={FadeInDown.springify().delay(100)} style={styles.errorCard}>
          <LinearGradient
            colors={['rgba(255, 68, 68, 0.9)', 'rgba(200, 30, 30, 0.8)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.errorGradient}
          >
            <Text style={styles.errorTitle}>Failed to load profile data</Text>
            <Text style={styles.errorMessage}>Please check your connection and try again.</Text>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.goBackButton}
            >
              <LinearGradient
                colors={[COLORS.secondary, '#E5B93C']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.buttonGradient}
              >
                <Text style={styles.goBackButtonText}>Go Back</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </SafeAreaView>
    );
  }

  // --- Main Render ---
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: { 
            backgroundColor: 'transparent',
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text.primary,
          headerTitle: () => (
            <Animated.View 
              entering={FadeInDown.duration(600).delay(200)}
              style={styles.headerTitleContainer}
            >
              <Text style={styles.headerTitle}>Edit Profile</Text>
            </Animated.View>
          ),
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={styles.headerButton}
            >
              <ChevronLeft size={26} color={COLORS.text.primary} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleSubmit(handleSaveChanges)} 
              disabled={saving || !isAnythingDirty} 
              style={[
                styles.headerButton,
                !isAnythingDirty && styles.headerButtonDisabled
              ]}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.text.primary} size="small"/>
              ) : (
                <Save 
                  size={24} 
                  color={isAnythingDirty ? COLORS.secondary : COLORS.text.secondary} 
                />
              )}
            </TouchableOpacity>
          ),
          headerBackground: () => (
            <LinearGradient
              colors={['rgba(67, 113, 203, 0.95)', 'rgba(27, 41, 80, 0.9)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={{ flex: 1 }}
            />
          ),
        }}
      />
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
        >
          {/* --- Photo Gallery Section --- */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(100)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionGlowBorder}>
              <LinearGradient
                colors={['rgba(240, 210, 100, 0.7)', 'rgba(67, 113, 203, 0.7)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientBorder}
              >
                <View style={styles.sectionContent}>
                  <ProfilePhotoGallery
                    photos={photos}
                    profilePicUrl={profilePicUrl}
                    onAddPhoto={handleAddPhoto}
                    onRemovePhoto={handleRemovePhoto}
                    onSelectAsProfile={handleSelectAsProfilePic}
                    uploading={isUploadingPhoto}
                    maxPhotos={6}
                  />
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* --- Basic Info Section --- */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(200)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionGlowBorder}>
              <LinearGradient
                colors={['rgba(67, 113, 203, 0.7)', 'rgba(27, 94, 65, 0.7)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientBorder}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Basic Info</Text>
                    <View style={styles.sectionDivider} />
                  </View>
                  
                  <Controller control={control} name="firstName" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput label="First Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.firstName?.message} placeholder="Enter first name" /> 
                  )}/>
                  <Controller control={control} name="lastName" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput label="Last Name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.lastName?.message} placeholder="Enter last name" /> 
                  )}/>
                  <Controller control={control} name="age" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput label="Age" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.age?.message} keyboardType="numeric" placeholder="e.g., 25" /> 
                  )}/>
                  <Controller control={control} name="gender" render={({ field: { onChange, value } }) => ( 
                    <FormSelect label="Gender" value={value} options={genderOptions} onSelect={onChange} error={errors.gender?.message} /> 
                  )}/>
                  <Controller control={control} name="occupation" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput label="Occupation" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.occupation?.message} placeholder="e.g., Student, Engineer" /> 
                  )}/>
                  <Controller control={control} name="bio" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput 
                      label="Bio" 
                      value={value} 
                      onChangeText={onChange} 
                      onBlur={onBlur} 
                      error={errors.bio?.message} 
                      multiline 
                      numberOfLines={4} 
                      textAlignVertical="top" 
                      inputStyle={styles.bioInput} 
                      placeholder="Tell potential roommates about yourself..." 
                    /> 
                  )}/>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* --- Preferences Section --- */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(300)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionGlowBorder}>
              <LinearGradient
                colors={['rgba(27, 94, 65, 0.7)', 'rgba(240, 210, 100, 0.7)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientBorder}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Preferences</Text>
                    <View style={styles.sectionDivider} />
                  </View>
                  
                  <Controller control={control} name="budgetMin" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput 
                      label="Min Budget ($/month)" 
                      value={value} 
                      onChangeText={onChange} 
                      onBlur={onBlur} 
                      error={errors.budgetMin?.message ? String(errors.budgetMin.message) : undefined} 
                      keyboardType="numeric" 
                      placeholder="e.g., 500"
                    /> 
                  )}/>
                  <Controller control={control} name="budgetMax" render={({ field: { onChange, onBlur, value } }) => ( 
                    <FormInput 
                      label="Max Budget ($/month)" 
                      value={value} 
                      onChangeText={onChange} 
                      onBlur={onBlur} 
                      error={errors.budgetMax?.message?.replace('budgetMin', budgetMinValue || 'min')} 
                      keyboardType="numeric" 
                      placeholder="e.g., 1500"
                    /> 
                  )}/>
                  <Controller control={control} name="moveInDate" render={({ field: { onChange, value } }) => ( 
                    <FormDatePicker 
                      label="Desired Move-in Date" 
                      value={value} 
                      onChange={onChange} 
                      error={errors.moveInDate?.message} 
                      minimumDate={new Date()} 
                    /> 
                  )}/>
                  <Controller control={control} name="duration" render={({ field: { onChange, value } }) => ( 
                    <FormSelect 
                      label="Lease Duration" 
                      value={value} 
                      options={durationOptions} 
                      onSelect={onChange} 
                      error={errors.duration?.message} 
                    /> 
                  )}/>
                  <Controller control={control} name="location" render={({ field: { onChange, value } }) => { 
                    const handleLocationSelect = (locationData: LocationData) => { 
                      console.log("Location selected:", locationData); 
                      onChange(locationData.description); 
                    }; 
                    return (
                      <FormLocationInput 
                        label="Preferred Location" 
                        onLocationSelect={handleLocationSelect} 
                        initialValue={typeof value === 'string' ? value : ''} 
                        error={errors.location?.message} 
                        placeholder="Search for city or neighborhood" 
                      />
                    ); 
                  }}/>
                  <Controller control={control} name="roomType" render={({ field: { onChange, value } }) => ( 
                    <FormSelect 
                      label="Room Type Preference" 
                      value={value} 
                      options={roomTypeOptions} 
                      onSelect={onChange} 
                      error={errors.roomType?.message} 
                    /> 
                  )}/>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* --- Lifestyle Section --- */}
          <Animated.View 
            entering={FadeInDown.duration(600).delay(400)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionGlowBorder}>
              <LinearGradient
                colors={['rgba(240, 210, 100, 0.7)', 'rgba(67, 113, 203, 0.7)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.gradientBorder}
              >
                <View style={styles.sectionContent}>
                  <View style={styles.sectionHeaderContainer}>
                    <Text style={styles.sectionHeader}>Lifestyle</Text>
                    <View style={styles.sectionDivider} />
                  </View>
                  
                  <Controller control={control} name="cleanliness" render={({ field: { onChange, value } }) => ( 
                    <FormRating 
                      label="Cleanliness Preference" 
                      value={value} 
                      onChange={onChange} 
                      lowLabel="Relaxed" 
                      highLabel="Very tidy" 
                      error={errors.cleanliness?.message as string | undefined}
                    /> 
                  )}/>
                  <Controller control={control} name="noise" render={({ field: { onChange, value } }) => ( 
                    <FormRating 
                      label="Noise Level Preference" 
                      value={value} 
                      onChange={onChange} 
                      lowLabel="Quiet" 
                      highLabel="Lively" 
                      error={errors.noise?.message as string | undefined}
                    /> 
                  )}/>
                  <Controller control={control} name="guestComfort" render={({ field: { onChange, value } }) => ( 
                    <FormRating 
                      label="Comfort with Guests" 
                      value={value} 
                      onChange={onChange} 
                      lowLabel="Rarely" 
                      highLabel="Often" 
                      error={errors.guestComfort?.message as string | undefined}
                    /> 
                  )}/>
                  <Controller control={control} name="schedule" render={({ field: { onChange, value } }) => ( 
                    <FormSelect 
                      label="Typical Schedule" 
                      value={value} 
                      options={scheduleOptions} 
                      onSelect={onChange} 
                      error={errors.schedule?.message} 
                    /> 
                  )}/>
                  
                  <LinearGradient
                    colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.3)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.switchContainer}
                  >
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Smoking Allowed?</Text>
                      <Controller control={control} name="smoking" render={({ field: { onChange, value } }) => ( 
                        <Switch 
                          value={value ?? false} 
                          onValueChange={onChange} 
                          trackColor={{ false: '#555', true: COLORS.primary }} 
                          thumbColor={value ? COLORS.secondary : '#f4f3f4'} 
                          ios_backgroundColor="#3e3e3e" 
                        /> 
                      )}/>
                    </View>
                    {errors.smoking && <Text style={styles.errorText}>{errors.smoking.message}</Text>}
                  </LinearGradient>
                  
                  <LinearGradient
                    colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.3)']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.switchContainer}
                  >
                    <View style={styles.switchRow}>
                      <Text style={styles.switchLabel}>Pets Allowed?</Text>
                      <Controller control={control} name="pets" render={({ field: { onChange, value } }) => ( 
                        <Switch 
                          value={value ?? false} 
                          onValueChange={onChange} 
                          trackColor={{ false: '#555', true: COLORS.primary }} 
                          thumbColor={value ? COLORS.secondary : '#f4f3f4'} 
                          ios_backgroundColor="#3e3e3e" 
                        /> 
                      )}/>
                    </View>
                    {errors.pets && <Text style={styles.errorText}>{errors.pets.message}</Text>}
                  </LinearGradient>
                </View>
              </LinearGradient>
            </View>
          </Animated.View>

          {/* Add some padding at the bottom */}
          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Enhanced Styles ---
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionGlowBorder: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  gradientBorder: {
    padding: 2, // Border thickness
  },
  sectionContent: {
    backgroundColor: COLORS.background.elevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  sectionHeaderContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  sectionDivider: {
    height: 2,
    width: width * 0.4,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.sm,
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize['2xl'],
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    // Add a subtle glow effect to the text
    textShadowColor: 'rgba(240, 210, 100, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerButton: {
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    // Add glow effect to header buttons
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  headerButtonDisabled: {
    opacity: 0.5,
    // No glow for disabled buttons
    shadowOpacity: 0,
    elevation: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    width: width * 0.85,
    maxWidth: 350,
    ...SHADOWS.lg,
  },
  loadingText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    marginTop: SPACING.lg,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background.default,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorCard: {
    width: width * 0.85,
    maxWidth: 350,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  errorGradient: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  errorTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  errorMessage: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    opacity: 0.9,
  },
  goBackButton: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    width: '80%',
    ...SHADOWS.md,
  },
  buttonGradient: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  goBackButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  bioInput: {
    minHeight: 120,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
    textAlignVertical: 'top',
  },
  switchContainer: {
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.sm,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  switchLabel: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.sm,
    marginTop: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
});

