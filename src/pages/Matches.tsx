import React from 'react';
import { MessageCircle } from 'lucide-react';
import RoommateCard from '../components/RoommateCard';
import type { Profile } from '../types';

// Mock matches for demonstration
const mockMatches: Profile[] = [
  {
    id: '4',
    full_name: 'Morgan Lee',
    email: 'mlee@ucsc.edu',
    pronouns: 'she/her',
    bio: 'Art major who loves creating and maintaining a positive living environment. Looking for creative and respectful roommates!',
    major: 'Art',
    year: 'Junior',
    profile_image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    full_name: 'Chris Martinez',
    email: 'cmartinez@ucsc.edu',
    pronouns: 'they/them',
    bio: 'Engineering student who enjoys gaming and movie nights. Looking for someone who appreciates both social time and quiet study hours.',
    major: 'Computer Engineering',
    year: 'Sophomore',
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const Matches = () => {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Your Matches</h1>
        
        {mockMatches.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No matches yet. Keep swiping to find your perfect roommate!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockMatches.map((match) => (
              <div key={match.id} className="relative">
                <RoommateCard profile={match} />
                <button className="absolute bottom-4 right-4 p-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                  <MessageCircle className="h-6 w-6" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;