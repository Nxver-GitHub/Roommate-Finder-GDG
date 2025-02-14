import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { auth, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('fullName') as string,
      pronouns: formData.get('pronouns') as string,
      major: formData.get('major') as string,
      year: formData.get('year') as string,
      bio: formData.get('bio') as string,
    };

    try {
      await updateProfile(updates);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!auth.user) return null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
          <div className="flex items-center space-x-8 mb-8">
            <img
              src={auth.user.profile_image_url}
              alt={auth.user.full_name}
              className="h-32 w-32 rounded-full object-cover"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {auth.user.full_name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">{auth.user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-md">
                <p className="text-sm text-green-700 dark:text-green-200">
                  Profile updated successfully!
                </p>
              </div>
            )}

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                defaultValue={auth.user.full_name}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="pronouns" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pronouns
              </label>
              <input
                type="text"
                name="pronouns"
                id="pronouns"
                defaultValue={auth.user.pronouns}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="major" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Major
              </label>
              <input
                type="text"
                name="major"
                id="major"
                defaultValue={auth.user.major}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Year
              </label>
              <select
                id="year"
                name="year"
                defaultValue={auth.user.year}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                <option value="Freshman">Freshman</option>
                <option value="Sophomore">Sophomore</option>
                <option value="Junior">Junior</option>
                <option value="Senior">Senior</option>
                <option value="Graduate">Graduate</option>
              </select>
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={4}
                defaultValue={auth.user.bio}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                placeholder="Tell potential roommates about yourself..."
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;