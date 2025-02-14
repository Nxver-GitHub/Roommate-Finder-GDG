import React, { useState } from 'react';
import { X, Heart } from 'lucide-react';
import TinderCard from 'react-tinder-card';
import { useAuth } from '../context/AuthContext';
import RoommateCard from '../components/RoommateCard';
import type { Profile } from '../types';

// Mock profiles for demonstration
const mockProfiles: Profile[] = [
  {
    id: '1',
    full_name: 'Alex Rivera',
    email: 'arivera@ucsc.edu',
    pronouns: 'they/them',
    bio: 'Computer Science major looking for a quiet roommate who respects study time. I enjoy hiking and photography in my free time.',
    major: 'Computer Science',
    year: 'Junior',
    profile_image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    full_name: 'Jordan Chen',
    email: 'jchen@ucsc.edu',
    pronouns: 'she/her',
    bio: 'Environmental Studies student passionate about sustainability. Looking for an eco-conscious roommate.',
    major: 'Environmental Studies',
    year: 'Sophomore',
    profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    full_name: 'Sam Taylor',
    email: 'staylor@ucsc.edu',
    pronouns: 'he/him',
    bio: 'Psychology major who loves music and keeping a clean living space. Looking for someone with similar interests!',
    major: 'Psychology',
    year: 'Senior',
    profile_image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const Find = () => {
  const { auth } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(mockProfiles.length - 1);
  const [lastDirection, setLastDirection] = useState<string>();

  const swiped = (direction: string, profile: Profile) => {
    setLastDirection(direction);
    // Here you would typically make an API call to record the swipe
    console.log('You swiped: ' + direction + ' on ' + profile.full_name);
  };

  const outOfFrame = (name: string) => {
    console.log(name + ' left the screen!');
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto relative h-[70vh]">
        <div className="absolute w-full">
          {mockProfiles.map((profile, index) => (
            <TinderCard
              key={profile.id}
              onSwipe={(dir) => swiped(dir, profile)}
              onCardLeftScreen={() => outOfFrame(profile.full_name)}
              preventSwipe={['up', 'down']}
              className="absolute"
            >
              <div className="relative">
                <RoommateCard profile={profile} />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-8">
                  <button
                    onClick={() => swiped('left', profile)}
                    className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="h-8 w-8 text-red-500" />
                  </button>
                  <button
                    onClick={() => swiped('right', profile)}
                    className="p-4 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Heart className="h-8 w-8 text-green-500" />
                  </button>
                </div>
              </div>
            </TinderCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Find;