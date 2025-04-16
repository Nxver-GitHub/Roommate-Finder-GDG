import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// Align the type with SearchFilters
type GenderOption = 'Male' | 'Female' | 'Any';

interface GenderSelectorProps {
  value: GenderOption;
  onChange: (value: GenderOption) => void;
}

const GenderSelector: React.FC<GenderSelectorProps> = ({ value, onChange }) => {
  // Remove 'Other' from the options array
  const options: GenderOption[] = ['Any', 'Male', 'Female'];

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Roommate Gender Preference</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              value === option && styles.selectedOptionButton,
            ]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                styles.optionText,
                value === option && styles.selectedOptionText,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Changed from space-between for better spacing with 3 items
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 4,
  },
  optionButton: {
    flex: 1, // Each button takes equal space
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  selectedOptionButton: {
    backgroundColor: '#FFD700', // Use your app's accent color
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  selectedOptionText: {
    color: '#000000', // Contrast color for selected text
  },
});

export default GenderSelector;
