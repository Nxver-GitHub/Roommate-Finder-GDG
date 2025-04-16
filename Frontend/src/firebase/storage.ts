import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { storage } from "./config"; // Ensure ./config exports your initialized storage instance
import * as ImagePicker from "expo-image-picker";
import { Alert, Platform } from "react-native"; // Import Platform
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import 'react-native-get-random-values'; // Needed for UUID generation
import { v4 as uuidv4 } from 'uuid';

// --- Permission Request ---
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'web') { // No need to ask on web
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant photo library permission in your device settings to upload images."
      );
      return false;
    }
  }
  return true;
};

// --- Image Picker ---
export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  const hasPermission = await requestMediaLibraryPermission();
  if (!hasPermission) return null;

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3], // Example aspect ratio
      quality: 0.8,
      selectionLimit: 1, // Pick one at a time for the gallery flow
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      console.log("Image picked:", result.assets[0].uri);
      return result.assets[0];
    }
  } catch (error) {
    console.error("Error picking image:", error);
    Alert.alert("Error", "Failed to pick image.");
  }
  return null;
};

// --- Image Compression ---
export const compressImage = async (uri: string): Promise<string> => {
  try {
    console.log("Compressing image:", uri);
    // Resize to max width 800px, maintain aspect ratio
    const result = await manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: SaveFormat.JPEG } // Compress and ensure JPEG
    );
    console.log("Compressed image URI:", result.uri, "Size reduction potential significant");
    return result.uri;
  } catch (error) {
    console.error("Error compressing image:", error);
    Alert.alert("Warning", "Could not compress image, uploading original size.");
    return uri; // Return original if compression fails
  }
};

// --- Blob Conversion Helper (reusing from your original file concept) ---
// Converts a local file URI to a Blob object for uploading
export const uriToBlob = async (uri: string): Promise<Blob> => {
    console.log("Converting URI to Blob:", uri);
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log("Blob created, size:", blob.size, "type:", blob.type);
    return blob;
};


// --- Image Upload for Gallery ---
// Uploads to users/{userId}/photos/{fileName}
export const uploadProfileImage = async (
  userId: string,
  localUri: string
): Promise<string | null> => {
  if (!userId || !localUri) {
      Alert.alert("Error", "User ID and image URI are required for upload.");
      return null;
  }
  try {
    console.log("Starting gallery image upload for user:", userId);
    const compressedUri = await compressImage(localUri);
    const blob = await uriToBlob(compressedUri); // Use the helper function

    // Create a unique filename (e.g., based on timestamp)
    const fileExtension = compressedUri.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${userId}_${Date.now()}.${fileExtension}`;
    const storagePath = `users/${userId}/photos/${fileName}`;
    const storageRef = ref(storage, storagePath);
    console.log("Uploading gallery image to path:", storagePath);

    // Upload the blob
    const snapshot = await uploadBytes(storageRef, blob);
    console.log("Gallery image upload successful:", snapshot.metadata.fullPath);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log("Gallery image Download URL obtained:", downloadURL);
    return downloadURL;

  } catch (error) {
    console.error("Error uploading gallery image:", error);
    Alert.alert("Upload Failed", `Could not upload image: ${error.message || 'Unknown error'}`);
    return null;
  }
};

// --- Image Deletion for Gallery ---
// Deletes an image based on its full download URL
export const deleteProfileImage = async (imageUrl: string): Promise<boolean> => {
   if (!imageUrl) {
       console.warn("Attempted to delete image with invalid URL.");
       return false;
   }
  try {
    console.log("Attempting to delete gallery image:", imageUrl);
    // Create a reference directly from the storage URL
    const storageRef = ref(storage, imageUrl);
    await deleteObject(storageRef);
    console.log("Gallery image deleted successfully:", imageUrl);
    return true;
  } catch (error: any) { // Catch specific error type
    // Handle cases where the object might already be deleted or permissions fail
    if (error.code === 'storage/object-not-found') {
       console.warn("Attempted to delete image that doesn't exist (already deleted?):", imageUrl);
       return true; // Consider it successful if it's already gone
    }
    console.error("Error deleting gallery image:", error);
    Alert.alert("Deletion Failed", `Could not delete image: ${error.message || 'Unknown error'}`);
    return false;
  }
};

/**
 * Uploads a file for chat (image or document) to Firebase Storage
 */
export const uploadChatFile = async (
  fileUri: string,
  path: string = 'chat_files/',
  onProgress?: (progress: number) => void
): Promise<string> => {
  if (!fileUri) {
    throw new Error("File URI is required");
  }

  try {
    console.log(`Starting chat file upload: ${fileUri} to ${path}`);
    
    // Compress if it's an image
    let finalUri = fileUri;
    if (path.includes('chat_images')) {
      finalUri = await compressImage(fileUri);
    }
    
    // Convert to blob
    const blob = await uriToBlob(finalUri);
    
    // Generate a unique filename
    const extension = finalUri.split('.').pop()?.toLowerCase() || 'file';
    const fileName = `${uuidv4()}.${extension}`;
    const storagePath = `${path}${fileName}`;
    
    // Create a reference
    const storageRef = ref(storage, storagePath);
    
    // Create upload task with progress monitoring
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    // Return a promise that resolves with the download URL
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress updates
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload is ${progress}% complete`);
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          // Error handling
          console.error('Upload failed:', error);
          reject(error);
        },
        async () => {
          // Success - get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('File available at:', downloadURL);
            resolve(downloadURL);
          } catch (urlError) {
            console.error('Error getting download URL:', urlError);
            reject(urlError);
          }
        }
      );
    });
  } catch (error) {
    console.error('Error in file upload process:', error);
    throw error;
  }
};
