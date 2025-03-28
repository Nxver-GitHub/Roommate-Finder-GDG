import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

interface FormRangeSliderProps {
  label: string;
  minValue: number;
  maxValue: number;
  step: number;
  initialLow: number;
  initialHigh: number;
  onValueChange: (low: number, high: number) => void;
  formatValue?: (value: number) => string;
  error?: string;
}

export function FormRangeSlider({
  label,
  minValue,
  maxValue,
  step,
  initialLow,
  initialHigh,
  onValueChange,
  formatValue = (value) => `$${value}`,
  error,
}: FormRangeSliderProps) {
  const [lowValue, setLowValue] = useState(initialLow);
  const [highValue, setHighValue] = useState(initialHigh);

  useEffect(() => {
    setLowValue(initialLow);
    setHighValue(initialHigh);
  }, [initialLow, initialHigh]);

  const handleLowValueChange = (value: number) => {
    const newLowValue = value > highValue ? highValue : value;
    setLowValue(newLowValue);
    onValueChange(newLowValue, highValue);
  };

  const handleHighValueChange = (value: number) => {
    const newHighValue = value < lowValue ? lowValue : value;
    setHighValue(newHighValue);
    onValueChange(lowValue, newHighValue);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.rangeContainer}>
        <Text style={styles.rangeLabel}>{formatValue(lowValue)}</Text>
        <Text style={styles.rangeTo}>to</Text>
        <Text style={styles.rangeLabel}>{formatValue(highValue)}</Text>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Min</Text>
        <Slider
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={lowValue}
          onValueChange={handleLowValueChange}
          minimumTrackTintColor="#FFD700"
          maximumTrackTintColor="#444"
          thumbTintColor="#FFD700"
        />
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Max</Text>
        <Slider
          style={styles.slider}
          minimumValue={minValue}
          maximumValue={maxValue}
          step={step}
          value={highValue}
          onValueChange={handleHighValueChange}
          minimumTrackTintColor="#FFD700"
          maximumTrackTintColor="#444"
          thumbTintColor="#FFD700"
        />
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
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rangeLabel: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  rangeTo: {
    color: '#FFFFFF',
    fontSize: 16,
    marginHorizontal: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    width: 40,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
}); 