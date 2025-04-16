import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, deleteDoc, arrayUnion, arrayRemove, collectionGroup, documentId, Timestamp,
  addDoc,
  orderBy,
  onSnapshot,
  limit,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './config'; // Import initialized Firestore instance
import { UserProfileData } from '../types/profile'; // Assuming you have this type defined
import { MessageData, ConversationData, ConversationWithProfiles } from '../types/chat'; // Assuming you define/will define this type
import { SearchFilters } from '../services/searchService';

const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';
const MATCHES_COLLECTION = 'matches';
const CONVERSATIONS_COLLECTION = 'conversations'; // New collection name
const MESSAGES_SUBCOLLECTION = 'messages'; // New subcollection name

// --- User Profile ---

/**
 * Creates or updates a user profile document in Firestore.
 * Uses merge: true to avoid overwriting existing data unexpectedly.
 */
export const setUserProfile = async (userId, profileData) => {
  if (!userId) throw new Error("User ID is required to set profile.");
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    const dataToSet = { ...profileData };
    // Ensure timestamps are handled correctly
    if (!dataToSet.createdAt) {
      // Only set createdAt if it doesn't exist (on initial creation)
      const currentDoc = await getDoc(userDocRef);
      if (!currentDoc.exists()) {
        dataToSet.createdAt = serverTimestamp();
      }
    }
    dataToSet.updatedAt = serverTimestamp(); // Always update this

    await setDoc(userDocRef, dataToSet, { merge: true });
    console.log("User profile set/updated successfully for ID:", userId);
  } catch (error) {
    console.error("Error setting user profile:", error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  if (!userId) return null;
  const userDocRef = doc(db, USERS_COLLECTION, userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      // Convert Timestamps to Dates if needed client-side
      const data = docSnap.data();
      // if (data.createdAt?.toDate) data.createdAt = data.createdAt.toDate();
      // if (data.updatedAt?.toDate) data.updatedAt = data.updatedAt.toDate();
      return { id: docSnap.id, ...data };
    } else {
      console.warn("No such user profile document for ID:", userId);
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};

// --- Swiping and Matching (Placeholders - Implementation can be complex) ---

/** Records a swipe action */
export const recordSwipe = async (swiperId, swipedUserId, liked) => {
  if (!swiperId || !swipedUserId) {
    console.error("recordSwipe: Missing swiperId or swipedUserId");
    return { error: "Missing user IDs" };
  }

  const swipeDocRef = doc(db, SWIPES_COLLECTION, swiperId, 'swipedUsers', swipedUserId);
  console.log(`recordSwipe: Recording swipe: ${swiperId} ${liked ? 'liked' : 'disliked'} ${swipedUserId}`);

  try {
    await setDoc(swipeDocRef, { liked, timestamp: serverTimestamp() });
    console.log(`recordSwipe: Swipe recorded successfully for ${swiperId} -> ${swipedUserId}`);

    // --- Check for Match ---
    if (liked) {
      console.log(`recordSwipe: Checking for match... Does ${swipedUserId} like ${swiperId}?`);
      const otherUserSwipeRef = doc(db, SWIPES_COLLECTION, swipedUserId, 'swipedUsers', swiperId);
      try {
        const otherUserSwipeSnap = await getDoc(otherUserSwipeRef);

        if (otherUserSwipeSnap.exists() && otherUserSwipeSnap.data().liked) {
          console.log(`recordSwipe: Mutual like detected! ${swipedUserId} also liked ${swiperId}.`);
          // Create match documents for both users
          await createMatch(swiperId, swipedUserId);
          console.log(`recordSwipe: createMatch called successfully for ${swiperId} and ${swipedUserId}`);
          return { matched: true }; // Indicate a match occurred
        } else {
          if (!otherUserSwipeSnap.exists()) {
            console.log(`recordSwipe: No match yet. ${swipedUserId} has not swiped on ${swiperId}.`);
          } else {
            console.log(`recordSwipe: No match yet. ${swipedUserId} swiped, but did not like ${swiperId}.`);
          }
        }
      } catch (matchCheckError) {
        console.error("recordSwipe: Error checking for match:", matchCheckError);
        // Log specific permission errors if possible
        if (matchCheckError.code === 'permission-denied') {
           console.error("recordSwipe: PERMISSION DENIED checking other user's swipe. Verify Firestore rules for reading /swipes/{otherUserId}/swipedUsers/{currentUserId}");
        }
        // Don't block the swipe recording if match check fails, but return no match
      }
    }
    return { matched: false }; // No match found or check failed
  } catch (error) {
    console.error(`recordSwipe: Error recording swipe for ${swiperId} -> ${swipedUserId}:`, error);
    if (error.code === 'permission-denied') {
      console.error("recordSwipe: PERMISSION DENIED recording swipe. Verify Firestore rules for writing to /swipes/{currentUserId}/swipedUsers/{otherUserId}");
    }
    return { error: error.message }; // Indicate an error occurred
  }
};

/** Creates match documents for both users */
const createMatch = async (userId1, userId2) => {
  const matchId = [userId1, userId2].sort().join('_'); // Consistent match ID
  console.log(`createMatch: Attempting to create match documents for ${userId1} and ${userId2} (Match ID: ${matchId})`);
  const matchDocRefUser1 = doc(db, MATCHES_COLLECTION, userId1, 'userMatches', userId2);
  const matchDocRefUser2 = doc(db, MATCHES_COLLECTION, userId2, 'userMatches', userId1);
  const timestamp = serverTimestamp();

  // Use a batch write for atomicity
  const batch = writeBatch(db);
  batch.set(matchDocRefUser1, { matchedAt: timestamp, otherUserId: userId2 });
  batch.set(matchDocRefUser2, { matchedAt: timestamp, otherUserId: userId1 });

  try {
    await batch.commit();
    console.log(`createMatch: Batch commit successful for match ${matchId}`);
    // Optional: Trigger notification or update UI state here if needed
  } catch (error) {
    console.error(`createMatch: Error committing batch for match ${matchId}:`, error);
     if (error.code === 'permission-denied') {
       console.error("createMatch: PERMISSION DENIED creating match documents. Verify Firestore rules allow writing to /matches/{userId}/userMatches/{otherUserId}");
     }
    // Re-throw the error so the calling function knows it failed
    throw error;
  }
};

// --- Messaging (Placeholders) ---
// Functions to add messages to a conversation subcollection,
// get messages for a conversation (likely using onSnapshot for real-time updates).

// --- Discovery/Filtering (Placeholders) ---
// Function to fetch users based on filters (gender, major, preferences etc.)
// This will likely involve complex Firestore queries.
export const discoverUsers = async (currentUserProfile, filters) => {
  // TODO: Implement querying based on filters and potentially excluding users already swiped/matched.
  // Example: Query users collection, apply 'where' clauses for filters.
  // const usersRef = collection(db, USERS_COLLECTION);
  // let q = query(usersRef, where('uid', '!=', currentUserProfile.uid)); // Exclude self
  // // Add filters... where('gender', '==', filters.gender), etc.
  // const querySnapshot = await getDocs(q);
  // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return []; // Placeholder
};

// --- Updated Function to fetch discoverable users (Simplified for Prioritization) ---
export const getDiscoverableUsers = async (
  currentUserId: string
  // Removed filters parameter - it's handled client-side now
): Promise<UserProfileData[]> => {
  if (!currentUserId) {
    console.error("Cannot fetch discoverable users without currentUserId");
    return [];
  }
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Base query: complete profiles, not the current user
    const q = query(
      usersRef,
      where('isProfileComplete', '==', true),
      where(documentId(), '!=', currentUserId) 
    );

    console.log("Fetching ALL discoverable users (prioritization done client-side)...");
    const querySnapshot = await getDocs(q);
    const users: UserProfileData[] = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() } as UserProfileData);
    });
    
    console.log(`Fetched ${users.length} total discoverable users.`);
    // Return the full list - sorting/prioritization happens in the frontend
    return users; 
  } catch (error) {
    console.error("Error fetching discoverable users:", error);
    return [];
  }
};

// --- NEW Function to get IDs of matched users ---
export const getMatchIds = async (currentUserId: string): Promise<string[]> => {
  if (!currentUserId) {
    console.error("Cannot fetch matches without currentUserId");
    return [];
  }
  try {
    const matchesSubcollectionRef = collection(db, MATCHES_COLLECTION, currentUserId, 'userMatches');
    const q = query(matchesSubcollectionRef); // You might add ordering later, e.g., orderBy('matchedAt', 'desc')

    console.log(`Fetching match IDs for user ${currentUserId}...`);
    const querySnapshot = await getDocs(q);
    const matchIds: string[] = [];
    querySnapshot.forEach((doc) => {
      // The document ID in this subcollection IS the other user's ID
      matchIds.push(doc.id);
    });
    console.log(`Found ${matchIds.length} match IDs.`);
    return matchIds;
  } catch (error) {
    console.error("Error fetching match IDs:", error);
    return [];
  }
};

// --- NEW Function to fetch full profiles for matched users ---
export const getMatchedUserProfiles = async (matchIds: string[]): Promise<UserProfileData[]> => {
  if (!matchIds || matchIds.length === 0) {
    console.log("getMatchedUserProfiles: No match IDs provided.");
    return []; // No IDs to fetch
  }
  console.log("getMatchedUserProfiles: Fetching profiles for IDs:", matchIds);
  try {
    const MAX_IDS_PER_QUERY = 10; // Firestore 'in' query limit
    const userProfiles: UserProfileData[] = [];
    const idChunks: string[][] = [];

    for (let i = 0; i < matchIds.length; i += MAX_IDS_PER_QUERY) {
       idChunks.push(matchIds.slice(i, i + MAX_IDS_PER_QUERY));
    }

    console.log(`getMatchedUserProfiles: Fetching profiles in ${idChunks.length} batches...`);

    for (const chunk of idChunks) {
      if (chunk.length > 0) {
        const usersRef = collection(db, USERS_COLLECTION);
        const q = query(usersRef, where(documentId(), 'in', chunk));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
           console.log(`getMatchedUserProfiles: Found profile for ID: ${doc.id}`);
          userProfiles.push({ id: doc.id, ...doc.data() } as UserProfileData);
        });
      }
    }

    console.log(`getMatchedUserProfiles: Successfully fetched ${userProfiles.length} profiles.`);
    return userProfiles;

  } catch (error) {
    console.error("getMatchedUserProfiles: Error fetching profiles:", error);
    return []; // Return empty array on error
  }
};

// --- NEW Chat Functions ---

/**
 * Generates a consistent conversation ID for two users.
 */
const generateConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Gets or creates a conversation document between two users.
 * Returns the conversation ID.
 */
export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<string> => {
  if (!userId1 || !userId2) {
    throw new Error("Both user IDs are required to get/create a conversation.");
  }
  const conversationId = generateConversationId(userId1, userId2);
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  console.log(`getOrCreateConversation: Checking/Creating conversation ID: ${conversationId} for users ${userId1} and ${userId2}`);

  try {
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.log(`getOrCreateConversation: No existing conversation found. Creating new one.`);
      await setDoc(conversationRef, {
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
        lastMessageTimestamp: null, // Initialize timestamp
        // You could add other initial metadata here
      });
      console.log(`getOrCreateConversation: New conversation document created.`);
    } else {
      console.log(`getOrCreateConversation: Existing conversation found.`);
    }
    return conversationId;
  } catch (error) {
    console.error(`getOrCreateConversation: Error getting/creating conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Adds a new message to a specific conversation's subcollection
 * and updates the parent conversation's last message timestamp and text.
 */
export const addMessage = async (conversationId: string, messageData: any) => {
  if (!conversationId || !messageData?.senderId) {
    throw new Error("Conversation ID and sender ID are required.");
  }
  
  // Validate that at least one field of content exists
  if (!messageData.text && !messageData.imageUrl && !messageData.fileUrl) {
    console.warn("addMessage: Attempting to add message with no content.");
    return; // Don't add an empty message
  }
  
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  const timestamp = serverTimestamp();

  console.log(`addMessage: Adding message to conversation ${conversationId} from sender ${messageData.senderId}`);

  try {
    // Use a batch write to add the message and update the parent doc atomically
    const batch = writeBatch(db);

    // 1. Add the new message document with all fields
    const newMessageRef = doc(collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION));
    batch.set(newMessageRef, {
      ...messageData,
      timestamp: timestamp,
    });

    // 2. Determine the preview text and message type for the conversation
    let previewText = '...'; // Default fallback
    let messageType = 'text'; // Default type
    let fileName = null;

    if (messageData.text) {
      previewText = messageData.text.substring(0, 50).replace(/\n/g, ' '); // Limit length and remove newlines
      messageType = 'text';
    } else if (messageData.imageUrl) {
      fileName = messageData.fileName || 'image.jpg';
      previewText = `📷 ${fileName}`; // Icon and filename
      messageType = 'image';
    } else if (messageData.fileUrl) {
      fileName = messageData.fileName || 'File';
      previewText = `📎 ${fileName}`; // Icon and filename
      messageType = 'file';
    }

    // If the message is from the sender, add "You: " before the icon
    if (messageType === 'image' || messageType === 'file') {
      if (messageData.senderId === getCurrentUser()?.uid) {
        previewText = `You: ${previewText}`;
      }
    } else if (messageData.senderId === getCurrentUser()?.uid) {
      previewText = `You: ${previewText}`;
    }

    // 3. Update the parent conversation document
    batch.update(conversationRef, {
      lastMessageTimestamp: timestamp,
      lastMessageText: previewText, // Use the determined preview text
      lastMessageSenderId: messageData.senderId,
    });
    console.log(`addMessage: Updating conversation ${conversationId} with lastMessageText: "${previewText}"`);

    await batch.commit();
    console.log(`addMessage: Message added successfully to ${conversationId} and conversation doc updated.`);
  } catch (error) {
    console.error(`addMessage: Error adding message to conversation ${conversationId}:`, error);
    throw error;
  }
};

/**
 * Sets up a real-time listener for messages in a conversation.
 * Calls the provided callback function with the messages array whenever updates occur.
 * Returns an unsubscribe function.
 */
export const getMessagesListener = (
  conversationId: string,
  callback: (messages: MessageData[]) => void,
  onError: (error: Error) => void
) => {
  if (!conversationId) {
    onError(new Error("Conversation ID is required for listener."));
    return () => {}; // Return an empty unsubscribe function
  }

  console.log(`getMessagesListener: Setting up listener for conversation ${conversationId}`);
  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
  const q = query(messagesRef, orderBy('timestamp', 'asc')); // Order messages chronologically

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const messages: MessageData[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Convert Firestore Timestamp to JS Date if necessary for display
      const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date();
      messages.push({
        id: doc.id,
        ...data,
        timestamp: timestamp, // Ensure it's a Date object
      } as MessageData); // Cast to your MessageData type
    });
    console.log(`getMessagesListener: Received ${messages.length} messages for ${conversationId}`);
    callback(messages); // Pass the array of messages to the callback
  }, (error) => {
    console.error(`getMessagesListener: Error listening to conversation ${conversationId}:`, error);
    onError(error); // Pass the error to the error callback
  });

  // Return the unsubscribe function for cleanup
  return unsubscribe;
};

/**
 * Gets all conversations where the current user is a participant.
 * Returns a real-time listener that updates when conversations change.
 */
export const getUserConversationsListener = (
  userId: string,
  callback: (conversations: ConversationWithProfiles[]) => void,
  onError: (error: Error) => void
) => {
  if (!userId) {
    onError(new Error("User ID is required to get conversations."));
    return () => {}; // Empty unsubscribe function
  }

  console.log(`getUserConversationsListener: Setting up listener for user ${userId}`);
  const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTimestamp', 'desc') // Most recent conversations first
  );

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    try {
      const conversations: ConversationWithProfiles[] = [];
      const profilePromises: Promise<any>[] = [];
      const conversationDocs: any[] = [];
      
      // First, collect all conversation documents and their participant IDs
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const conversationData: ConversationWithProfiles = {
          id: doc.id,
          participants: data.participants || [],
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          lastMessageTimestamp: data.lastMessageTimestamp instanceof Timestamp ? 
            data.lastMessageTimestamp.toDate() : 
            data.lastMessageTimestamp ? new Date(data.lastMessageTimestamp) : null,
          lastMessageText: data.lastMessageText || '',
          lastMessageSenderId: data.lastMessageSenderId || '',
          participantProfiles: {},
          unreadCount: 0 // Will be calculated later if needed
        };
        
        // Find the ID of the other participant (not the current user)
        const otherUserId = conversationData.participants.find(id => id !== userId);
        
        if (otherUserId) {
          // Add a promise to fetch this user's profile
          profilePromises.push(
            getUserProfile(otherUserId)
              .then(profile => ({
                userId: otherUserId,
                profile: profile
              }))
              .catch(() => ({
                userId: otherUserId,
                profile: null // Handle missing profiles
              }))
          );
          
          conversationDocs.push(conversationData);
        }
      });
      
      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises);
      
      // Match profiles with their conversations
      for (let i = 0; i < conversationDocs.length; i++) {
        const conversation = conversationDocs[i];
        
        // Add all participant profiles
        profileResults.forEach(({ userId, profile }) => {
          if (profile) {
            conversation.participantProfiles[userId] = profile;
            
            // If this is the other participant, also set otherParticipant for convenience
            if (userId !== userId) {
              conversation.otherParticipant = profile;
            }
          }
        });
        
        // Fetch the most recent message to display in the preview
        // This could be optimized by storing the last message text in the conversation document
        const lastMessagePromise = getLastMessage(conversation.id);
        conversations.push(conversation);
      }
      
      console.log(`getUserConversationsListener: Found ${conversations.length} conversations for user ${userId}`);
      callback(conversations);
      
    } catch (error) {
      console.error("getUserConversationsListener: Error processing conversations:", error);
      onError(error as Error);
    }
  }, (error) => {
    console.error(`getUserConversationsListener: Error in listener for ${userId}:`, error);
    onError(error);
  });
  
  return unsubscribe;
};

/**
 * Gets the most recent message in a conversation.
 */
export const getLastMessage = async (conversationId: string): Promise<MessageData | null> => {
  if (!conversationId) {
    console.error("getLastMessage: Conversation ID is required");
    return null;
  }
  
  try {
    const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
    const q = query(messagesRef, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`getLastMessage: No messages found in conversation ${conversationId}`);
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      senderId: data.senderId || '',
      text: data.text || '',
      timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date(data.timestamp || Date.now()),
      imageUrl: data.imageUrl
    };
  } catch (error) {
    console.error(`getLastMessage: Error fetching last message for ${conversationId}:`, error);
    return null;
  }
};

/**
 * Formats a timestamp for display in the conversation list.
 */
export const formatMessageTime = (timestamp: Date | null): string => {
  if (!timestamp) return '';
  
  const now = new Date();
  const messageDate = new Date(timestamp);
  
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

// --- Type Definition (Placeholder - Define this in src/types/chat.ts) ---
// You should create a file like `src/types/chat.ts` and define:
/*
import { Timestamp } from 'firebase/firestore';

export interface MessageData {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date | Timestamp; // Store as Timestamp, convert to Date for use
  imageUrl?: string; // Optional image URL
  // Add other fields like 'readBy', etc. if needed
}
*/
