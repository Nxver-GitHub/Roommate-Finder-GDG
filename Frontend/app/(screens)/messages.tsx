import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Animated,
  Pressable,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCurrentUser } from '../../src/firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { getUserProfile, areUsersMatched } from '../../src/firebase/firestore';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/utils/theme';

const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/100/374151/e5e7eb?text=No+Pic';
const CONVERSATIONS_COLLECTION = 'conversations'; // Collection name for conversations
const MESSAGES_SUBCOLLECTION = 'messages'; // Subcollection for messages

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [pressedCardId, setPressedCardId] = useState(null);

  // Format timestamp for message display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageDate = timestamp instanceof Date ? timestamp : timestamp.toDate();
    
    // Same day - show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Within past week - show day of week
    const daysAgo = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo < 7) {
      return messageDate.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older - show date
    return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  // Set up real-time listener for conversations
  useEffect(() => {
    setLoading(true);
    const user = getCurrentUser();
    setCurrentUser(user);
    
    if (!user?.uid) {
      setError("You need to be logged in to view messages.");
      setLoading(false);
      return;
    }

    console.log("Setting up conversations listener for user:", user.uid);
    
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      try {
        const conversationData = [];
        
        for (const doc of querySnapshot.docs) {
          const data = doc.data();
          
          // Find the ID of the other participant
          const otherUserId = data.participants.find(id => id !== user.uid);
          if (!otherUserId) continue;
          
          // Check if users are still matched
          const isMatched = await areUsersMatched(user.uid, otherUserId);
          if (!isMatched) {
            console.log(`Filtering out unmatched conversation with user ${otherUserId}`);
            continue;
          }
          
          // Get other user's profile
          const otherUserProfile = await getUserProfile(otherUserId);
          if (!otherUserProfile) continue;
          
          // Get the most recent message
          const messagesRef = collection(db, CONVERSATIONS_COLLECTION, doc.id, MESSAGES_SUBCOLLECTION);
          const messagesQuery = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
          const messagesSnapshot = await getDocs(messagesQuery);
          
          let lastMessageInfo = {
            text: null,
            timestamp: data.lastMessageTimestamp || null, // Use conversation timestamp as fallback
            senderId: data.lastMessageSenderId || null,
            type: 'text', // Default to text
            fileName: null,
          };

          if (!messagesSnapshot.empty) {
            const messageDoc = messagesSnapshot.docs[0];
            const messageData = messageDoc.data();
            
            lastMessageInfo.timestamp = messageData.timestamp || lastMessageInfo.timestamp;
            lastMessageInfo.senderId = messageData.senderId || lastMessageInfo.senderId;
            
            if (messageData.imageUrl) {
              lastMessageInfo.type = 'image';
              lastMessageInfo.text = 'Photo'; // Placeholder text for image
            } else if (messageData.fileUrl) {
              lastMessageInfo.type = 'file';
              lastMessageInfo.fileName = messageData.fileName || 'File';
              lastMessageInfo.text = lastMessageInfo.fileName; // Use filename as text preview
            } else {
              lastMessageInfo.type = 'text';
              lastMessageInfo.text = messageData.text || '';
            }
          }
          
          // Format the message preview
          let previewText = 'No messages yet';
          const isLastMessageFromCurrentUser = lastMessageInfo.senderId === user.uid;

          if (lastMessageInfo.timestamp) {
            if (lastMessageInfo.type === 'image') {
              const imageName = lastMessageInfo.fileName || 'image.jpg';
              previewText = `📷 ${imageName}`;
            } else if (lastMessageInfo.type === 'file') {
              const fileName = lastMessageInfo.fileName || 'File';
              previewText = `📎 ${fileName}`;
            } else if (lastMessageInfo.text) {
              previewText = lastMessageInfo.text.length > 40 
                ? lastMessageInfo.text.substring(0, 37) + '...' 
                : lastMessageInfo.text;
            } else {
              previewText = 'New message received';
            }

            if (isLastMessageFromCurrentUser) {
              if (lastMessageInfo.type === 'image' || lastMessageInfo.type === 'file') {
                previewText = `You: ${previewText}`;
              } else {
                previewText = `You: ${previewText}`;
              }
            }
          }
          
          // Create a conversation item with all relevant data
          conversationData.push({
            id: doc.id,
            participants: data.participants,
            otherUserId: otherUserId,
            otherUserProfile: otherUserProfile,
            lastMessageText: lastMessageInfo.text,
            lastMessageTimestamp: lastMessageInfo.timestamp,
            lastMessageSenderId: lastMessageInfo.senderId,
            lastMessageType: lastMessageInfo.type,
            lastMessageFileName: lastMessageInfo.fileName,
            // We'll implement unread count later
            unreadCount: 0,
            isMatched: true
          });
        }
        
        // Sort conversations by the most recent message timestamp after fetching all data
        conversationData.sort((a, b) => {
          const timeA = a.lastMessageTimestamp?.toDate ? a.lastMessageTimestamp.toDate().getTime() : 0;
          const timeB = b.lastMessageTimestamp?.toDate ? b.lastMessageTimestamp.toDate().getTime() : 0;
          return timeB - timeA; // Descending order
        });
        
        setConversations(conversationData);
        setLoading(false);
      } catch (error) {
        console.error("Error processing conversations:", error);
        setError("Failed to load conversations");
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conv => {
    const name = `${conv.otherUserProfile?.basicInfo?.firstName || ''} ${conv.otherUserProfile?.basicInfo?.lastName || ''}`.trim();
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Navigate to conversation
  const handleConversationPress = async (otherUserId: string) => {
    if (!currentUser?.uid) {
      Alert.alert("Error", "You need to be logged in to view messages.");
      return;
    }

    try {
      const isMatched = await areUsersMatched(currentUser.uid, otherUserId);
      if (!isMatched) {
        Alert.alert("Cannot Access Conversation", "You can only message users you've matched with.");
        return;
      }
      router.push(`/conversation/${otherUserId}`);
    } catch (error) {
      console.error("Error checking match status:", error);
      Alert.alert("Error", "Failed to access conversation. Please try again.");
    }
  };

  // Add this animation setup
  const scaleAnimation = new Animated.Value(1);

  const handlePressIn = (cardId) => {
    setPressedCardId(cardId);
    Animated.spring(scaleAnimation, {
      toValue: 1.05,
      friction: 7,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setPressedCardId(null);
    Animated.spring(scaleAnimation, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  // Render a single conversation item
  const renderConversationItem = ({ item }) => {
    if (!currentUser?.uid) return null;
    
    const otherUserProfile = item.otherUserProfile;
    if (!otherUserProfile) return null; // Should have profile if item exists

    const firstName = otherUserProfile?.basicInfo?.firstName || 'User';
    const lastName = otherUserProfile?.basicInfo?.lastName || '';
    const photoURL = otherUserProfile?.photoURL || PLACEHOLDER_IMAGE_URI;
    
    // --- Format the preview text ---
    let previewText = 'No messages yet'; // Default
    const isLastMessageFromCurrentUser = item.lastMessageSenderId === currentUser.uid;

    if (item.lastMessageTimestamp) { // Check if there's any message info
      if (item.lastMessageType === 'image') {
        // Format: "(You: )📷 filename.jpg"
        const imageName = item.lastMessageFileName || 'image.jpg';
        previewText = `📷 ${imageName}`;
      } else if (item.lastMessageType === 'file') {
        // Format: "(You: )📎 filename"
        const fileName = item.lastMessageFileName || 'File';
        previewText = `📎 ${fileName}`;
      } else if (item.lastMessageText) {
        // Truncate long text messages
        previewText = item.lastMessageText.length > 40 
          ? item.lastMessageText.substring(0, 37) + '...' 
          : item.lastMessageText;
      } else {
        previewText = 'New message received'; // Fallback if text is missing but timestamp exists
      }

      // Add "You:" prefix BEFORE the icon for files and images
      if (isLastMessageFromCurrentUser) {
        if (item.lastMessageType === 'image' || item.lastMessageType === 'file') {
          // For files and images, insert "You: " before the icon
          previewText = `You: ${previewText}`;
        } else {
          // For text messages, keep the existing format
          previewText = `You: ${previewText}`;
        }
      }
    }
    // --- End formatting preview text ---
    
    const messageTime = formatMessageTime(item.lastMessageTimestamp);
    
    return (
      <Animated.View 
        style={[
          styles.conversationContainer,
          {
            transform: [{ scale: pressedCardId === item.id ? scaleAnimation : 1 }],
            zIndex: pressedCardId === item.id ? 1 : 0,
          }
        ]}
      >
        <LinearGradient
          colors={
            pressedCardId === item.id 
              ? [COLORS.secondary, '#E5B93C'] // Yellow gradient when pressed
              : ['rgba(67, 113, 203, 0.8)', 'rgba(67, 113, 203, 0.4)'] // Default blue gradient
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.conversationGlow,
            pressedCardId === item.id && styles.conversationGlowPressed
          ]}
        >
          <View style={[
            styles.conversationGradient,
            pressedCardId === item.id && styles.conversationGradientPressed
          ]}>
            <Pressable
              style={styles.conversationItem}
              onPress={() => handleConversationPress(item.otherUserId)}
              onPressIn={() => handlePressIn(item.id)}
              onPressOut={handlePressOut}
              delayLongPress={50}
              android_ripple={{ color: 'transparent' }}
            >
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: photoURL }}
                  style={styles.avatar}
                />
              </View>
              
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <Text style={styles.conversationName}>{firstName} {lastName}</Text>
                </View>
                <View style={styles.messagePreviewContainer}>
                  <Text
                    style={[
                      styles.lastMessage,
                      item.unreadCount > 0 && styles.unreadMessage,
                      (item.lastMessageType === 'image' || item.lastMessageType === 'file') && styles.attachmentMessage
                    ]}
                    numberOfLines={1}
                  >
                    {previewText}
                  </Text>
                </View>
              </View>

              <View style={styles.rightContent}>
                {item.lastMessageTimestamp && (
                  <Text style={styles.conversationTime}>{messageTime}</Text>
                )}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
                <View style={styles.arrowContainer}>
                  <Ionicons name="chevron-forward" size={20} color={COLORS.text.secondary} />
                </View>
              </View>
            </Pressable>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Loading state
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
          <Text style={styles.loadingText}>Loading Conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
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
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(screens)/')}
              style={styles.errorButton}
            >
              <LinearGradient
                colors={[COLORS.primary, '#3667C2']}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>Back to Discover</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

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
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>
      
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          placeholderTextColor={COLORS.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={COLORS.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.6)', 'rgba(31, 41, 55, 0.7)']}
            style={styles.emptyContainer}
          >
            <Ionicons name="chatbubbles-outline" size={50} color={COLORS.text.secondary} />
            <Text style={styles.emptyText}>No messages yet</Text>
            <Text style={styles.emptySubText}>When you match with others and start chatting, your conversations will appear here.</Text>
            <TouchableOpacity 
              onPress={() => router.push('/(screens)/')}
              style={styles.emptyButton}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.secondary, '#E5B93C']}
                style={styles.emptyButtonGradient}
              >
                <Text style={styles.emptyButtonText}>Discover Roommates</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <FlatList
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
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
    width: 90,
    height: 48,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: 60,
    paddingBottom: SPACING.md,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.15)',
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    paddingVertical: SPACING.xs,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  listContent: {
    paddingBottom: SPACING.xl,
  },
  conversationContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'visible',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  conversationGlow: {
    padding: 2,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  conversationGlowPressed: {
    padding: 2.5, // Slightly thicker border when pressed
    shadowColor: COLORS.secondary,
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  conversationGradient: {
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.2)',
  },
  conversationGradientPressed: {
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    borderColor: COLORS.secondary,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: SPACING.md,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background.elevated,
    borderWidth: 2,
    borderColor: COLORS.secondary,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    marginBottom: 4,
  },
  conversationName: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.text.primary,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    flex: 1,
  },
  rightContent: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingLeft: SPACING.sm,
  },
  conversationTime: {
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.text.secondary,
    marginBottom: 4,
  },
  unreadMessage: {
    color: COLORS.text.primary,
    fontWeight: '500',
  },
  attachmentMessage: {
    color: COLORS.text.secondary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  unreadBadgeText: {
    color: COLORS.background.default,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: 'bold',
  },
  arrowContainer: {
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
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
  loadingText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    width: '90%',
    padding: SPACING.xl,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.15)',
    ...SHADOWS.md,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
    fontWeight: '600',
  },
  emptySubText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  emptyButton: {
    width: '100%',
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  emptyButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  emptyButtonText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
  },
});