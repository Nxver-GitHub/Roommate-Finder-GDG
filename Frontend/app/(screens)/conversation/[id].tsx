import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon } from 'lucide-react-native';
import {
  getConversationById,
  formatMessageTime,
  currentUser,
  Message,
} from '../../../src/services/mockMessages';
import { getUserById } from '../../../src/services/mockUsers';
import { getMessagesForConversation, addMessageToConversation } from '../../../src/services/mockMessages';

// Create dateUtils functions directly in the file instead of importing
const formatTime = (date) => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
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
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const conversationId = id as string;
  const [conversation, setConversation] = useState(
    getConversationById(conversationId)
  );
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const otherParticipant = conversation?.participants.find(
    (p) => p.id !== currentUser.id
  );

  useEffect(() => {
    // Scroll to bottom on initial load
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 200);
  }, []);

  useEffect(() => {
    // Load messages and user data
    if (id) {
      const msgs = getConversationById(conversationId)?.messages || [];
      setConversation({
        ...conversation,
        messages: msgs,
      });
      
      // Find the other user in the conversation (not the current user)
      if (msgs.length > 0) {
        const otherUserId = msgs[0].senderId === 'currentUser' ? msgs[0].receiverId : msgs[0].senderId;
        const otherUser = conversation?.participants.find(p => p.id === otherUserId);
        if (otherUser) {
          setConversation({
            ...conversation,
            otherUser: otherUser,
          });
        }
      }
    }
  }, [id]);

  const handleBack = () => {
    router.back();
  };

  const handleSend = () => {
    if (!messageText.trim() || !conversation) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      text: messageText.trim(),
      timestamp: new Date(),
      read: true,
    };

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, newMessage],
      lastMessageTime: newMessage.timestamp,
    };

    setConversation(updatedConversation);
    setMessageText('');

    // Scroll to the new message
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.senderId === currentUser.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer,
        ]}
      >
        {!isCurrentUser && (
          <Image
            source={{ uri: otherParticipant?.image }}
            style={styles.messageAvatar}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
          ]}
        >
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.currentUserText : styles.otherUserText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isCurrentUser ? styles.currentUserTime : styles.otherUserTime,
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  if (!conversation || !otherParticipant) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Conversation not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <SimpleAvatar uri={otherParticipant.image} size={36} />
          <Text style={styles.headerName}>{otherParticipant.name}</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={conversation.messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <ImageIcon size={24} color="#888888" />
          </TouchableOpacity>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor="#666666"
            value={messageText}
            onChangeText={setMessageText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !messageText.trim() && styles.disabledSendButton,
            ]}
            onPress={handleSend}
            disabled={!messageText.trim()}
          >
            <Send
              size={20}
              color={messageText.trim() ? '#000000' : '#666666'}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  headerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  messagesList: {
    padding: 10,
    paddingBottom: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    maxWidth: '80%',
  },
  currentUserContainer: {
    alignSelf: 'flex-end',
  },
  otherUserContainer: {
    alignSelf: 'flex-start',
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 5,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '100%',
  },
  currentUserBubble: {
    backgroundColor: '#FFD700',
  },
  otherUserBubble: {
    backgroundColor: '#333',
  },
  messageText: {
    fontSize: 16,
  },
  currentUserText: {
    color: '#000000',
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
    color: '#666',
  },
  otherUserTime: {
    color: '#888888',
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  attachButton: {
    padding: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginHorizontal: 8,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendButton: {
    backgroundColor: '#333',
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 20,
  },
}); 