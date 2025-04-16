import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Calendar } from 'lucide-react-native';
import { format, isValid } from 'date-fns';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface FormDatePickerProps {
  label: string;
  value: Date | string | null | undefined;
  onChange: (date: Date) => void;
  error?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function FormDatePicker({
  label,
  value,
  onChange,
  error,
  minimumDate,
  maximumDate,
}: FormDatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);

  const getValidDate = (incomingValue: any): Date | null => {
    if (incomingValue instanceof Date && isValid(incomingValue)) {
      return incomingValue;
    }
    return null;
  };

  const currentDate = getValidDate(value) || new Date();
  const formattedDate = getValidDate(value) ? format(currentDate, 'MMMM dd, yyyy') : 'Select a date';

  const handlePress = () => {
    setShowPicker(true);
  };

  const onPickerChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowPicker(false);

    if (event.type === 'set' && selectedDate) {
      const validSelectedDate = new Date(selectedDate);
      if (isValid(validSelectedDate)) {
        onChange(validSelectedDate);
      }
    } else {
      // User cancelled (event.type === 'dismissed')
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.button} onPress={handlePress}>
        <Text style={styles.valueText}>{formattedDate}</Text>
        <Calendar size={20} color="#FFFFFF" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}

      {showPicker && (
        <DateTimePicker
          testID="dateTimePicker"
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
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
  button: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonError: {
    borderColor: '#FF4444',
  },
  valueText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
}); 