import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LifestylePreference } from '../../services/searchService';

interface LifestyleSelectorProps {
  value: LifestylePreference;
  onChange: (value: LifestylePreference) => void;
}

export default function LifestyleSelector({ value, onChange }: LifestyleSelectorProps) {
  // Helper function to toggle between true, false, and null (doesn't matter)
  const togglePreference = (key: keyof Omit<LifestylePreference, 'cleanliness'>) => {
    let newValue: boolean | null;
    if (value[key] === null) {
      newValue = true;
    } else if (value[key] === true) {
      newValue = false;
    } else {
      newValue = null;
    }
    onChange({ ...value, [key]: newValue });
  };
  
  const getPreferenceText = (preference: boolean | null): string => {
    if (preference === null) return "Doesn't Matter";
    return preference ? "Yes" : "No";
  };
  
  const getPreferenceIcon = (preference: boolean | null): string => {
    if (preference === null) return "remove-circle-outline";
    return preference ? "checkmark-circle-outline" : "close-circle-outline";
  };
  
  const getPreferenceColor = (preference: boolean | null): string => {
    if (preference === null) return "#ccc";
    return preference ? "#4CAF50" : "#f44336";
  };
  
  const cleanlinessLabels = [
    "Doesn't Matter",
    "Very Relaxed",
    "Somewhat Relaxed",
    "Average",
    "Somewhat Tidy",
    "Very Tidy"
  ];
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lifestyle Preferences</Text>
      
      <Text style={styles.description}>
        Select your preferences for potential roommates.
        Selecting "Doesn't Matter" will show all options.
      </Text>
      
      <View style={styles.preferencesContainer}>
        <TouchableOpacity
          style={styles.preferenceItem}
          onPress={() => togglePreference('smoking')}
        >
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceLabel}>Smoking</Text>
            <Text 
              style={[
                styles.preferenceValue,
                { color: getPreferenceColor(value.smoking) }
              ]}
            >
              {getPreferenceText(value.smoking)}
            </Text>
          </View>
          <Ionicons 
            name={getPreferenceIcon(value.smoking)} 
            size={24} 
            color={getPreferenceColor(value.smoking)} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.preferenceItem}
          onPress={() => togglePreference('pets')}
        >
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceLabel}>Pets</Text>
            <Text 
              style={[
                styles.preferenceValue,
                { color: getPreferenceColor(value.pets) }
              ]}
            >
              {getPreferenceText(value.pets)}
            </Text>
          </View>
          <Ionicons 
            name={getPreferenceIcon(value.pets)} 
            size={24} 
            color={getPreferenceColor(value.pets)} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.preferenceItem}
          onPress={() => togglePreference('drinking')}
        >
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceLabel}>Drinking</Text>
            <Text 
              style={[
                styles.preferenceValue,
                { color: getPreferenceColor(value.drinking) }
              ]}
            >
              {getPreferenceText(value.drinking)}
            </Text>
          </View>
          <Ionicons 
            name={getPreferenceIcon(value.drinking)} 
            size={24} 
            color={getPreferenceColor(value.drinking)} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.preferenceItem}
          onPress={() => togglePreference('partying')}
        >
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceLabel}>Partying</Text>
            <Text 
              style={[
                styles.preferenceValue,
                { color: getPreferenceColor(value.partying) }
              ]}
            >
              {getPreferenceText(value.partying)}
            </Text>
          </View>
          <Ionicons 
            name={getPreferenceIcon(value.partying)} 
            size={24} 
            color={getPreferenceColor(value.partying)} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.preferenceItem}
          onPress={() => togglePreference('visitors')}
        >
          <View style={styles.preferenceTextContainer}>
            <Text style={styles.preferenceLabel}>Frequent Visitors</Text>
            <Text 
              style={[
                styles.preferenceValue,
                { color: getPreferenceColor(value.visitors) }
              ]}
            >
              {getPreferenceText(value.visitors)}
            </Text>
          </View>
          <Ionicons 
            name={getPreferenceIcon(value.visitors)} 
            size={24} 
            color={getPreferenceColor(value.visitors)} 
          />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Cleanliness</Text>
      <View style={styles.cleanlinessContainer}>
        {Array.from({ length: 6 }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.cleanlinessOption,
              value.cleanliness === index ? styles.selectedCleanlinessOption : null
            ]}
            onPress={() => onChange({ ...value, cleanliness: index === value.cleanliness ? null : index })}
          >
            <Text 
              style={[
                styles.cleanlinessText,
                value.cleanliness === index ? styles.selectedCleanlinessText : null
              ]}
            >
              {index === 0 ? "?" : index}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.cleanlinessLabel}>
        {value.cleanliness === null ? cleanlinessLabels[0] : cleanlinessLabels[value.cleanliness]}
      </Text>
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
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
  },
  preferencesContainer: {
    backgroundColor: '#232323',
    borderRadius: 8,
    marginBottom: 24,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  preferenceTextContainer: {
    flex: 1,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 4,
  },
  preferenceValue: {
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  cleanlinessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cleanlinessOption: {
    width: 40,
    height: 40,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCleanlinessOption: {
    backgroundColor: '#FFD700',
  },
  cleanlinessText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedCleanlinessText: {
    color: '#000',
  },
  cleanlinessLabel: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
}); 