import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator, 
  ScrollView, 
  Dimensions,
  Alert 
} from 'react-native';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { Plus, X, Camera, Upload, Check, ArrowLeft, Image as ImageIcon } from 'lucide-react-native';
import { setUserProfile } from '../../firebase/firestore';
import { getCurrentUser } from '../../firebase/auth';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

export function PhotosStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();
  const [photos, setPhotos] = useState<string[]>(formData.photos || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async (useCamera = false) => {
    try {
      if (photos.length >= 5) {
        setError('You can add up to 5 photos');
        return;
      }
      
      setLoading(true);
      setError('');

      let result;
      if (useCamera) {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          setError('Camera permission is required to take photos');
          setLoading(false);
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          setError('Media library permission is required to select photos');
          setLoading(false);
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newPhotos = [...photos, result.assets[0].uri];
        setPhotos(newPhotos);
        updateFormData({ photos: newPhotos });
      }
    } catch (err) {
      setError('Error selecting image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removePhoto = (index: number) => {
    // Confirm before removing
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove this photo?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Remove", 
          onPress: () => {
            const newPhotos = [...photos];
            newPhotos.splice(index, 1);
            setPhotos(newPhotos);
            updateFormData({ photos: newPhotos });
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleBack = () => {
    setCurrentStep(2); // Go back to lifestyle
  };

  const handleComplete = async () => {
    if (photos.length === 0) {
      setError('Please add at least one photo to continue');
      return;
    }

    // Start loading indicator
    setLoading(true);
    setError(''); // Clear previous errors

    try {
      const user = getCurrentUser();
      
      if (!user) {
        setError('Error: Not logged in. Cannot save profile.');
        setLoading(false);
        return;
      }

      // Prepare the final data object
      const finalProfileData = {
        ...formData, // Spread existing data
        photos: photos,
        isProfileComplete: true // This is crucial!
      };

      // Save the complete profile data to Firestore
      await setUserProfile(user.uid, finalProfileData);

      console.log("Profile creation complete and saved to Firebase!");
      router.replace('/(screens)/');

    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false} 
      nestedScrollEnabled={true}
    >
      {/* Header */}
      <Animated.View 
        entering={FadeInDown.duration(600).delay(100)}
        style={styles.headerContainer}
      >
        <LinearGradient
          colors={[COLORS.secondary, 'rgba(240, 210, 100, 0.8)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}
        >
          <ImageIcon size={40} color={COLORS.primary} />
          <Text style={styles.headerText}>Show Yourself Off</Text>
        </LinearGradient>
      </Animated.View>

      {/* Subtitle */}
      <Animated.View entering={FadeInDown.duration(600).delay(150)}>
        <Text style={styles.subtitle}>
          Add photos that clearly show you. This helps potential roommates get to know you better.
        </Text>
      </Animated.View>

      {/* Photos Grid */}
      <Animated.View 
        entering={FadeInDown.duration(600).delay(200)}
        style={styles.photosContainer}
      >
        {photos.map((photo, index) => (
          <Animated.View 
            key={index} 
            entering={FadeIn.duration(300)} 
            style={styles.photoWrapper}
          >
            <LinearGradient
              colors={[COLORS.primary, 'rgba(67, 113, 203, 0.7)']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.photoBorder}
            >
              <Image source={{ uri: photo }} style={styles.photo} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </LinearGradient>
          </Animated.View>
        ))}

        {photos.length < 5 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.photoWrapper}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => pickImage(false)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.secondary} size="large" />
              ) : (
                <>
                  <Plus size={32} color={COLORS.text.secondary} />
                  <Text style={styles.addButtonText}>Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>

      {/* Error Message */}
      {error ? (
        <Animated.View entering={FadeIn.duration(300)}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}

      {/* Upload Options */}
      <Animated.View 
        entering={FadeInDown.duration(600).delay(300)}
        style={styles.formContainer}
      >
        <View style={styles.formGlowBorder}>
          <LinearGradient
            colors={['rgba(240, 210, 100, 0.7)', 'rgba(67, 113, 203, 0.7)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientBorder}
          >
            <View style={styles.formContent}>
              <Text style={styles.optionsTitle}>Upload Options</Text>
              
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => pickImage(true)}
                disabled={loading || photos.length >= 5}
              >
                <LinearGradient
                  colors={['rgba(31, 41, 55, 0.9)', 'rgba(31, 41, 55, 0.7)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.optionGradient}
                >
                  <Camera size={24} color={COLORS.text.primary} />
                  <Text style={styles.optionText}>Take Photo</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => pickImage(false)}
                disabled={loading || photos.length >= 5}
              >
                <LinearGradient
                  colors={['rgba(31, 41, 55, 0.9)', 'rgba(31, 41, 55, 0.7)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.optionGradient}
                >
                  <Upload size={24} color={COLORS.text.primary} />
                  <Text style={styles.optionText}>Upload from Gallery</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Animated.View>

      {/* Navigation Buttons */}
      <Animated.View 
        entering={FadeInUp.duration(600).delay(400)}
        style={styles.buttonContainer}
      >
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={handleBack}
          activeOpacity={0.8}
          disabled={loading}
        >
          <LinearGradient
            colors={['rgba(67, 113, 203, 0.8)', 'rgba(27, 41, 80, 0.8)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.backButton}
          >
            <ArrowLeft size={20} color={COLORS.text.primary} />
            <Text style={styles.backButtonText}>Previous</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={handleComplete}
          activeOpacity={0.8}
          disabled={photos.length === 0 || loading}
        >
          <LinearGradient
            colors={photos.length === 0 || loading ? 
              ['rgba(100, 100, 100, 0.8)', 'rgba(70, 70, 70, 0.8)'] : 
              [COLORS.success, '#2A8A71']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.completeButton}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.text.primary} size="small" style={{marginRight: 8}} />
            ) : null}
            <Text style={styles.completeButtonText}>Complete Profile</Text>
            {!loading && <Check size={20} color={COLORS.text.primary} />}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginBottom: SPACING.md,
  },
  headerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  headerText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    justifyContent: 'space-between',
  },
  photoWrapper: {
    width: (width - SPACING.md * 3) / 2,
    aspectRatio: 1,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  photoBorder: {
    width: '100%',
    height: '100%',
    padding: 2,
    borderRadius: BORDER_RADIUS.md,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BORDER_RADIUS.full,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  addButton: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border.light,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  addButtonText: {
    color: COLORS.text.primary,
    marginTop: SPACING.sm,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginVertical: SPACING.sm,
    textAlign: 'center',
    fontWeight: TYPOGRAPHY.fontWeight.medium,
  },
  formContainer: {
    marginBottom: SPACING.lg,
  },
  formGlowBorder: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  gradientBorder: {
    padding: 2, // Border thickness
  },
  formContent: {
    backgroundColor: COLORS.background.elevated,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  optionsTitle: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: TYPOGRAPHY.fontWeight.semibold,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  optionButton: {
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  optionText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    marginLeft: SPACING.md,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  buttonWrapper: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
    marginHorizontal: SPACING.xs,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  completeButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  backButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginLeft: SPACING.xs,
  },
  completeButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    marginRight: SPACING.xs,
  },
}); 