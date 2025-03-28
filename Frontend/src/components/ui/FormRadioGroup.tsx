import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Option {
  label: string;
  value: string;
}

interface FormRadioGroupProps {
  label: string;
  options: Option[];
  value: string;
  onSelect: (value: string) => void;
  error?: string;
}

export function FormRadioGroup({
  label,
  options,
  value,
  onSelect,
  error,
}: FormRadioGroupProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              value === option.value && styles.selectedOption,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View
              style={[
                styles.radio,
                value === option.value && styles.selectedRadio,
              ]}
            >
              {value === option.value && <View style={styles.selectedInner} />}
            </View>
            <Text
              style={[
                styles.optionLabel,
                value === option.value && styles.selectedOptionLabel,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedOption: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  selectedRadio: {
    borderColor: '#FFD700',
  },
  selectedInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD700',
  },
  optionLabel: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  selectedOptionLabel: {
    color: '#FFD700',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
}); 