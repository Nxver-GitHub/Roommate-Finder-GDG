import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useProfile } from '../../../hooks/useProfile';
import { useAuth } from '../../../hooks/useAuth';

const INTERESTS = [
  'Reading',
  'Gaming',
  'Sports',
  'Music',
  'Art',
  'Cooking',
  'Travel',
  'Photography',
  'Technology',
  'Fitness',
  'Movies',
  'Dancing',
];

export default function Profile() {
  const { profile, loading, error, updateProfile, uploadProfilePicture, fetchProfile } = useProfile();
  const { signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests || []);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
      setSelectedInterests(profile.interests || []);
    }
  }, [profile]);

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        await uploadProfilePicture(blob);
        setUploadingImage(false);
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setUploadingImage(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        ...editedProfile,
        interests: selectedInterests,
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#001A57" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        {!isEditing && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <Ionicons name="pencil" size={24} color="#FFD200" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.imageContainer} 
          onPress={handleImagePick}
          disabled={!isEditing || uploadingImage}
        >
          {uploadingImage ? (
            <ActivityIndicator size="large" color="#001A57" />
          ) : (
            <>
              <Image 
                source={{ 
                  uri: profile?.photo_url || 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=800'
                }} 
                style={styles.profileImage}
              />
              {isEditing && (
                <View style={styles.imageOverlay}>
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text style={styles.imageOverlayText}>Change Photo</Text>
                </View>
              )}
            </>
          )}
        </TouchableOpacity>

        {isEditing ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={editedProfile?.name}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, name: text }))}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={editedProfile?.major}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, major: text }))}
              placeholder="Major"
            />
            <TextInput
              style={styles.input}
              value={editedProfile?.year}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, year: text }))}
              placeholder="Year"
            />
            <TextInput
              style={styles.input}
              value={editedProfile?.age?.toString()}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, age: parseInt(text) || 0 }))}
              placeholder="Age"
              keyboardType="number-pad"
            />
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={editedProfile?.bio}
              onChangeText={(text) => setEditedProfile(prev => ({ ...prev, bio: text }))}
              placeholder="Bio"
              multiline
            />

            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
              {INTERESTS.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestBadge,
                    selectedInterests.includes(interest) && styles.selectedInterest
                  ]}
                  onPress={() => toggleInterest(interest)}
                >
                  <Text
                    style={[
                      styles.interestText,
                      selectedInterests.includes(interest) && styles.selectedInterestText
                    ]}
                  >
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#001A57" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setEditedProfile(profile);
                setSelectedInterests(profile?.interests || []);
                setIsEditing(false);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.info}>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.details}>
              {profile?.major} • {profile?.year} • {profile?.age} years old
            </Text>
            <Text style={styles.bio}>{profile?.bio}</Text>

            <View style={styles.interests}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.interestsContainer}>
                {profile?.interests?.map((interest) => (
                  <View key={interest} style={styles.interestBadge}>
                    <Text style={styles.interestText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    backgroundColor: '#001A57',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD200',
  },
  editButton: {
    padding: 8,
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    width: 150,
    height: 150,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 75,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageOverlayText: {
    color: '#fff',
    marginTop: 8,
    fontSize: 14,
  },
  info: {
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#001A57',
    marginBottom: 5,
  },
  details: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  bio: {
    fontSize: 16,
    color: '#444',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001A57',
    marginBottom: 10,
  },
  interests: {
    width: '100%',
    marginBottom: 20,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  interestBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedInterest: {
    backgroundColor: '#001A57',
    borderColor: '#001A57',
  },
  interestText: {
    color: '#444',
    fontSize: 14,
  },
  selectedInterestText: {
    color: '#fff',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FFD200',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#001A57',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  signOutButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  signOutButtonText: {
    color: '#ff3b30',
    fontSize: 16,
  },
});