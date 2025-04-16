import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { RoomType } from '../../services/searchService';

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
            trackColor={{ false: '#333', true: '#FFD700' }}
            thumbColor={value.private ? '#FFD700' : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.optionContainer}>
          <Text style={styles.optionLabel}>Shared Room</Text>
          <Switch
            value={value.shared}
            onValueChange={() => toggleRoomType('shared')}
            trackColor={{ false: '#333', true: '#FFD700' }}
            thumbColor={value.shared ? '#FFD700' : '#f4f3f4'}
          />
        </View>
        
        <View style={[styles.optionContainer, { borderBottomWidth: 0 }]}>
          <Text style={styles.optionLabel}>Entire Place</Text>
          <Switch
            value={value.entirePlace}
            onValueChange={() => toggleRoomType('entirePlace')}
            trackColor={{ false: '#333', true: '#FFD700' }}
            thumbColor={value.entirePlace ? '#FFD700' : '#f4f3f4'}
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
    flex: 1,
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 12,
  },
  optionsContainer: {
    backgroundColor: '#232323',
    borderRadius: 8,
    padding: 8,
  },
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
  },
  numberOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  numberOption: {
    width: 46,
    height: 46,
    backgroundColor: '#333',
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 6,
  },
  selectedNumberOption: {
    backgroundColor: '#FFD700',
  },
  numberOptionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedNumberOptionText: {
    color: '#000',
  },
}); 