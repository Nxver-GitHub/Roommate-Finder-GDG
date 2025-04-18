import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Linking,
  Share,
  Pressable,
  ScrollView,
  Clipboard,
  ActionSheetIOS
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon, Paperclip, FileText, Download, X, Share as ShareIcon, Copy } from 'lucide-react-native';
import { getCurrentUser } from '../../../src/firebase/auth'; // Use your actual auth functions
import {
  getUserProfile,
  getOrCreateConversation,
  addMessage,
  getMessagesListener,
  areUsersMatched,
} from '../../../src/firebase/firestore';
import { UserProfileData } from '../../../src/types/profile'; // User profile type
import { MessageData } from '../../../src/types/chat'; // Import the MessageData type
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { uploadChatFile } from '../../../src/firebase/storage';
import Modal from "react-native-modal";
import ImageViewer from 'react-native-image-zoom-viewer';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../src/firebase/config';
import { doc, onSnapshot } from 'firebase/firestore'; // Add this import

// Placeholder image URI
const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/100/374151/e5e7eb?text=No+Pic';

// Helper function to format time (can be moved to a utils file later)
const formatTime = (date: Date | undefined | null): string => {
  if (!date || !(date instanceof Date)) return '';
  try {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
  } catch (e) {
    console.error("Error formatting time:", e, "Input date:", date);
    return '';
  }
};

// Define a simple Avatar component directly in this file
const SimpleAvatar = ({ uri, size = 36 }) => {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      borderRadius: size / 2, 
      backgroundColor: '#444',
      overflow: 'hidden'
    }}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={{ width: '100%', height: '100%' }} 
        />
      ) : (
        <View style={{ 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#666',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{ color: '#fff', fontSize: size * 0.5 }}>
            {/* Display first letter if no image */}
            ?
          </Text>
        </View>
      )}
    </View>
  );
};

export default function ConversationScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>(); // Get other user's ID from route param
  const router = useRouter();
  const currentUser = getCurrentUser(); // Get the currently logged-in user

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [otherUserProfile, setOtherUserProfile] = useState<UserProfileData | null>(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false); // State for send button loading
  const [uploading, setUploading] = useState(false); // State for upload progress
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isZoomViewerVisible, setIsZoomViewerVisible] = useState(false);
  const [zoomViewerImages, setZoomViewerImages] = useState<{ url: string }[]>([]);
  const [zoomViewerIndex, setZoomViewerIndex] = useState(0);
  const [isMatched, setIsMatched] = useState(true);

  const flatListRef = useRef<FlatList>(null);

  // Add this at the beginning of your ConversationScreen component
  useEffect(() => {
    (async () => {
      // Request media library permissions for saving images
      if (Platform.OS !== 'web') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Media library permission not granted');
        }
      }
    })();
  }, []);

  // Modify the match status check effect
  useEffect(() => {
    if (!currentUser?.uid || !otherUserId) {
      setError("User information is missing.");
      setLoading(false);
      return;
    }

    // Check match status first
    const checkMatchStatus = async () => {
      try {
        const matched = await areUsersMatched(currentUser.uid, otherUserId);
        setIsMatched(matched);
        
        if (!matched) {
          setError("You can only message users you've matched with.");
          setLoading(false);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Error checking match status:", err);
        setError("Failed to verify match status.");
        setLoading(false);
        return false;
      }
    };

    // Initialize conversation only if matched
    const initializeConversation = async () => {
      const isMatched = await checkMatchStatus();
      if (!isMatched) return;

      try {
        // Get other user's profile
        const profile = await getUserProfile(otherUserId);
        if (profile) {
          setOtherUserProfile(profile);
        } else {
          setError("Could not load user's profile.");
          return;
        }

        // Get or create conversation
        const convId = await getOrCreateConversation(currentUser.uid, otherUserId);
        setConversationId(convId);

        // Set up message listener
        const messagesUnsubscribe = getMessagesListener(
          convId,
          (receivedMessages) => {
            setMessages(receivedMessages);
            setError(null);
            if (loading) setLoading(false);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          },
          (listenerError) => {
            console.error("Message listener error:", listenerError);
            setError("Failed to load messages.");
            setLoading(false);
          }
        );

        // Set up match status listener
        const matchRef = doc(db, 'matches', currentUser.uid, 'userMatches', otherUserId);
        const unsubscribeMatch = onSnapshot(matchRef, (snapshot) => {
          const stillMatched = snapshot.exists();
          setIsMatched(stillMatched);
          if (!stillMatched) {
            setError("You are no longer matched with this user.");
          }
        });

        return () => {
          messagesUnsubscribe();
          unsubscribeMatch();
        };
      } catch (error) {
        console.error("Error initializing conversation:", error);
        setError("Failed to initialize conversation.");
        setLoading(false);
      }
    };

    const cleanup = initializeConversation();
    return () => {
      if (cleanup) cleanup.then(unsubscribe => unsubscribe());
    };
  }, [currentUser?.uid, otherUserId]);

  // --- Handle Attachment Button Press ---
  const handleAttach = async () => {
    if (!currentUser?.uid || !conversationId) {
      Alert.alert("Error", "Cannot attach files right now.");
      return;
    }

    Alert.alert(
      "Attach File",
      "Choose an option",
      [
        { 
          text: "Choose from Gallery", 
          onPress: () => pickImage(true) 
        },
        { 
          text: "Take Photo", 
          onPress: () => pickImage(false) 
        },
        { 
          text: "Choose File", 
          onPress: () => pickDocument() 
        },
        { 
          text: "Cancel", 
          style: "cancel" 
        }
      ]
    );
  };

  // Pick image from gallery or camera
  const pickImage = async (useLibrary: boolean) => {
    try {
      let permissionResult;
      let result;
      
      if (useLibrary) {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Permission Required", "You need to grant access to your media library.");
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      } else {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert("Permission Required", "You need to grant access to your camera.");
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.7,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSendFile(
          asset.uri, 
          'chat_images/', 
          asset.fileName || 'image.jpg', 
          asset.mimeType || 'image/jpeg',
          asset.size
        );
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Could not select image.");
    }
  };

  // Pick document
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        await uploadAndSendFile(
          asset.uri,
          'chat_files/',
          asset.name,
          asset.mimeType,
          asset.size
        );
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Could not select file.");
    }
  };

  // Upload and send file
  const uploadAndSendFile = async (
    fileUri: string,
    storagePath: string,
    fileName?: string,
    fileType?: string,
    fileSize?: number
  ) => {
    if (!currentUser?.uid || !conversationId) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Extract filename from URI if not provided
      const extractedFileName = fileName || fileUri.split('/').pop() || 'file';
      
      const downloadURL = await uploadChatFile(
        fileUri,
        storagePath,
        (progress) => setUploadProgress(progress)
      );

      // Prepare message data without undefined values
      const messageData: any = {
        senderId: currentUser.uid,
        fileName: extractedFileName,
        fileType: fileType || 'application/octet-stream',
      };
      
      // Only add fileSize if it's a valid number
      if (typeof fileSize === 'number' && !isNaN(fileSize)) {
        messageData.fileSize = fileSize;
      }

      if (storagePath.includes('chat_images')) {
        messageData.imageUrl = downloadURL;
      } else {
        messageData.fileUrl = downloadURL;
      }

      await addMessage(conversationId, messageData);
      console.log("Attachment message sent successfully");
    } catch (error) {
      console.error("Error uploading/sending file:", error);
      Alert.alert("Upload Failed", "Could not send attachment. Please try again.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Modify the send message handler
  const handleSend = async () => {
    if (!isMatched) {
      Alert.alert("Cannot Send Message", "You can only send messages to matched users.");
      return;
    }
    if (!messageText.trim() || !conversationId || !currentUser?.uid) return;

    try {
      setSending(true);
      await addMessage(conversationId, {
        senderId: currentUser.uid,
        text: messageText.trim(),
        timestamp: new Date(),
      });
      setMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // --- Image Interaction Functions ---
  const openImageZoomViewer = (imageUrl: string) => {
    console.log("Opening image zoom viewer for:", imageUrl);
    setZoomViewerImages([{ url: imageUrl }]);
    setZoomViewerIndex(0);
    setIsZoomViewerVisible(true);
  };

  const closeImageZoomViewer = () => {
    console.log("Closing image zoom viewer");
    setIsZoomViewerVisible(false);
    setZoomViewerImages([]); // Clear images when closing
  };

  // --- Keep your existing handleSaveImage, handleCopyImage, handleShareImage ---
  const handleSaveImage = async (imageUrl: string) => {
    try {
      console.log("Attempting to save image:", imageUrl);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to save photos.');
        return;
      }
      const fileUri = FileSystem.documentDirectory + `temp-${Date.now()}.jpg`;
      const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
      await MediaLibrary.createAssetAsync(uri);
      await FileSystem.deleteAsync(uri, { idempotent: true });
      Alert.alert('Success', 'Image saved to your photos!');
      closeImageZoomViewer(); // Close viewer after action
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleCopyImage = async (imageUrl: string) => {
    try {
      console.log("Attempting to copy image URL:", imageUrl);
      await Clipboard.setString(imageUrl);
      Alert.alert('Success', 'Image URL copied to clipboard!');
      closeImageZoomViewer(); // Close viewer after action
    } catch (error) {
      console.error('Error copying image URL:', error);
      Alert.alert('Error', 'Failed to copy image URL.');
    }
  };

  const handleShareImage = async (imageUrl: string) => {
     try {
       console.log("Attempting to share image:", imageUrl);
       const fileUri = FileSystem.documentDirectory + `temp-${Date.now()}.jpg`;
       const { uri } = await FileSystem.downloadAsync(imageUrl, fileUri);
       await Share.share({ url: uri, message: 'Check out this image!' });
       await FileSystem.deleteAsync(uri, { idempotent: true });
       // Don't close viewer immediately, let share sheet handle it
     } catch (error) {
       console.error('Error sharing image:', error);
       Alert.alert('Error', 'Failed to share image.');
     }
  };

  // --- File Handling Functions (openFileExternally, downloadFile, handleFileLongPress) ---
  const openFileExternally = async (fileUrl: string | undefined) => {
    if (!fileUrl) {
      Alert.alert("Error", "File URL is missing.");
      return;
    }
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        // Fallback: Maybe try to download or show a message?
        // For now, just alert the user.
        Alert.alert("Error", `Don't know how to open this URL: ${fileUrl}`);
        // You could potentially try downloading it here using FileSystem
        // and then let the user open it from their downloads.
      }
    } catch (error) {
      console.error("Error opening file URL:", error);
      Alert.alert("Error", "Could not open the file.");
    }
  };

  const downloadFile = async (fileUrl: string, fileName: string) => {
    try {
      // Get permissions if not already granted
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to save files.');
        return;
      }

      // Show download progress
      setUploading(true);
      setUploadProgress(0);

      // Download the file
      const fileUri = FileSystem.documentDirectory + fileName;
      const downloadResumable = FileSystem.createDownloadResumable(
        fileUrl,
        fileUri,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          setUploadProgress(progress);
        }
      );

      const { uri } = await downloadResumable.downloadAsync();
      
      // Save to device
      if (uri) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert('Success', `File saved: ${fileName}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Error', 'Failed to download file.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileLongPress = async (fileUrl: string, fileName: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', `Save "${fileName}"`, 'Copy Link', 'Share', 'Open'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          switch (buttonIndex) {
            case 1: // Save
              await downloadFile(fileUrl, fileName);
              break;
            case 2: // Copy Link
              await Clipboard.setStringAsync(fileUrl);
              Alert.alert('Success', 'File link copied to clipboard');
              break;
            case 3: // Share
              try {
                await Share.share({
                  url: fileUrl,
                  message: fileName,
                });
              } catch (error) {
                console.error('Error sharing file:', error);
              }
              break;
            case 4: // Open
              await openFileExternally(fileUrl);
              break;
          }
        }
      );
    } else {
      Alert.alert(
        `File: ${fileName}`,
        'Choose an action',
        [
          {
            text: 'Save',
            onPress: () => downloadFile(fileUrl, fileName),
          },
          {
            text: 'Copy Link',
            onPress: async () => {
              await Clipboard.setStringAsync(fileUrl);
              Alert.alert('Success', 'File link copied to clipboard');
            },
          },
          {
            text: 'Share',
            onPress: async () => {
              try {
                await Share.share({
                  url: fileUrl,
                  message: fileName,
                });
              } catch (error) {
                console.error('Error sharing file:', error);
              }
            },
          },
          {
            text: 'Open',
            onPress: () => openFileExternally(fileUrl),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // --- Image Long Press Handling ---
  const handleImageLongPress = (imageUrl: string) => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Save to Photos', 'Copy', 'Share'],
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          switch (buttonIndex) {
            case 1: // Save
              await handleSaveImage(imageUrl);
              break;
            case 2: // Copy
              await handleCopyImage(imageUrl);
              break;
            case 3: // Share
              await handleShareImage(imageUrl);
              break;
          }
        }
      );
    } else {
      Alert.alert(
        "Image Options",
        "What would you like to do with this image?",
        [
          {
            text: 'Save to Photos',
            onPress: () => handleSaveImage(imageUrl),
          },
          {
            text: 'Copy',
            onPress: () => handleCopyImage(imageUrl),
          },
          {
            text: 'Share',
            onPress: () => handleShareImage(imageUrl),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  // --- Render Message Item ---
  const renderMessageItem = ({ item }: { item: MessageData }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;
    const profileImageUri = !isCurrentUser ? (otherUserProfile?.photoURL || PLACEHOLDER_IMAGE_URI) : null;

    return (
      <View style={[styles.messageRow, isCurrentUser ? styles.currentUserRow : styles.otherUserRow]}>
        {!isCurrentUser && (
          <SimpleAvatar uri={profileImageUri} size={32} />
        )}

        <View style={[
          styles.messageBubble, 
          isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
        ]}>
          {/* Image attachment */}
          {item.imageUrl && (
            <TouchableOpacity
              onPress={() => openImageZoomViewer(item.imageUrl!)}
              onLongPress={() => handleImageLongPress(item.imageUrl!)}
              delayLongPress={500}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* Message Text */}
          {item.text && (
            <Text style={[
              styles.messageText, 
              isCurrentUser ? styles.currentUserText : styles.otherUserText
            ]}>
              {item.text}
            </Text>
          )}
          
          {/* Timestamp */}
          <Text style={[
            styles.messageTime, 
            isCurrentUser ? styles.currentUserTime : styles.otherUserTime
          ]}>
            {formatTime(item.timestamp as Date)}
          </Text>
        </View>
      </View>
    );
  };

  // --- Loading and Error States ---
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color="#0891b2" />
          <Text style={styles.loadingText}>Loading Conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1 }}> 
          <Stack.Screen options={{ headerShown: false }} />
          <View style={styles.errorWrapper}>
            <View style={styles.errorHeader}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.errorHeaderText}>Error</Text>
            </View>
            <View style={styles.errorContent}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          </View>
        </View> 
      </SafeAreaView>
    );
  }
  

  // --- Main Conversation View ---
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#121212', // Dark background
          },
          headerTitleStyle: {
            color: '#FFFFFF', // White text
            fontSize: 18,
          },
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerButton}
            >
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
          ),
          headerTitle: otherUserProfile ? 
            `${otherUserProfile.basicInfo?.firstName || 'User'} ${otherUserProfile.basicInfo?.lastName || ''}` : 
            'Chat',
          headerShadowVisible: false, // Remove the bottom shadow
          headerTintColor: '#FFFFFF', // This ensures all header elements are white
        }}
      />

      {!isMatched && (
        <View style={styles.unmatchedBanner}>
          <Text style={styles.unmatchedText}>
            You are no longer matched with this user. Messages cannot be sent.
          </Text>
        </View>
      )}

      {/* Message List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        initialNumToRender={15} 
        maxToRenderPerBatch={10} 
        windowSize={11}
        nestedScrollEnabled={true}
        onContentSizeChange={() => {
          if (!loading) { /* ... */ }
        }}
        onLayout={() => {
          if (!loading) { /* ... */ }
        }}
      /> 

      {/* Upload progress indicator */}
      {uploading && (
        <View style={styles.uploadProgressContainer}>
          <Text style={styles.uploadProgressText}>
            Uploading: {uploadProgress.toFixed(0)}%
          </Text>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (uploading ? 110 : 90) : (uploading ? 90 : 70)}
      >
        <View style={styles.inputContainer}>
         <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttach}
            disabled={uploading || sending}
          >
            <Paperclip size={24} color={(uploading || sending) ? "#555555" : "#888888"} />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            value={messageText}
            onChangeText={setMessageText}
            multiline
            editable={!uploading}
          />
           <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending || uploading) && styles.disabledSendButton,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim() || sending || uploading}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#666666" />
            ) : (
              <Send size={20} color={messageText.trim() && !uploading ? '#FFFFFF' : '#666666'} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView> 

      {/* Image Zoom Viewer Modal */}
      <Modal
        isVisible={isZoomViewerVisible}
        onBackdropPress={closeImageZoomViewer}
        onBackButtonPress={closeImageZoomViewer}
        style={styles.zoomModal}
        backdropOpacity={0.9}
        animationIn="fadeIn"
        animationOut="fadeOut"
        useNativeDriverForBackdrop
        hideModalContentWhileAnimating
      >
        <SafeAreaView style={styles.zoomContainer}>
          <View style={styles.zoomHeader}>
            <TouchableOpacity onPress={closeImageZoomViewer} style={styles.zoomButton}>
              <X size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.zoomActions}>
              <TouchableOpacity
                onPress={() => {
                  const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
                  if (currentImageUrl) handleSaveImage(currentImageUrl);
                }}
                style={styles.zoomButton}
              >
                <Download size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                    const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
                    if (currentImageUrl) handleCopyImage(currentImageUrl);
                }}
                style={styles.zoomButton}
               >
                 <Copy size={28} color="#FFFFFF" />
               </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
                  if (currentImageUrl) handleShareImage(currentImageUrl);
                }}
                style={styles.zoomButton}
              >
                <ShareIcon size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {zoomViewerImages.length > 0 && (
            <ImageViewer
              imageUrls={zoomViewerImages}
              index={zoomViewerIndex}
              onSwipeDown={closeImageZoomViewer}
              enableSwipeDown={true}
              renderIndicator={() => null}
              backgroundColor="transparent"
              style={{ flex: 1 }}
              saveToLocalByLongPress={false}
              loadingRender={() => <ActivityIndicator size="large" color="#FFFFFF" />}
              enablePreload={true}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// --- Styles (Adjust as needed) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#121212',
  },
  loadingText: {
    marginTop: 10,
    color: '#9ca3af',
    fontSize: 16,
  },
   errorHeader: { // Minimal header for error screen
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 10, // Adjust for status bar
    left: 0,
    right: 0,
    zIndex: 1,
    backgroundColor: '#1f2937', // Slightly lighter dark
  },
  errorHeaderText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    backgroundColor: '#1f2937', // Slightly lighter dark
  },
  backButton: {
    padding: 5, // Add padding for easier touch
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#374151',
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  // Message List Styles
  messagesList: {
    flexGrow: 1,
    paddingVertical: 12,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },
  currentUserRow: {
    justifyContent: 'flex-end',
  },
  otherUserRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 8,
    overflow: 'hidden', // This ensures the image respects the bubble's border radius
  },
  currentUserBubble: {
    backgroundColor: '#0891b2', // Cyan/blue color for current user
    borderBottomRightRadius: 4,
  },
  otherUserBubble: {
    backgroundColor: '#374151', // Gray for other user
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#FFFFFF',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  currentUserTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  otherUserTime: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  // Input Area Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1f2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0891b2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#374151',
  },
  fileAttachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', // Example subtle background
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 4, // Add space if needed
  },
  fileInfo: {
    flex: 1, // Allow text to take space
    marginHorizontal: 10,
  },
  fileName: {
    fontSize: 14,
    // color inherited via isCurrentUser ? styles.currentUserText : styles.otherUserText
  },
  fileSize: {
    fontSize: 12,
    color: '#9ca3af', // Keep this consistent maybe
    marginTop: 2,
  },
  uploadProgressContainer: {
    paddingVertical: 4,
    paddingHorizontal: 15,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
  },
  uploadProgressText: {
    color: '#aaa',
    fontSize: 12,
  },
  zoomModal: {
    margin: 0,
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  zoomContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  zoomHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    zIndex: 10,
  },
   zoomActions: {
     flexDirection: 'row',
     alignItems: 'center',
   },
  zoomButton: {
    padding: 10,
    marginLeft: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    flex: 1,
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorWrapper: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unmatchedBanner: {
    backgroundColor: '#991B1B',
    padding: 12,
    alignItems: 'center',
  },
  unmatchedText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  headerButton: {
    marginLeft: 8,
    padding: 8,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
}); 