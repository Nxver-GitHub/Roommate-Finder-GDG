import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Plus, X, Camera, Upload, Check } from 'lucide-react-native';
import { setUserProfile } from '../../firebase/firestore';
import { getCurrentUser } from '../../firebase/auth';

export function PhotosStep() {
  const { formData, updateFormData, setCurrentStep } = useProfileCreation();
  const [photos, setPhotos] = useState<string[]>(formData.photos || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pickImage = async (useCamera = false) => {
    try {
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
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
    updateFormData({ photos: newPhotos });
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
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Add Photos</Text>
      <Text style={styles.subtitle}>
        Add photos that clearly show you. This helps potential roommates get to know you better.
      </Text>

      <View style={styles.photosContainer}>
        {photos.map((photo, index) => (
          <View key={index} style={styles.photoWrapper}>
            <Image source={{ uri: photo }} style={styles.photo} />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removePhoto(index)}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ))}

        {photos.length < 5 && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => pickImage(false)}
            disabled={loading}
          >
            {loading && photos.length < 5 ? (
              <ActivityIndicator color="#FFD700" />
            ) : (
              <>
                <Plus size={24} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Add Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => pickImage(true)}
          disabled={loading || photos.length >= 5}
        >
          <Camera size={24} color="#FFFFFF" />
          <Text style={styles.optionText}>Take Photo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionButton}
          onPress={() => pickImage(false)}
          disabled={loading || photos.length >= 5}
        >
          <Upload size={24} color="#FFFFFF" />
          <Text style={styles.optionText}>Upload from Gallery</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={handleBack}
          disabled={loading}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            styles.nextButton,
            (photos.length === 0 || loading) && styles.disabledButton,
          ]}
          onPress={handleComplete}
          disabled={photos.length === 0 || loading}
        >
          {loading ? (
             <ActivityIndicator color="#000000" size="small" style={{marginRight: 8}} />
          ) : null}
          <Text style={styles.nextButtonText}>Complete Profile</Text>
          {!loading && <Check size={20} color="#000000" />} 
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  photoWrapper: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: '48%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
  },
  addButtonText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginVertical: 8,
    textAlign: 'center',
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 40,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  backButton: {
    backgroundColor: '#333',
  },
  nextButton: {
    backgroundColor: '#FFD700',
  },
  disabledButton: {
    backgroundColor: '#555',
    opacity: 0.7,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
}); 