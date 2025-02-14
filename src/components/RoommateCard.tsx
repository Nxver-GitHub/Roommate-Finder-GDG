import React from 'react';
import type { Profile } from '../types';

interface RoommateCardProps {
  profile: Profile;
}

const RoommateCard: React.FC<RoommateCardProps> = ({ profile }) => {
  return (
    <div className="relative w-full max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <img
        src={profile.profile_image_url}
        alt={profile.full_name}
        className="w-full h-64 object-cover"
      />
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {profile.full_name}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {profile.pronouns}
        </p>
        <div className="mt-4 space-y-2">
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Major:</span> {profile.major}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            <span className="font-medium">Year:</span> {profile.year}
          </p>
          {profile.bio && (
            <p className="text-gray-600 dark:text-gray-300 mt-4">
              {profile.bio}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoommateCard;