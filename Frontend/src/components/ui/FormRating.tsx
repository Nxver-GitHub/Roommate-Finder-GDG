import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface FormRatingProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  count?: number;
  error?: string;
}

export function FormRating({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  count = 5,
  error,
}: FormRatingProps) {
  const handlePress = (newValue: number) => {
    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.ratingContainer}>
        <Text style={styles.endLabel}>{lowLabel}</Text>
        <View style={styles.starsContainer}>
          {Array.from({ length: count }, (_, i) => i + 1).map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => handlePress(star)}
              style={styles.starButton}
            >
              <View
                style={[
                  styles.star,
                  star <= value ? styles.filledStar : styles.emptyStar,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.endLabel}>{highLabel}</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  starButton: {
    padding: 6,
  },
  star: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  emptyStar: {
    backgroundColor: '#444',
  },
  filledStar: {
    backgroundColor: '#FFD700',
  },
  endLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    minWidth: 70,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
}); 