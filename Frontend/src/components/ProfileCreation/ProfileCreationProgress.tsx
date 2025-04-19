import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

const steps = ['Basic Info', 'Preferences', 'Lifestyle', 'Photos'];

export function ProfileCreationProgress() {
  const { currentStep, isStepComplete } = useProfileCreation();

  return (
    <Animated.View 
      entering={FadeIn.duration(800)}
      style={styles.container}
    >
      <LinearGradient
        colors={[COLORS.background.elevated, 'rgba(31, 41, 55, 0.7)']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.gradientContainer}
      >
        <Text style={styles.title}>Create Your Profile</Text>
        
        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <React.Fragment key={step}>
              <View
                style={[
                  styles.stepWrapper,
                  currentStep === index && styles.currentStepWrapper,
                  isStepComplete(index) && styles.completedStepWrapper,
                ]}
              >
                <LinearGradient
                  colors={
                    currentStep === index
                      ? [COLORS.secondary, '#E5B93C']
                      : isStepComplete(index)
                      ? [COLORS.success, '#2A8A71']
                      : ['#444', '#333']
                  }
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.step}
                >
                  <Text
                    style={[
                      styles.stepText,
                      currentStep === index && styles.currentStepText,
                    ]}
                  >
                    {index + 1}
                  </Text>
                </LinearGradient>
              </View>
              
              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.connector,
                    isStepComplete(index) && styles.completedConnector,
                  ]}
                />
              )}
            </React.Fragment>
          ))}
        </View>
        
        <LinearGradient
          colors={[COLORS.primary, 'rgba(67, 113, 203, 0.7)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.stepLabelContainer}
        >
          <Text style={styles.stepLabel}>{steps[currentStep]}</Text>
        </LinearGradient>
      </LinearGradient>
    </Animated.View>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  gradientContainer: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.md,
  },
  title: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  stepWrapper: {
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
    backgroundColor: '#444',
    ...SHADOWS.sm,
  },
  currentStepWrapper: {
    backgroundColor: COLORS.secondary,
  },
  completedStepWrapper: {
    backgroundColor: COLORS.success,
  },
  step: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
  },
  currentStepText: {
    color: '#000',
  },
  connector: {
    width: (width - 220) / 3,
    height: 2,
    backgroundColor: '#444',
    marginHorizontal: SPACING.xs,
  },
  completedConnector: {
    backgroundColor: COLORS.success,
  },
  stepLabelContainer: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignSelf: 'center',
  },
  stepLabel: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: TYPOGRAPHY.fontWeight.bold,
    textAlign: 'center',
  },
}); 