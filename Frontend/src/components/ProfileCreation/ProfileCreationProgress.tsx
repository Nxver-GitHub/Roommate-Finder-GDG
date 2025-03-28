import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useProfileCreation } from '../../contexts/ProfileCreationContext';

const steps = ['Basic Info', 'Preferences', 'Lifestyle', 'Photos'];

export function ProfileCreationProgress() {
  const { currentStep, isStepComplete } = useProfileCreation();

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <View
              style={[
                styles.step,
                currentStep === index && styles.currentStep,
                isStepComplete(index) && styles.completedStep,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  currentStep === index && styles.currentStepText,
                  isStepComplete(index) && styles.completedStepText,
                ]}
              >
                {index + 1}
              </Text>
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
      <Text style={styles.stepLabel}>{steps[currentStep]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#444',
  },
  currentStep: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  completedStep: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  stepText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentStepText: {
    color: '#000',
  },
  completedStepText: {
    color: '#fff',
  },
  connector: {
    width: 40,
    height: 2,
    backgroundColor: '#333',
    marginHorizontal: 5,
  },
  completedConnector: {
    backgroundColor: '#4CAF50',
  },
  stepLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 10,
  },
}); 