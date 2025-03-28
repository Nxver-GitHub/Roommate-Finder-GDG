import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { useProfileCreation } from '../../../src/contexts/ProfileCreationContext';
import { BasicInfoStep } from '../../../src/components/ProfileCreation/BasicInfoStep';
import { PreferencesStep } from '../../../src/components/ProfileCreation/PreferencesStep';
import { LifestyleStep } from '../../../src/components/ProfileCreation/LifestyleStep';
import { PhotosStep } from '../../../src/components/ProfileCreation/PhotosStep';
import { ProfileCreationProgress } from '../../../src/components/ProfileCreation/ProfileCreationProgress';

export default function CreateProfileScreen() {
  const { currentStep } = useProfileCreation();
  const [error, setError] = useState<string | null>(null);

  const renderStep = () => {
    try {
      switch (currentStep) {
        case 0:
          return <BasicInfoStep />;
        case 1:
          return <PreferencesStep />;
        case 2:
          return <LifestyleStep />;
        case 3:
          return <PhotosStep />;
        default:
          return <BasicInfoStep />;
      }
    } catch (err) {
      console.error('Error rendering step:', err);
      setError('Error loading this step. Please try again.');
      return null;
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorHint}>
            Please restart the app and try again. We're working on fixing this issue.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ProfileCreationProgress />
      <View style={styles.content}>{renderStep()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
  },
}); 