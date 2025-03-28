import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/formatters';

interface DateRangeSelectorProps {
  value: {
    earliest: Date;
    latest: Date;
  };
  onChange: (value: { earliest: Date; latest: Date }) => void;
}

export default function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [showEarliestPicker, setShowEarliestPicker] = useState(false);
  const [showLatestPicker, setShowLatestPicker] = useState(false);

  const handleEarliestChange = (event: any, selectedDate?: Date) => {
    setShowEarliestPicker(false);
    if (selectedDate) {
      // Ensure earliest date doesn't exceed latest date
      if (selectedDate > value.latest) {
        onChange({ earliest: selectedDate, latest: selectedDate });
      } else {
        onChange({ ...value, earliest: selectedDate });
      }
    }
  };

  const handleLatestChange = (event: any, selectedDate?: Date) => {
    setShowLatestPicker(false);
    if (selectedDate) {
      // Ensure latest date isn't before earliest date
      if (selectedDate < value.earliest) {
        onChange({ earliest: selectedDate, latest: selectedDate });
      } else {
        onChange({ ...value, latest: selectedDate });
      }
    }
  };

  // Add 3 months to today's date for the max date
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 12);

  // Set min date to today
  const minDate = new Date();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Move-in Dates</Text>
      
      <View style={styles.datePickerContainer}>
        <Text style={styles.dateLabel}>Earliest Move-in Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowEarliestPicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(value.earliest)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#ccc" />
        </TouchableOpacity>
        {showEarliestPicker && (
          <DateTimePicker
            value={value.earliest}
            mode="date"
            display="default"
            onChange={handleEarliestChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        )}
      </View>
      
      <View style={styles.datePickerContainer}>
        <Text style={styles.dateLabel}>Latest Move-in Date</Text>
        <TouchableOpacity 
          style={styles.dateButton}
          onPress={() => setShowLatestPicker(true)}
        >
          <Text style={styles.dateText}>{formatDate(value.latest)}</Text>
          <Ionicons name="calendar-outline" size={20} color="#ccc" />
        </TouchableOpacity>
        {showLatestPicker && (
          <DateTimePicker
            value={value.latest}
            mode="date"
            display="default"
            onChange={handleLatestChange}
            minimumDate={value.earliest}
            maximumDate={maxDate}
          />
        )}
      </View>
      
      <View style={styles.flexibleContainer}>
        <Text style={styles.flexibleText}>
          Looking for roommates who can move in between {formatDate(value.earliest)} and {formatDate(value.latest)}
        </Text>
      </View>
      
      <View style={styles.quickDatesContainer}>
        <Text style={styles.quickDatesLabel}>Quick Select</Text>
        <View style={styles.quickDatesButtons}>
          <TouchableOpacity 
            style={styles.quickDateButton}
            onPress={() => {
              const now = new Date();
              onChange({ earliest: now, latest: now });
            }}
          >
            <Text style={styles.quickDateText}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickDateButton}
            onPress={() => {
              const now = new Date();
              const oneMonth = new Date();
              oneMonth.setMonth(now.getMonth() + 1);
              onChange({ earliest: now, latest: oneMonth });
            }}
          >
            <Text style={styles.quickDateText}>Next Month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickDateButton}
            onPress={() => {
              const now = new Date();
              const endOfSummer = new Date(now.getFullYear(), 7, 31); // August 31
              onChange({ earliest: now, latest: endOfSummer });
            }}
          >
            <Text style={styles.quickDateText}>End of Summer</Text>
          </TouchableOpacity>
        </View>
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
  datePickerContainer: {
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  flexibleContainer: {
    backgroundColor: '#232323',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  flexibleText: {
    color: '#FFD700',
    fontSize: 14,
    textAlign: 'center',
  },
  quickDatesContainer: {
    marginTop: 16,
  },
  quickDatesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  quickDatesButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  quickDateButton: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  quickDateText: {
    color: '#fff',
  },
}); 