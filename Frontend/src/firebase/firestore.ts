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
import { getCurrentUser } from './auth'; // Import getCurrentUser function

const USERS_COLLECTION = 'users';
const SWIPES_COLLECTION = 'swipes';
const MATCHES_COLLECTION = 'matches';
const CONVERSATIONS_COLLECTION = 'conversations'; // New collection name
const MESSAGES_SUBCOLLECTION = 'messages'; // New subcollection name
const COMPATIBILITY_SCORES_COLLECTION = 'compatibilityScores';

// Add these types for compatibility scores
export interface CompatibilityScore {
  userId1: string;
  userId2: string;
  score: number;
  matchFactors: {
    budgetMatch: number;
    genderMatch: number;
    roomTypeMatch: number;
    lifestyleMatch: number;
    locationMatch: number;
  };
  lastUpdated: Date | Timestamp;
}

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
    
    // Add this: Update compatibility scores whenever profile is updated
    if (dataToSet.isProfileComplete) {
      console.log("Updating compatibility scores after profile change");
      updateUserCompatibilityScores(userId)
        .then(success => {
          if (success) {
            console.log("Successfully updated compatibility scores for user:", userId);
          }
        })
        .catch(error => {
          console.error("Failed to update compatibility scores:", error);
        });
    }
    
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
          try {
            await createMatch(swiperId, swipedUserId);
            console.log(`recordSwipe: createMatch called successfully for ${swiperId} and ${swipedUserId}`);
            
            // Get the matched user's profile to return
            const matchedUserProfile = await getUserProfile(swipedUserId);
            
            return { 
              matched: true,
              matchedUserId: swipedUserId,
              matchedUserProfile
            }; // Indicate a match occurred and return the user's profile
          } catch (matchCreationError) {
            console.error("recordSwipe: Error creating match:", matchCreationError);
            return { matched: false, error: "Failed to create match" };
          }
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

/** Creates match documents for both users involved in a mutual match */
const createMatch = async (initiatingUserId: string, matchedUserId: string): Promise<boolean> => {
  console.log(`createMatch: Attempting to create match document for initiator ${initiatingUserId} -> matched ${matchedUserId}`);

  const timestamp = serverTimestamp();

  try {
    // 1. Check if match already exists (both ways)
    const match1DocRef = doc(db, MATCHES_COLLECTION, initiatingUserId, 'userMatches', matchedUserId);
    const match2DocRef = doc(db, MATCHES_COLLECTION, matchedUserId, 'userMatches', initiatingUserId);

    const [match1Snap, match2Snap] = await Promise.all([
      getDoc(match1DocRef),
      getDoc(match2DocRef)
    ]);

    const match1Exists = match1Snap.exists();
    const match2Exists = match2Snap.exists();

    // If both already exist, nothing to do
    if (match1Exists && match2Exists) {
      console.log(`createMatch: Match already exists for both users. Skipping creation.`);
      return true;
    }

    // Prepare batch operations
    const batch = writeBatch(db);

    // Only add set operation for initiating user if document doesn't exist
    if (!match1Exists) {
      batch.set(match1DocRef, { matchedAt: timestamp, otherUserId: matchedUserId });
      console.log(`createMatch: Adding set operation for ${initiatingUserId} -> ${matchedUserId}`);
    }

    // Only add set operation for matched user if document doesn't exist
    if (!match2Exists) {
      batch.set(match2DocRef, { matchedAt: timestamp, otherUserId: initiatingUserId });
      console.log(`createMatch: Adding set operation for ${matchedUserId} -> ${initiatingUserId}`);
    }

    // Commit batch only if there are operations to perform
    if (!match1Exists || !match2Exists) {
      await batch.commit();
      console.log(`createMatch: Successfully created/updated match documents using batch.`);
    }
    return true;

  } catch (batchError) {
    console.error(`createMatch: Batch operation failed:`, batchError);
    // Consider if fallback is needed or if failure should stop the process
    // For now, return false if batch fails
    return false;
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
): Promise<UserProfileData[]> => {
  if (!currentUserId) {
    console.error("Cannot fetch discoverable users without currentUserId");
    return [];
  }
  try {
    // First, get all match IDs for current user
    const matchIds = await getMatchIds(currentUserId);
    console.log(`Excluding ${matchIds.length} matched users from discoverable users`);
    
    const usersRef = collection(db, USERS_COLLECTION);
    
    // Base query: complete profiles, not the current user
    let q = query(
      usersRef,
      where('isProfileComplete', '==', true),
      where(documentId(), '!=', currentUserId) 
    );
    
    const querySnapshot = await getDocs(q);
    const users: UserProfileData[] = [];
    
    // Filter out matched users manually
    querySnapshot.forEach((doc) => {
      // Only include users that are not in the matchIds array
      if (!matchIds.includes(doc.id)) {
        users.push({ id: doc.id, ...doc.data() } as UserProfileData);
      }
    });
    
    console.log(`Fetched ${users.length} total discoverable users after excluding ${matchIds.length} matches.`);
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

// Update the areUsersMatched function to check BOTH users' match documents
export const areUsersMatched = async (userId1: string, userId2: string): Promise<boolean> => {
  if (!userId1 || !userId2) {
    console.error("areUsersMatched: Missing user IDs");
    return false;
  }
  try {
    // Check if user1 has user2 as a match
    const match1DocRef = doc(db, MATCHES_COLLECTION, userId1, 'userMatches', userId2);
    // Check if user2 has user1 as a match
    const match2DocRef = doc(db, MATCHES_COLLECTION, userId2, 'userMatches', userId1);

    // Get both documents concurrently
    const [match1Snap, match2Snap] = await Promise.all([
      getDoc(match1DocRef),
      getDoc(match2DocRef)
    ]);

    // Only return true if BOTH documents exist (mutual match)
    const bothExist = match1Snap.exists() && match2Snap.exists();
    if (bothExist) {
      // Optional: Log if match is found
      // console.log(`areUsersMatched: Mutual match confirmed between ${userId1} and ${userId2}`);
    } else if (match1Snap.exists() || match2Snap.exists()) {
      // Optional: Log if match is one-sided (should be cleaned up)
      // console.log(`areUsersMatched: One-sided match detected between ${userId1} and ${userId2}.`);
    }
    return bothExist;
  } catch (error) {
    console.error(`areUsersMatched: Error checking match status between ${userId1} and ${userId2}:`, error);
    return false;
  }
};

// Modify getOrCreateConversation to strictly check match status
export const getOrCreateConversation = async (userId1: string, userId2: string): Promise<string> => {
  if (!userId1 || !userId2) {
    throw new Error("Both user IDs are required");
  }
  
  // First check if users are matched
  const areMatched = await areUsersMatched(userId1, userId2);
  if (!areMatched) {
    throw new Error("Users must be matched to have a conversation");
  }
  
  const conversationId = generateConversationId(userId1, userId2);
  
  try {
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);
    
    if (!conversationSnap.exists()) {
      await setDoc(conversationRef, {
        id: conversationId,
        participants: [userId1, userId2],
        createdAt: serverTimestamp(),
        lastMessageTimestamp: null
      });
      console.log(`Created new conversation: ${conversationId}`);
    }
    
    return conversationId;
  } catch (error) {
    console.error(`Error in getOrCreateConversation:`, error);
    throw error;
  }
};

// Modify addMessage to be more robust and update parent conversation
export const addMessage = async (conversationId: string, messageData: Partial<MessageData>): Promise<string | null> => {
  if (!conversationId || !messageData.senderId || (!messageData.text?.trim() && !messageData.imageUrl)) {
    console.error("addMessage: Missing required data:", { conversationId, messageData });
    throw new Error("Missing required data for adding message");
  }

  console.log(`addMessage: Attempting to add message to conversation ${conversationId}`);

  try {
    // Get conversation data to check participants and match status
    const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (!conversationSnap.exists()) {
      console.error(`addMessage: Conversation ${conversationId} does not exist.`);
      throw new Error("Conversation does not exist");
    }

    const conversationData = conversationSnap.data() as ConversationData;
    const otherUserId = conversationData.participants.find(id => id !== messageData.senderId);

    if (!otherUserId) {
      console.error(`addMessage: Could not determine other participant in conversation ${conversationId}`);
      throw new Error("Could not determine other participant");
    }

    // Check if users are still matched before sending
    const areMatched = await areUsersMatched(messageData.senderId, otherUserId);
    if (!areMatched) {
      console.warn(`addMessage: Cannot send message, users ${messageData.senderId} and ${otherUserId} are not matched.`);
      throw new Error("Cannot send messages when users are not matched");
    }

    // Prepare the message document data
    const finalMessageData = {
      ...messageData,
      timestamp: Timestamp.now(), // Use client-side Timestamp for immediate consistency
      text: messageData.text?.trim() ?? '', // Ensure text is trimmed or empty string
    };

    // Use a batch write to add the message AND update the conversation atomically
    const batch = writeBatch(db);

    // 1. Add the new message document to the subcollection
    const newMessageRef = doc(collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION));
    batch.set(newMessageRef, finalMessageData);
    console.log(`addMessage: Added set operation for new message ${newMessageRef.id}`);

    // 2. Update the parent conversation document
    batch.update(conversationRef, {
      lastMessageTimestamp: finalMessageData.timestamp, // Use the same client timestamp
      lastMessageText: finalMessageData.text || (finalMessageData.imageUrl ? 'Image' : ''), // Set preview text
      lastMessageSenderId: finalMessageData.senderId,
      // Optionally add unread counts here if needed
    });
    console.log(`addMessage: Added update operation for conversation ${conversationId}`);

    // Commit the batch
    await batch.commit();
    console.log(`addMessage: Batch committed successfully for message ${newMessageRef.id}`);

    return newMessageRef.id; // Return the ID of the newly added message

  } catch (error) {
    console.error(`addMessage: Error adding message to conversation ${conversationId}:`, error);
    // Re-throw the error so the calling function can handle it (e.g., show an alert)
    throw error;
  }
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
    orderBy('lastMessageTimestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q, async (querySnapshot) => {
    // Check if user is still authenticated - ADDED
    if (!getCurrentUser()?.uid) {
      console.log("User no longer authenticated, stopping conversations listener");
      callback([]);
      return;
    }
    
    try {
      const conversations: ConversationWithProfiles[] = [];
      const profilePromises: Promise<any>[] = [];
      const conversationDocs: any[] = [];
      
      // First, collect all conversation documents and their participant IDs
      for (const doc of querySnapshot.docs) {
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
          unreadCount: 0
        };
        
        // Find the ID of the other participant
        const otherUserId = conversationData.participants.find(id => id !== userId);
        
        if (otherUserId) {
          // Check if user is still authenticated - ADDED
          if (!getCurrentUser()?.uid) {
            console.log("User no longer authenticated, stopping profile fetch");
            return;
          }
          
          // Check if users are still matched
          try {
            const isMatched = await areUsersMatched(userId, otherUserId);
            if (isMatched) {
              // Only add matched conversations
              profilePromises.push(
                getUserProfile(otherUserId)
                  .then(profile => ({
                    userId: otherUserId,
                    profile: profile
                  }))
                  .catch(() => ({
                    userId: otherUserId,
                    profile: null
                  }))
              );
              conversationDocs.push(conversationData);
            } else {
              console.log(`Filtering out unmatched conversation with user ${otherUserId}`);
            }
          } catch (error) {
            console.error(`Error checking match status for ${otherUserId}:`, error);
          }
        }
      }
      
      // Check again if user is still authenticated before waiting for profiles - ADDED
      if (!getCurrentUser()?.uid) {
        console.log("User no longer authenticated, stopping profile fetch");
        callback([]);
        return;
      }
      
      // Wait for all profile fetches to complete
      const profileResults = await Promise.all(profilePromises);
      
      // Match profiles with their conversations
      for (let i = 0; i < conversationDocs.length; i++) {
        const conversation = conversationDocs[i];
        
        // Add all participant profiles
        profileResults.forEach(({ userId: profileUserId, profile }) => {
          if (profile) {
            conversation.participantProfiles[profileUserId] = profile;
            
            // If this is the other participant, also set otherParticipant for convenience
            if (profileUserId !== userId) {
              conversation.otherParticipant = profile;
            }
          }
        });
        
        conversations.push(conversation);
      }
      
      console.log(`getUserConversationsListener: Found ${conversations.length} matched conversations for user ${userId}`);
      callback(conversations);
      
    } catch (error) {
      console.error("getUserConversationsListener: Error processing conversations:", error);
      onError(error as Error);
    }
  }, (error) => {
    console.error(`Error in conversations listener:`, error);
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

/**
 * Calculates compatibility score between two users based on their profiles
 */
export const calculateCompatibilityScore = async (
  user1Id: string,
  user2Id: string
): Promise<CompatibilityScore | null> => {
  try {
    // Get both user profiles
    const user1Profile = await getUserProfile(user1Id);
    const user2Profile = await getUserProfile(user2Id);
    
    if (!user1Profile || !user2Profile) {
      console.error("Cannot calculate score: One or both user profiles not found");
      return null;
    }
    
    // Calculate individual factor scores (0-100 scale)
    
    // 1. Budget match (100 if budget ranges overlap, 0 if not)
    const budgetMatch = 
      (user1Profile.preferences?.budget?.min <= user2Profile.preferences?.budget?.max && 
       user1Profile.preferences?.budget?.max >= user2Profile.preferences?.budget?.min) ? 100 : 0;
    
    // 2. Gender match (100 if preferences align, 0 if not)
    const genderMatch = 100; // Placeholder - you'll need to adjust based on your gender preference fields
    
    // 3. Room type match (100 if types align, 0 if they conflict)
    const roomTypeMatch = 
      (user1Profile.preferences?.roomType === user2Profile.preferences?.roomType ||
       user1Profile.preferences?.roomType === 'either' || 
       user2Profile.preferences?.roomType === 'either') ? 100 : 0;
    
    // 4. Lifestyle match (average of lifestyle factors on 0-100 scale)
    const lifestyleFactors = [
      // Cleanliness (100 if same level, scale down by 20 for each level difference)
      100 - (Math.abs(user1Profile.lifestyle?.cleanliness - user2Profile.lifestyle?.cleanliness) * 20),
      // Smoking (100 if same preference, 0 if different)
      user1Profile.lifestyle?.smoking === user2Profile.lifestyle?.smoking ? 100 : 0,
      // Pets (100 if same preference, 0 if different)
      user1Profile.lifestyle?.pets === user2Profile.lifestyle?.pets ? 100 : 0
    ];
    
    const lifestyleMatch = lifestyleFactors.reduce((sum, factor) => sum + factor, 0) / lifestyleFactors.length;
    
    // 5. Location match (100 if same location string, 0 if different)
    const locationMatch = 
      user1Profile.preferences?.location === user2Profile.preferences?.location ? 100 : 0;
    
    // Calculate overall weighted score (0-100)
    const weights = {
      budget: 0.3,
      gender: 0.15,
      roomType: 0.2,
      lifestyle: 0.25,
      location: 0.1
    };
    
    const overallScore = 
      (budgetMatch * weights.budget) +
      (genderMatch * weights.gender) +
      (roomTypeMatch * weights.roomType) +
      (lifestyleMatch * weights.lifestyle) +
      (locationMatch * weights.location);
    
    // Create score object
    const compatibilityScore: CompatibilityScore = {
      userId1: user1Id,
      userId2: user2Id,
      score: overallScore,
      matchFactors: {
        budgetMatch,
        genderMatch,
        roomTypeMatch,
        lifestyleMatch,
        locationMatch
      },
      lastUpdated: serverTimestamp()
    };
    
    return compatibilityScore;
  } catch (error) {
    console.error("Error calculating compatibility score:", error);
    return null;
  }
};

/**
 * Saves a compatibility score to Firestore
 */
export const saveCompatibilityScore = async (score: CompatibilityScore): Promise<boolean> => {
  try {
    // Create a consistent document ID based on user IDs (alphabetically sorted)
    const userIds = [score.userId1, score.userId2].sort();
    const scoreDocId = userIds.join('_');
    
    // Save to Firestore
    const scoreDocRef = doc(db, COMPATIBILITY_SCORES_COLLECTION, scoreDocId);
    await setDoc(scoreDocRef, score);
    
    console.log(`Saved compatibility score (${score.score.toFixed(1)}) between ${score.userId1} and ${score.userId2}`);
    return true;
  } catch (error) {
    console.error("Error saving compatibility score:", error);
    return false;
  }
};

/**
 * Get the compatibility score between two users
 */
export const getCompatibilityScore = async (
  userId1: string, 
  userId2: string
): Promise<CompatibilityScore | null> => {
  try {
    // Create consistent document ID
    const userIds = [userId1, userId2].sort();
    const scoreDocId = userIds.join('_');
    
    // Get from Firestore
    const scoreDocRef = doc(db, COMPATIBILITY_SCORES_COLLECTION, scoreDocId);
    const scoreDoc = await getDoc(scoreDocRef);
    
    if (scoreDoc.exists()) {
      return { ...scoreDoc.data() } as CompatibilityScore;
    } else {
      // If score doesn't exist yet, calculate it, save it, and return it
      const newScore = await calculateCompatibilityScore(userId1, userId2);
      if (newScore) {
        await saveCompatibilityScore(newScore);
        return newScore;
      }
      return null;
    }
  } catch (error) {
    console.error("Error getting compatibility score:", error);
    return null;
  }
};

/**
 * Get all discoverable users sorted by compatibility score
 */
export const getDiscoverableUsersWithScores = async (
  currentUserId: string,
  filters: SearchFilters
): Promise<UserProfileData[]> => {
  if (!currentUserId) {
    console.error("Cannot fetch discoverable users without currentUserId");
    return [];
  }
  
  console.log("Getting discoverable users with scores for filters:", JSON.stringify(filters, null, 2));
  
  try {
    // First, get all users excluding matches - reuse our updated function
    const potentialMatches = await getDiscoverableUsers(currentUserId);
    
    // Get scores for each potential match
    const scorePromises = potentialMatches.map(user => 
      getCompatibilityScore(currentUserId, user.id)
        .then(scoreData => ({
          userId: user.id,
          score: scoreData?.score || 50 // Default to 50 if no score
        }))
        .catch(err => {
          console.error(`Error getting score for user ${user.id}:`, err);
          return {
            userId: user.id,
            score: 50 // Default score on error
          };
        })
    );
    
    const userScores = await Promise.all(scorePromises);
    
    // Apply client-side filtering based on the activeFilters
    const filteredMatches = potentialMatches.filter(user => {
      // Apply filters criteria here
      let passesFilters = true;
      
      if (filters.genderPreference && filters.genderPreference !== 'Any') {
        passesFilters = passesFilters && user.basicInfo?.gender === filters.genderPreference;
      }
      
      // Apply room type filter if only one type is selected
      const { private: lookingForPrivate, shared: lookingForShared, entirePlace: lookingForEntire } = filters.roomType;
      if (lookingForPrivate && !lookingForShared && !lookingForEntire) {
        passesFilters = passesFilters && user.preferences?.roomType === 'private';
      } else if (!lookingForPrivate && lookingForShared && !lookingForEntire) {
        passesFilters = passesFilters && user.preferences?.roomType === 'shared';
      }
      
      // Apply budget filter
      if (filters.budgetRange?.max) {
        passesFilters = passesFilters && (user.preferences?.budget?.min <= filters.budgetRange.max);
      }
      
      // Apply lifestyle filters
      if (filters.lifestyle?.smoking !== null) {
        passesFilters = passesFilters && user.lifestyle?.smoking === filters.lifestyle.smoking;
      }
      
      return passesFilters;
    });
    
    // Sort by compatibility score
    const sortedMatches = filteredMatches.sort((a, b) => {
      const scoreA = userScores.find(s => s.userId === a.id)?.score || 0;
      const scoreB = userScores.find(s => s.userId === b.id)?.score || 0;
      // Sort descending (highest scores first)
      return scoreB - scoreA;
    });
    
    // Attach scores to user objects for UI display
    const matchesWithScores = sortedMatches.map(user => {
      const userScore = userScores.find(s => s.userId === user.id);
      return {
        ...user,
        compatibilityScore: userScore?.score || 0
      };
    });
    
    console.log(`Found ${matchesWithScores.length} compatible users after filtering and scoring`);
    
    return matchesWithScores;
  } catch (error) {
    console.error("Error fetching discoverable users with scores:", error);
    return [];
  }
};

/**
 * Batch updates compatibility scores for a user
 * This could be called when a user updates their profile
 */
export const updateUserCompatibilityScores = async (userId: string): Promise<boolean> => {
  try {
    // Get all users to calculate scores with
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, 
      where('isProfileComplete', '==', true),
      where(documentId(), '!=', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    const batchPromises: Promise<CompatibilityScore | null>[] = [];
    
    // Calculate scores for each user pair
    querySnapshot.forEach(userDoc => {
      const otherUserId = userDoc.id;
      batchPromises.push(calculateCompatibilityScore(userId, otherUserId));
    });
    
    // Wait for all calculations
    const scores = await Promise.all(batchPromises);
    
    // Add all scores to batch
    scores.forEach(score => {
      if (score) {
        const userIds = [score.userId1, score.userId2].sort();
        const scoreDocId = userIds.join('_');
        const scoreDocRef = doc(db, COMPATIBILITY_SCORES_COLLECTION, scoreDocId);
        batch.set(scoreDocRef, score);
      }
    });
    
    // Commit the batch
    await batch.commit();
    console.log(`Updated compatibility scores for user ${userId} with ${scores.filter(Boolean).length} other users`);
    
    return true;
  } catch (error) {
    console.error("Error updating user compatibility scores:", error);
    return false;
  }
};

// Update the deleteMatch function
export const deleteMatch = async (currentUserId: string, otherUserId: string): Promise<boolean> => {
  if (!currentUserId || !otherUserId) {
    console.error("Cannot delete match without both user IDs");
    return false;
  }
  
  const conversationId = generateConversationId(currentUserId, otherUserId);
  
  try {
    console.log(`Attempting to delete match between ${currentUserId} and ${otherUserId}`);
    
    // 1. Delete the current user's match document
    const currentUserMatchRef = doc(db, MATCHES_COLLECTION, currentUserId, 'userMatches', otherUserId);
    await deleteDoc(currentUserMatchRef);
    console.log(`Successfully deleted match from current user's collection`);
    
    // 2. Delete the other user's match document - if this fails, we at least deleted our own
    try {
      const otherUserMatchRef = doc(db, MATCHES_COLLECTION, otherUserId, 'userMatches', currentUserId);
      await deleteDoc(otherUserMatchRef);
      console.log(`Successfully deleted match from other user's collection`);
    } catch (error) {
      // Log the error but continue - we at least deleted our own side
      console.warn(`Could not delete match from other user's collection:`, error);
    }
    
    // 3. Delete the conversation if it exists
    try {
      const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      if (conversationSnap.exists()) {
        await deleteDoc(conversationRef);
        console.log(`Successfully deleted conversation`);
      }
    } catch (error) {
      console.warn(`Could not delete conversation:`, error);
    }
    
    // 4. Delete messages
    try {
      const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
      const messagesSnap = await getDocs(messagesRef);
      
      const deletePromises = messagesSnap.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${messagesSnap.size} messages`);
    } catch (error) {
      console.warn(`Could not delete messages:`, error);
    }
    
    return true;
  } catch (error) {
    console.error(`Error in deleteMatch:`, error);
    throw error;
  }
};

// Add a new function to validate and fix inconsistent matches
export const validateAndFixMatches = async (userId: string): Promise<number> => {
  if (!userId) {
    console.error("validateAndFixMatches: User ID is required.");
    return 0;
  }

  try {
    let fixedCount = 0;
    console.log(`validateAndFixMatches: Starting validation for user ${userId}`);

    // 1. Get all matches for the current user
    const userMatchesRef = collection(db, MATCHES_COLLECTION, userId, 'userMatches');
    const matchesSnapshot = await getDocs(userMatchesRef);
    console.log(`validateAndFixMatches: Found ${matchesSnapshot.size} potential matches for user ${userId}.`);

    // 2. Check each match for consistency
    const validationPromises = matchesSnapshot.docs.map(async (matchDoc) => {
      const otherUserId = matchDoc.id;
      const otherUserMatchRef = doc(db, MATCHES_COLLECTION, otherUserId, 'userMatches', userId);

      try {
        // Check if the other user has a matching document
        const otherUserMatch = await getDoc(otherUserMatchRef);

        // If match is inconsistent (one-sided), delete our side
        if (!otherUserMatch.exists()) {
          console.log(`validateAndFixMatches: Inconsistency detected: ${userId} has match with ${otherUserId}, but not vice versa.`);

          // Delete the invalid match
          await deleteDoc(doc(db, MATCHES_COLLECTION, userId, 'userMatches', otherUserId));
          console.log(`validateAndFixMatches: Deleted inconsistent match document for ${userId} -> ${otherUserId}`);
          return 1; // Indicate one fix was made
        }
      } catch (checkError) {
        console.error(`validateAndFixMatches: Error checking match with ${otherUserId}:`, checkError);
      }
      return 0; // Indicate no fix was made for this match
    });

    // Wait for all validations and sum up the fixes
    const results = await Promise.all(validationPromises);
    fixedCount = results.reduce((sum, count) => sum + count, 0);

    console.log(`validateAndFixMatches: Finished validation. Fixed ${fixedCount} inconsistent matches for user ${userId}`);
    return fixedCount;
  } catch (error) {
    console.error(`validateAndFixMatches: Error validating matches for user ${userId}:`, error);
    return 0;
  }
};

// Refine getMessagesListener with more logging
export const getMessagesListener = (
  conversationId: string,
  callback: (messages: MessageData[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  let messagesUnsubscribe: (() => void) | null = null; // To store the inner listener's unsubscribe

  if (!conversationId) {
    onError(new Error("getMessagesListener: Conversation ID is required."));
    return () => {}; // Return empty unsubscribe
  }

  const currentUser = getCurrentUser();
  if (!currentUser?.uid) {
    onError(new Error("getMessagesListener: No authenticated user."));
    return () => {};
  }
  const currentUserId = currentUser.uid;

  console.log(`getMessagesListener: Setting up main listener for conversation ${conversationId}`);

  const conversationRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  // Listener for the conversation document itself (to check match status)
  const conversationUnsubscribe = onSnapshot(conversationRef, async (conversationSnap) => {
    // Check auth status again inside async callback
    if (!getCurrentUser()?.uid) {
        console.log(`getMessagesListener (Conv): User logged out during check for ${conversationId}.`);
        if (messagesUnsubscribe) messagesUnsubscribe(); // Stop listening to messages
        messagesUnsubscribe = null;
        callback([]); // Clear messages
        return;
    }

    if (!conversationSnap.exists()) {
      console.warn(`getMessagesListener (Conv): Conversation ${conversationId} does not exist.`);
      if (messagesUnsubscribe) messagesUnsubscribe();
      messagesUnsubscribe = null;
      callback([]);
      onError(new Error("Conversation not found.")); // Notify caller
      return;
    }

    const data = conversationSnap.data();
    const participants = data?.participants || [];
    const otherUserId = participants.find(id => id !== currentUserId);

    if (!otherUserId) {
      console.error(`getMessagesListener (Conv): Could not determine other participant in ${conversationId}`);
      if (messagesUnsubscribe) messagesUnsubscribe();
      messagesUnsubscribe = null;
      callback([]);
      onError(new Error("Could not identify participants."));
      return;
    }

    // Check if users are matched
    try {
      const isMatched = await areUsersMatched(currentUserId, otherUserId);
      if (!getCurrentUser()?.uid) return; // Check auth again after async

      if (!isMatched) {
        console.log(`getMessagesListener (Conv): Users ${currentUserId} and ${otherUserId} are not matched. Stopping message listener.`);
        if (messagesUnsubscribe) messagesUnsubscribe(); // Stop listening to messages if not matched
        messagesUnsubscribe = null;
        callback([]); // Clear messages
        // Don't necessarily call onError, just clear messages
        return;
      }

      // If matched and message listener isn't running, start it
      if (!messagesUnsubscribe) {
          console.log(`getMessagesListener (Msg): Users matched. Setting up messages listener for ${conversationId}`);
          const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_SUBCOLLECTION);
          const q = query(messagesRef, orderBy('timestamp', 'asc'));

          messagesUnsubscribe = onSnapshot(q, (querySnapshot) => {
            // Check auth inside message listener callback
            if (!getCurrentUser()?.uid) {
                console.log(`getMessagesListener (Msg): User logged out during message update for ${conversationId}.`);
                return; // Don't process if logged out
            }

            console.log(`getMessagesListener (Msg): Received ${querySnapshot.size} messages for ${conversationId}.`);
            const messages: MessageData[] = [];
            querySnapshot.forEach((doc) => {
              const data = doc.data();
              // Convert Firestore Timestamp to JS Date
              const timestamp = data.timestamp instanceof Timestamp ? data.timestamp.toDate() : new Date();
              messages.push({
                id: doc.id,
                ...data,
                timestamp: timestamp,
              } as MessageData);
            });
            // Log the processed messages before calling callback
            // console.log(`getMessagesListener (Msg): Processed messages:`, messages);
            callback(messages); // Send processed messages to the component

          }, (error) => {
            // Check auth inside error callback
            if (!getCurrentUser()?.uid) {
                 console.log(`getMessagesListener (Msg): User logged out, ignoring error for ${conversationId}.`);
                 return; // Don't process if logged out
            }
            console.error(`getMessagesListener (Msg): Error listening to messages for ${conversationId}:`, error);
            // Check for permission errors specifically
            if (error.code === 'permission-denied') {
                 console.warn("Messages listener: Permission denied. User likely logged out or unmatched.");
                 onError(new Error("Permission denied accessing messages.")); // Notify caller
            } else {
                 onError(error); // Notify caller of other errors
            }
            messagesUnsubscribe = null; // Stop trying on error
            callback([]); // Clear messages on error
          });
      }

    } catch (matchCheckError) {
      console.error(`getMessagesListener (Conv): Error checking match status for ${conversationId}:`, matchCheckError);
      if (messagesUnsubscribe) messagesUnsubscribe();
      messagesUnsubscribe = null;
      callback([]);
      onError(new Error("Failed to verify match status."));
    }

  }, (convError) => {
    // Check auth inside conversation error callback
    if (!getCurrentUser()?.uid) {
         console.log(`getMessagesListener (Conv): User logged out, ignoring conversation listener error for ${conversationId}.`);
         return;
    }
    console.error(`getMessagesListener (Conv): Error listening to conversation ${conversationId}:`, convError);
    if (messagesUnsubscribe) messagesUnsubscribe(); // Clean up inner listener if outer fails
    messagesUnsubscribe = null;
    callback([]);
    onError(convError);
  });

  // Return a function that unsubscribes BOTH listeners
  return () => {
    console.log(`getMessagesListener: Cleaning up listeners for conversation ${conversationId}`);
    conversationUnsubscribe();
    if (messagesUnsubscribe) {
      messagesUnsubscribe();
    }
  };
};

