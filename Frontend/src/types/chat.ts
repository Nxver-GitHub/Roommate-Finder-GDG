import { Timestamp } from 'firebase/firestore';

/**
 * Represents the structure of a chat message document in Firestore.
 */
export interface MessageData {
  id: string;                 // Unique ID of the message document
  senderId: string;           // User ID of the person who sent the message
  text: string;               // The actual text content of the message
  timestamp: Date | Timestamp; // Timestamp when the message was sent (store as Firestore Timestamp, use as JS Date)
  imageUrl?: string;          // Optional: URL if the message contains an image
  // Add other fields like 'readBy' (e.g., string[]) if needed for read receipts later
}

/**
 * Represents a conversation between two users
 */
export interface ConversationData {
  id: string;                          // Conversation ID (usually generated from participant IDs)
  participants: string[];              // Array of user IDs participating in the conversation
  createdAt: Date | Timestamp;         // When the conversation was created
  lastMessageTimestamp: Date | Timestamp | null; // Timestamp of the most recent message
  lastMessageText?: string;            // Preview of the most recent message (optional)
  lastMessageSenderId?: string;        // ID of the user who sent the last message
  unreadCount?: number;                // Number of unread messages (calculated field)
}

/**
 * Represents a conversation with full participant profile data
 */
export interface ConversationWithProfiles extends ConversationData {
  participantProfiles: {
    [userId: string]: any;    // User profile data for each participant
  };
  otherParticipant?: any;     // The profile of the user who is not the current user
}

// You could also define a ConversationData type here if needed elsewhere
/*
export interface ConversationData {
  id: string;
  participants: string[];
  createdAt: Date | Timestamp;
  lastMessageTimestamp: Date | Timestamp | null;
  lastMessageText?: string; // Optional snippet
}
*/

interface MessagePreview {
  id: string;
  senderId: string;
  messagePreview: string | null;
  messageType: 'text' | 'image' | 'file';
  fileName?: string;
  lastMessageTimestamp: Timestamp;
  unreadCount: number;
} 