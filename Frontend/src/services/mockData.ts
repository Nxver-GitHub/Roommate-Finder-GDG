// Mock data for testing the swipeable cards
export const mockProfiles = [
  {
    id: '1',
    name: 'Alex',
    age: 24,
    occupation: 'Software Engineer',
    bio: 'Looking for a quiet roommate who respects personal space. I work from home and enjoy cooking on weekends.',
    images: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
    ],
    distance: 2.4,
    interests: ['Reading', 'Hiking', 'Cooking'],
  },
  {
    id: '2',
    name: 'Jamie',
    age: 26,
    occupation: 'Graphic Designer',
    bio: 'Creative soul looking for a like-minded roommate. I have a small dog who is very friendly.',
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80',
    ],
    distance: 3.7,
    interests: ['Art', 'Music', 'Pets'],
  },
  {
    id: '3',
    name: 'Taylor',
    age: 28,
    occupation: 'Marketing Manager',
    bio: 'I\'m a clean, organized person looking for a roommate with similar values. I enjoy socializing but also value quiet evenings at home.',
    images: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=776&q=80',
    ],
    distance: 1.2,
    interests: ['Fitness', 'Travel', 'Movies'],
  },
  {
    id: '4',
    name: 'Morgan',
    age: 25,
    occupation: 'Student',
    bio: 'Grad student looking for a quiet place to live while I finish my thesis. I\'m tidy and mostly keep to myself.',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=928&q=80',
    ],
    distance: 5.0,
    interests: ['Books', 'Coffee', 'Cycling'],
  },
  {
    id: '5',
    name: 'Jordan',
    age: 30,
    occupation: 'Doctor',
    bio: 'Medical resident with irregular hours. Looking for someone understanding about my schedule. I\'m easy-going and like to keep things clean.',
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=774&q=80',
      'https://images.unsplash.com/photo-1552058544-f2b08422138a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=798&q=80',
    ],
    distance: 2.8,
    interests: ['Running', 'Cooking', 'Travel'],
  },
];

// Simulates fetching data from an API
export function fetchProfiles() {
  return new Promise<typeof mockProfiles>((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockProfiles);
    }, 1000);
  });
} 