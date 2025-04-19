import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoomType } from '../../services/searchService';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../utils/theme';

interface RoomTypeSelectorProps {
  value: RoomType;
  onChange: (value: RoomType) => void;
}

export default function RoomTypeSelector({ value, onChange }: RoomTypeSelectorProps) {
  const bedrooms = [1, 2, 3, 4, 5];
  const bathrooms = [1, 1.5, 2, 2.5, 3, 3.5, 4];
  
  const toggleRoomType = (type: keyof Pick<RoomType, 'private' | 'shared' | 'entirePlace'>) => {
    const newValue = { ...value };
    const isCurrentlyOn = newValue[type];
    const turningOn = !isCurrentlyOn;

    if (turningOn) {
      newValue[type] = true;
      if (type === 'private') {
        newValue.shared = false;
      } else if (type === 'shared') {
        newValue.private = false;
      }
    } else {
      const otherOptionsOn = (type === 'private' && (newValue.shared || newValue.entirePlace)) ||
                             (type === 'shared' && (newValue.private || newValue.entirePlace)) ||
                             (type === 'entirePlace' && (newValue.private || newValue.shared));

      if (otherOptionsOn) {
        newValue[type] = false;
      }
    }

    onChange(newValue);
  };
  
  const toggleBedroom = (number: number) => {
    const currentBedrooms = [...value.bedrooms];
    
    if (currentBedrooms.includes(number)) {
      if (currentBedrooms.length > 1) {
        onChange({ 
          ...value, 
          bedrooms: currentBedrooms.filter(b => b !== number).sort((a, b) => a - b) 
        });
      }
    } else {
      onChange({ 
        ...value, 
        bedrooms: [...currentBedrooms, number].sort((a, b) => a - b) 
      });
    }
  };
  
  const toggleBathroom = (number: number) => {
    const currentBathrooms = [...value.bathrooms];
    
    if (currentBathrooms.includes(number)) {
      if (currentBathrooms.length > 1) {
        onChange({ 
          ...value, 
          bathrooms: currentBathrooms.filter(b => b !== number).sort((a, b) => a - b) 
        });
      }
    } else {
      onChange({ 
        ...value, 
        bathrooms: [...currentBathrooms, number].sort((a, b) => a - b) 
      });
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Room Type</Text>
      
      <Text style={styles.sectionTitle}>I'm looking for:</Text>
      <View style={styles.optionsContainer}>
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Private Room</Text>
          <Switch
            value={value.private}
            onValueChange={() => toggleRoomType('private')}
            trackColor={{ false: COLORS.background.input, true: COLORS.secondary }}
            thumbColor={value.private ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Shared Room</Text>
          <Switch
            value={value.shared}
            onValueChange={() => toggleRoomType('shared')}
            trackColor={{ false: COLORS.background.input, true: COLORS.secondary }}
            thumbColor={value.shared ? '#fff' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.optionContainer, { borderBottomWidth: 0 }]}>
          <Text style={styles.optionLabel}>Entire Place</Text>
          <Switch
            value={value.entirePlace}
            onValueChange={() => toggleRoomType('entirePlace')}
            trackColor={{ false: COLORS.background.input, true: COLORS.secondary }}
            thumbColor={value.entirePlace ? '#fff' : '#f4f3f4'}
          />
        </View>
      </View>
      
      <Text style={styles.sectionTitle}>Number of Bedrooms</Text>
      <View style={styles.numberOptions}>
        {bedrooms.map(number => (
          <TouchableOpacity
            key={number}
            style={[
              styles.numberOption,
              value.bedrooms.includes(number) && styles.selectedNumberOption
            ]}
            onPress={() => toggleBedroom(number)}
          >
            <Text 
              style={[
                styles.numberOptionText,
                value.bedrooms.includes(number) && styles.selectedNumberOptionText
              ]}
            >
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <Text style={styles.sectionTitle}>Number of Bathrooms</Text>
      <View style={styles.numberOptions}>
        {bathrooms.map(number => (
          <TouchableOpacity
            key={number}
            style={[
              styles.numberOption,
              value.bathrooms.includes(number) && styles.selectedNumberOption
            ]}
            onPress={() => toggleBathroom(number)}
          >
            <Text 
              style={[
                styles.numberOptionText,
                value.bathrooms.includes(number) && styles.selectedNumberOptionText
              ]}
            >
              {number}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  optionsContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.1)',
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(67, 113, 203, 0.1)',
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
  },
  numberOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
  },
  numberOption: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.1)',
  },
  selectedNumberOption: {
    backgroundColor: COLORS.secondary,
  },
  numberOptionText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  selectedNumberOptionText: {
    color: '#000',
  },
}); 