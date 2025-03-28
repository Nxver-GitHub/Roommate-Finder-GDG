export type UserProfile = {
  id?: string;
  basicInfo: {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    occupation: string;
    bio: string;
  };
  preferences: {
    budget: {
      min: number;
      max: number;
    };
    moveInDate: Date;
    duration: string;
    location: string;
    roomType: 'private' | 'shared' | 'either';
  };
  lifestyle: {
    cleanliness: 1 | 2 | 3 | 4 | 5;
    noise: 1 | 2 | 3 | 4 | 5;
    guestComfort: 1 | 2 | 3 | 4 | 5;
    schedule: 'early_bird' | 'night_owl' | 'flexible';
    smoking: boolean;
    pets: boolean;
  };
  photos: string[];
};

export type ProfileFormData = Omit<UserProfile, 'id'>; 