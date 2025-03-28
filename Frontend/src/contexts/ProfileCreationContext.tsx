import React, { createContext, useContext, useState, useEffect } from 'react';
import { ProfileFormData } from '../types/profile';

interface ProfileCreationContextType {
  formData: Partial<ProfileFormData>;
  updateFormData: (data: Partial<ProfileFormData>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
}

const ProfileCreationContext = createContext<ProfileCreationContextType | undefined>(undefined);

const initialFormData: Partial<ProfileFormData> = {
  basicInfo: {
    firstName: '',
    lastName: '',
    age: 0,
    gender: '',
    occupation: '',
    bio: '',
  },
  preferences: {
    budget: {
      min: 500,
      max: 1500,
    },
    moveInDate: new Date(),
    duration: '',
    location: '',
    roomType: 'either',
  },
  lifestyle: {
    cleanliness: 3,
    noise: 3,
    guestComfort: 3,
    schedule: 'flexible',
    smoking: false,
    pets: false,
  },
  photos: [],
};

export function ProfileCreationProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<Partial<ProfileFormData>>(initialFormData);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    console.log('Current step changed to:', currentStep);
  }, [currentStep]);

  const updateFormData = (data: Partial<ProfileFormData>) => {
    console.log('Updating form data:', data);
    setFormData(prev => {
      const newData = {
        ...prev,
        ...data,
      };
      console.log('New form data:', newData);
      return newData;
    });
  };

  const isStepComplete = (step: number): boolean => {
    try {
      switch (step) {
        case 0: // Basic Info
          return !!(
            formData.basicInfo?.firstName &&
            formData.basicInfo?.lastName &&
            formData.basicInfo?.age &&
            formData.basicInfo?.gender &&
            formData.basicInfo?.occupation &&
            formData.basicInfo?.bio
          );
        case 1: // Preferences
          return !!(
            formData.preferences?.budget &&
            formData.preferences?.moveInDate &&
            formData.preferences?.duration &&
            formData.preferences?.location &&
            formData.preferences?.roomType
          );
        case 2: // Lifestyle
          return !!(
            formData.lifestyle?.cleanliness &&
            formData.lifestyle?.noise &&
            formData.lifestyle?.guestComfort &&
            formData.lifestyle?.schedule !== undefined &&
            formData.lifestyle?.smoking !== undefined &&
            formData.lifestyle?.pets !== undefined
          );
        case 3: // Photos
          return !!(formData.photos && formData.photos.length > 0);
        default:
          return false;
      }
    } catch (err) {
      console.error('Error checking step completion:', err);
      return false;
    }
  };

  return (
    <ProfileCreationContext.Provider
      value={{
        formData,
        updateFormData,
        currentStep,
        setCurrentStep,
        isStepComplete,
      }}
    >
      {children}
    </ProfileCreationContext.Provider>
  );
}

export function useProfileCreation() {
  const context = useContext(ProfileCreationContext);
  if (context === undefined) {
    throw new Error('useProfileCreation must be used within a ProfileCreationProvider');
  }
  return context;
} 