import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useProfileCreation } from '../../../src/contexts/ProfileCreationContext';
import { BasicInfoStep } from '../../../src/components/ProfileCreation/BasicInfoStep';
import { PreferencesStep } from '../../../src/components/ProfileCreation/PreferencesStep';
import { LifestyleStep } from '../../../src/components/ProfileCreation/LifestyleStep';
import { PhotosStep } from '../../../src/components/ProfileCreation/PhotosStep';
import { ProfileCreationProgress } from '../../../src/components/ProfileCreation/ProfileCreationProgress';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../../src/utils/theme';
import { AlertTriangle } from 'lucide-react-native';

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
          <LinearGradient
            colors={['rgba(255, 68, 68, 0.8)', 'rgba(200, 30, 30, 0.7)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.errorGradient}
          >
            <AlertTriangle size={50} color={COLORS.text.primary} />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <Text style={styles.errorHint}>
              Please restart the app and try again. We're working on fixing this issue.
            </Text>
            
            <TouchableOpacity
              onPress={() => setError(null)}
              style={styles.errorButton}
            >
              <LinearGradient
                colors={[COLORS.primary, 'rgba(67, 113, 203, 0.8)']}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 1}}
                style={styles.errorButtonGradient}
              >
                <Text style={styles.errorButtonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
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
    backgroundColor: COLORS.background.default,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  errorContainer: {
    flex: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorGradient: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.lg,
    width: '100%',
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  errorMessage: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  errorButton: {
    overflow: 'hidden',
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.md,
  },
  errorButtonGradient: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  errorButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
}); 