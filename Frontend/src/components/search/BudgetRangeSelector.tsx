import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { formatCurrency } from '../../utils/formatters';

interface BudgetRangeSelectorProps {
  value: {
    min: number;
    max: number;
  };
  onChange: (value: { min: number; max: number }) => void;
}

export default function BudgetRangeSelector({ value, onChange }: BudgetRangeSelectorProps) {
  const MIN_BUDGET = 300;
  const MAX_BUDGET = 3000;
  const STEP = 50;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monthly Budget</Text>
      <Text style={styles.rangeText}>
        {formatCurrency(value.min)} - {formatCurrency(value.max)}
      </Text>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={MIN_BUDGET}
          maximumValue={MAX_BUDGET}
          step={STEP}
          value={value.min}
          onValueChange={(val) => {
            // Ensure min doesn't exceed max
            const newMin = Math.min(val, value.max - STEP);
            onChange({ min: newMin, max: value.max });
          }}
          minimumTrackTintColor="#FFD700"
          maximumTrackTintColor="#333"
          thumbTintColor="#FFD700"
        />
        <Text style={styles.sliderLabel}>Minimum</Text>
      </View>
      
      <View style={styles.sliderContainer}>
        <Slider
          style={styles.slider}
          minimumValue={MIN_BUDGET}
          maximumValue={MAX_BUDGET}
          step={STEP}
          value={value.max}
          onValueChange={(val) => {
            // Ensure max doesn't go below min
            const newMax = Math.max(val, value.min + STEP);
            onChange({ min: value.min, max: newMax });
          }}
          minimumTrackTintColor="#FFD700"
          maximumTrackTintColor="#333"
          thumbTintColor="#FFD700"
        />
        <Text style={styles.sliderLabel}>Maximum</Text>
      </View>
      
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeLabel}>{formatCurrency(MIN_BUDGET)}</Text>
        <Text style={styles.rangeLabel}>{formatCurrency(MAX_BUDGET)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  rangeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 30,
  },
  sliderContainer: {
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 4,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  rangeLabel: {
    color: '#999',
    fontSize: 14,
  },
}); 