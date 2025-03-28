import { format } from 'date-fns';

export type User = {
  id: string;
  name: string;
  image: string;
};

export type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  image?: string;
};

export type Conversation = {
  id: string;
  participants: User[];
  messages: Message[];
  lastMessageTime: Date;
};

// Mock current user
export const currentUser: User = {
  id: 'user1',
  name: 'You',
  image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3',
};

// Mock matches/conversations
export const mockConversations: Conversation[] = [
  {
    id: 'conv1',
    participants: [
      currentUser,
      {
        id: 'user2',
        name: 'Alex Johnson',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3',
      },
    ],
    messages: [
      {
        id: 'msg1',
        senderId: 'user2',
        text: "Hey! I saw we matched. I'm looking for a place near campus.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        read: true,
      },
      {
        id: 'msg2',
        senderId: 'user1',
        text: "Hi Alex! That sounds great. I'm also looking in that area. What's your budget?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1.5), // 1.5 days ago
        read: true,
      },
      {
        id: 'msg3',
        senderId: 'user2',
        text: "I'm thinking around $800-1000 per month. Does that work for you?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        read: true,
      },
      {
        id: 'msg4',
        senderId: 'user1',
        text: "That's in my range too. When are you looking to move in?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
        read: true,
      },
      {
        id: 'msg5',
        senderId: 'user2',
        text: "I'm hoping to move in by the start of next month. Would that timeline work for you?",
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
        read: false,
      },
    ],
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'conv2',
    participants: [
      currentUser,
      {
        id: 'user3',
        name: 'Jamie Chen',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3',
      },
    ],
    messages: [
      {
        id: 'msg6',
        senderId: 'user3',
        text: 'Hello! I think we might be a good match as roommates.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        read: true,
      },
      {
        id: 'msg7',
        senderId: 'user1',
        text: 'Hi Jamie! I think so too. What area are you looking in?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36), // 1.5 days ago
        read: true,
      },
      {
        id: 'msg8',
        senderId: 'user3',
        text: "I'm looking for a place downtown, preferably a 2-bedroom.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        read: true,
      },
      {
        id: 'msg9',
        senderId: 'user3',
        text: 'Do you have any specific requirements for a roommate?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60), // 2 hours 59 minutes ago
        read: true,
      },
    ],
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 3 + 1000 * 60), // 2 hours 59 minutes ago
  },
  {
    id: 'conv3',
    participants: [
      currentUser,
      {
        id: 'user4',
        name: 'Taylor Smith',
        image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3',
      },
    ],
    messages: [
      {
        id: 'msg10',
        senderId: 'user1',
        text: 'Hi Taylor! I think we could be compatible roommates based on our preferences.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
        read: true,
      },
      {
        id: 'msg11',
        senderId: 'user4',
        text: "Hey there! I agree. I saw that you're also a student?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 71), // almost 3 days ago
        read: true,
      },
      {
        id: 'msg12',
        senderId: 'user1',
        text: "Yes! I'm studying Computer Science. What about you?",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 70), // almost 3 days ago
        read: true,
      },
    ],
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 70), // almost 3 days ago
  },
];

// Utility functions
export const getConversations = () => {
  return mockConversations.sort(
    (a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
  );
};

export const getConversationById = (conversationId: string) => {
  return mockConversations.find((conv) => conv.id === conversationId);
};

export const getLastMessage = (conversation: Conversation) => {
  if (conversation.messages.length === 0) return null;
  return conversation.messages[conversation.messages.length - 1];
};

export const formatMessageTime = (date: Date) => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 24 hours, show time
  if (diff < 24 * 60 * 60 * 1000) {
    return format(date, 'h:mm a');
  }
  
  // Less than 7 days, show day of week
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return format(date, 'EEEE');
  }
  
  // Otherwise, show date
  return format(date, 'MMM d');
}; 