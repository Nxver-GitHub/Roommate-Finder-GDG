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
  getUserProfile, // Function to get user profile
  getOrCreateConversation,
  addMessage,
  getMessagesListener,
} from '../../../src/firebase/firestore'; // Use your actual firestore functions
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

  // --- Effect to initialize conversation and load data ---
  useEffect(() => {
    let unsubscribeMessages: (() => void) | null = null;
    setLoading(true);
    setError(null);

    if (!currentUser?.uid || !otherUserId) {
      setError("User information is missing.");
      setLoading(false);
      return;
    }

    // Fetch other user's profile for the header
    getUserProfile(otherUserId)
      .then(profile => {
        if (profile) {
          setOtherUserProfile(profile);
        } else {
          setError("Could not load matched user's profile.");
        }
      })
      .catch(err => {
        console.error("Error fetching other user profile:", err);
        setError("Failed to load user profile.");
      });

    // Get or create the conversation
    getOrCreateConversation(currentUser.uid, otherUserId)
      .then(convId => {
        setConversationId(convId);
        console.log(`Conversation ID set: ${convId}`);

        // Set up the message listener once we have the conversation ID
        unsubscribeMessages = getMessagesListener(
          convId,
          (receivedMessages) => {
            console.log(`Listener received ${receivedMessages.length} messages.`);
            setMessages(receivedMessages);
            setError(null); // Clear error on successful message fetch
            if (loading) setLoading(false); // Stop initial loading indicator
            // Scroll to bottom after messages are loaded/updated
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          },
          (listenerError) => {
            console.error("Message listener error:", listenerError);
            setError("Failed to load messages.");
            setLoading(false);
          }
        );
      })
      .catch(err => {
        console.error("Error getting/creating conversation:", err);
        setError("Failed to initialize conversation.");
        setLoading(false);
      });

    // Cleanup function
    return () => {
      if (unsubscribeMessages) {
        console.log("Unsubscribing message listener.");
        unsubscribeMessages();
      }
    };
  }, [currentUser?.uid, otherUserId]); // Rerun if user or otherUserId changes


  // --- Handle Sending Messages ---
  const handleSend = async () => {
    if (!messageText.trim() || !currentUser?.uid || !conversationId || sending) return;

    const textToSend = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX
    setSending(true);

    const newMessageData: Omit<MessageData, 'id' | 'timestamp'> = {
      senderId: currentUser.uid,
      text: textToSend,
      // imageUrl: undefined, // Add if implementing image sending
    };

    try {
      console.log("Sending message:", newMessageData);
      await addMessage(conversationId, newMessageData);
      console.log("Message sent successfully.");
      // Messages will update via the listener, no need to manually add here
      // flatListRef.current?.scrollToEnd({ animated: true }); // Listener already scrolls
    } catch (err) {
      console.error("Error sending message:", err);
      Alert.alert("Error", "Could not send message. Please try again.");
      setMessageText(textToSend); // Restore text if sending failed
    } finally {
      setSending(false);
    }
  };

  // --- Function to Open Image Zoom Viewer ---
  const openImageZoomViewer = (imageUrl: string) => {
    setZoomViewerImages([{ url: imageUrl }]);
    setZoomViewerIndex(0); 
    setIsZoomViewerVisible(true);
  };

  // --- Function to Close Image Zoom Viewer ---
  const closeImageZoomViewer = () => {
    setIsZoomViewerVisible(false);
    setZoomViewerImages([]); 
  };
  
  // --- Function to Open File Externally ---
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

  // --- Keep functions for header buttons (Save, Copy, Share) ---
  const handleSaveImage = async () => {
    if (!zoomViewerImages.length || zoomViewerIndex < 0) return;
    const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
    if (!currentImageUrl) return;

    const fileName = currentImageUrl.split('/').pop()?.split('?')[0] || `${uuidv4()}.jpg`; 
    
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant access to save photos.');
        return;
      }
      
      const fileUri = FileSystem.documentDirectory + fileName;
      const { uri } = await FileSystem.downloadAsync(currentImageUrl, fileUri);
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Success', `Image saved.`);
      
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Error', 'Failed to save image.');
    }
  };

  const handleCopyImageLink = () => {
    if (!zoomViewerImages.length || zoomViewerIndex < 0) return;
    const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
    if (!currentImageUrl) return;
    
    Clipboard.setString(currentImageUrl);
    Alert.alert('Copied', 'Image URL copied');
  };

  const handleShareImage = async () => {
    if (!zoomViewerImages.length || zoomViewerIndex < 0) return;
    const currentImageUrl = zoomViewerImages[zoomViewerIndex]?.url;
    if (!currentImageUrl) return;

    try {
      await Share.share({ url: currentImageUrl }); // Use Share API
    } catch (error) {
      console.error('Error sharing image:', error);
      Alert.alert('Error', 'Could not share image.');
    }
  };

  // Add this function to handle file downloads
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

  // Update the file long press handler
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

  // --- Modify the renderMessageItem function to KEEP the long-press ---
  const renderMessageItem = ({ item }: { item: MessageData }) => {
    const isCurrentUser = item.senderId === currentUser?.uid;
    const profileImageUri = !isCurrentUser ? (otherUserProfile?.photoURL || PLACEHOLDER_IMAGE_URI) : null;

    return (
      <View style={[styles.messageRow, isCurrentUser ? styles.currentUserRow : styles.otherUserRow]}>
        {!isCurrentUser && profileImageUri && (
          <Image source={{ uri: profileImageUri }} style={styles.messageAvatar} />
        )}

        <View style={[styles.messageBubble, isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble]}>
          
          {/* Image attachment - KEEP onLongPress */}
          {item.imageUrl && (
            <TouchableOpacity
              onPress={() => openImageZoomViewer(item.imageUrl!)}
              onLongPress={() => handleImageLongPress(item.imageUrl || '')}
              delayLongPress={500}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* File attachment - KEEP onLongPress */}
          {item.fileUrl && (
            <TouchableOpacity 
              style={styles.fileAttachmentContainer}
              onPress={() => openFileExternally(item.fileUrl)}
              onLongPress={() => handleFileLongPress(item.fileUrl || '', item.fileName || 'file')}
              delayLongPress={500}
            >
              <FileText size={24} color={isCurrentUser ? '#FFFFFF' : '#9ca3af'} />
              <View style={styles.fileInfo}>
                <Text 
                  style={[
                    styles.fileName, 
                    isCurrentUser ? styles.currentUserText : styles.otherUserText,
                    { fontWeight: '600' }
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {item.fileName || 'File'}
                </Text>
                {item.fileSize && typeof item.fileSize === 'number' && (
                  <Text style={styles.fileSize}>
                    {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                  </Text>
                )}
              </View>
              <Download 
                size={20} 
                color={isCurrentUser ? '#FFFFFF' : '#9ca3af'} 
                onPress={() => downloadFile(item.fileUrl || '', item.fileName || 'file')}
              />
            </TouchableOpacity>
          )}

          {/* Message Text */}
          {item.text && (
            <Text style={[styles.messageText, isCurrentUser ? styles.currentUserText : styles.otherUserText]}>
              {item.text}
            </Text>
          )}
          
          {/* Timestamp */}
          <Text style={[styles.messageTime, isCurrentUser ? styles.currentUserTime : styles.otherUserTime]}>
            {formatTime(item.timestamp as Date)}
          </Text>
        </View>
      </View>
    );
  };

  // --- Loading State ---
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

  // --- Error State ---
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
      <View style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Image
              source={{ uri: otherUserProfile?.photoURL || PLACEHOLDER_IMAGE_URI }}
              style={styles.headerAvatar}
            />
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUserProfile?.basicInfo?.firstName || 'User'} {otherUserProfile?.basicInfo?.lastName || ''}
            </Text>
          </View>
        </View>

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
          onSwipeComplete={closeImageZoomViewer}
          swipeDirection="down"
          style={styles.zoomViewerModal}
          useNativeDriverForBackdrop
          animationIn="zoomIn"
          animationOut="zoomOut"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
            <ImageViewer
              imageUrls={zoomViewerImages}
              index={zoomViewerIndex}
              onCancel={closeImageZoomViewer}
              enableSwipeDown={true}
              renderIndicator={() => null}
              onChange={(index) => setZoomViewerIndex(index === undefined ? 0 : index)}
              
              // Disable the saveToLocalByLongPress option
              saveToLocalByLongPress={false}
              
              // Disable standard menus and controls
              menuContext={{ saveToLocal: 'none', cancel: 'none' }}
              
              // Add this to control how it responds to taps
              onClick={() => {/* Do nothing */}}
              
              // Keep custom header
              renderHeader={() => (
                <View style={styles.viewerHeader}>
                  <TouchableOpacity onPress={closeImageZoomViewer} style={styles.viewerButton}>
                    <X size={26} color="#FFFFFF" />
                  </TouchableOpacity>
                  <View style={styles.viewerActions}>
                    <TouchableOpacity onPress={handleSaveImage} style={styles.viewerButton}>
                      <Download size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleCopyImageLink} style={styles.viewerButton}>
                      <Copy size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

// --- Styles (Adjust as needed) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212', // Dark background
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
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-end', // Align avatar and bubble at the bottom
  },
  currentUserRow: {
    justifyContent: 'flex-end', // Push bubble to the right
  },
  otherUserRow: {
    justifyContent: 'flex-start', // Push bubble to the left
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 5, // Align with bottom of bubble
    backgroundColor: '#374151',
  },
  messageBubble: {
    maxWidth: '75%', // Limit bubble width
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 18,
  },
  currentUserBubble: {
    backgroundColor: '#0891b2', // Accent color for current user
    borderTopRightRadius: 5, // Flat corner for pointer effect
  },
  otherUserBubble: {
    backgroundColor: '#374151', // Darker gray for other user
    borderTopLeftRadius: 5, // Flat corner
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 5, // Space between image and text
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#e5e7eb',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right', // Align time to the right within the bubble
  },
  currentUserTime: {
    color: '#d1d5db', // Lighter gray for time
  },
  otherUserTime: {
    color: '#9ca3af', // Dimmer gray for time
  },
  // Input Area Styles
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333333',
    backgroundColor: '#1f2937', // Match header bg
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    minHeight: 40, // Ensure it's tappable
    maxHeight: 100, // Limit multiline growth
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#374151', // Input background
    borderRadius: 20,
    color: '#FFFFFF',
    fontSize: 16,
    marginHorizontal: 8,
  },
  sendButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#0891b2', // Accent color
    marginLeft: 5,
  },
  disabledSendButton: {
    backgroundColor: '#374151', // Use disabled color
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
  zoomViewerModal: {
    margin: 0,
    backgroundColor: 'black',
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
  viewerHeader: {
    position: 'absolute',
    top: 0, 
    left: 0,
    right: 0,
    zIndex: 1, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingTop: Platform.OS === 'ios' ? 10 : 15, 
    paddingBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)', 
  },
  viewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerButton: {
    padding: 8,
    marginLeft: 12, 
  },
}); 