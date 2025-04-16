import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Trash, Plus, Star } from 'lucide-react-native';

interface ProfilePhotoGalleryProps {
  photos: string[]; // Array of photo URLs
  profilePicUrl?: string | null; // URL of the current profile picture
  onAddPhoto: () => Promise<void>; // Function to trigger add photo flow
  onRemovePhoto: (photoUrl: string) => Promise<void>; // Function to trigger remove photo flow
  onSelectAsProfile: (photoUrl: string) => Promise<void>; // Callback for selection
  uploading: boolean; // Indicate if an upload is in progress
  maxPhotos?: number;
}

export function ProfilePhotoGallery({
  photos = [], // Default to empty array
  profilePicUrl, // Receive current profile pic URL
  onAddPhoto,
  onRemovePhoto,
  onSelectAsProfile, // Receive selection handler
  uploading,
  maxPhotos = 6, // Example max limit
}: ProfilePhotoGalleryProps) {

  const [selectingProfilePic, setSelectingProfilePic] = useState<string | null>(null); // Track which pic is being set

  const handleRemovePress = (photoUrl: string) => {
    // Prevent deleting the current profile picture directly without selecting another first? (Optional logic)
    // if (photoUrl === profilePicUrl) {
    //   Alert.alert("Cannot Delete", "Please select another photo as your profile picture before deleting this one.");
    //   return;
    // }
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => onRemovePhoto(photoUrl) },
      ]
    );
  };

  const handleSelectPress = async (photoUrl: string) => {
      if (photoUrl === profilePicUrl) return; // Already selected

      setSelectingProfilePic(photoUrl); // Show loading indicator on the specific photo
      try {
          await onSelectAsProfile(photoUrl);
      } finally {
          setSelectingProfilePic(null); // Hide loading indicator
      }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Photos</Text>
      <Text style={styles.subtitle}>Tap the star to set your main profile picture.</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.photosContainer}
      >
        {/* Existing Photos */}
        {photos.map((photoUrl) => {
          const isCurrentProfilePic = photoUrl === profilePicUrl;
          const isBeingSelected = selectingProfilePic === photoUrl;

          return (
            <View key={photoUrl} style={[styles.photoWrapper, isCurrentProfilePic && styles.selectedBorder]}>
              <Image source={{ uri: photoUrl }} style={styles.photo} resizeMode="cover" />
              {/* Delete Button */}
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleRemovePress(photoUrl)}
                disabled={uploading || isBeingSelected}
              >
                <Trash size={16} color="#FFFFFF" />
              </TouchableOpacity>
              {/* Select as Profile Button/Indicator */}
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectPress(photoUrl)}
                disabled={isCurrentProfilePic || uploading || isBeingSelected} // Disable if already selected or busy
              >
                {isBeingSelected ? (
                   <ActivityIndicator size="small" color="#FFD700" />
                ) : (
                   <Star
                      size={18}
                      color={isCurrentProfilePic ? "#FFD700" : "#FFFFFF"} // Gold if selected, white otherwise
                      fill={isCurrentProfilePic ? "#FFD700" : "none"} // Fill if selected
                    />
                )}
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Add Photo Button */}
        {photos.length < maxPhotos && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={onAddPhoto}
            disabled={uploading}
          >
            {uploading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Plus size={30} color="#9ca3af" />
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#e5e7eb",
    marginBottom: 4,
  },
   subtitle: {
    fontSize: 14,
    color: "#9ca3af",
    marginBottom: 16,
  },
  photosContainer: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  photoWrapper: {
    marginRight: 12,
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 3, // Add border width
    borderColor: 'transparent', // Default to transparent border
  },
  selectedBorder: {
    borderColor: '#FFD700', // Gold border for selected profile pic
  },
  photo: {
    width: 100,
    height: 133,
    backgroundColor: '#374151',
  },
  deleteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1,
  },
  selectButton: { // Style for the star button
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15, // Make it circular
    padding: 5,
    zIndex: 1,
  },
  addPhotoButton: {
    width: 100,
    height: 133,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: '#4b5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 