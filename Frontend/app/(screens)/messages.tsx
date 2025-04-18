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
} from 'react-native';
import { router } from 'expo-router';
import { Search, X } from 'lucide-react-native';
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

const PLACEHOLDER_IMAGE_URI = 'https://via.placeholder.com/100/374151/e5e7eb?text=No+Pic';
const CONVERSATIONS_COLLECTION = 'conversations'; // Collection name for conversations
const MESSAGES_SUBCOLLECTION = 'messages'; // Subcollection for messages

export default function MessagesScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item.otherUserId)}
      >
        <Image
          source={{ uri: photoURL }}
          style={styles.avatar}
        />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{firstName} {lastName}</Text>
            {item.lastMessageTimestamp && (
              <Text style={styles.conversationTime}>{messageTime}</Text>
            )}
          </View>
          <View style={styles.conversationFooter}>
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
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#888888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <X size={18} color="#888888" />
          </TouchableOpacity>
        )}
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyText}>
            When you match with others and start chatting, your conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#9ca3af',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    marginTop: 5,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#FFFFFF',
    fontSize: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    backgroundColor: '#333', // Placeholder background
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  conversationTime: {
    fontSize: 14,
    color: '#888888',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: '#888888',
    flex: 1,
  },
  unreadMessage: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  unreadBadge: {
    backgroundColor: '#0891b2',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  unreadBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
  attachmentMessage: {
    color: '#9ca3af', // Slightly muted color for attachments
  },
});