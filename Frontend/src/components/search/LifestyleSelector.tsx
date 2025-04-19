import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LifestylePreference } from '../../services/searchService';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../utils/theme';

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
    if (preference === null) return COLORS.text.secondary;
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
          style={[styles.preferenceItem, { borderBottomWidth: 0 }]}
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
    padding: SPACING.xs,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  preferencesContainer: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.1)',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(67, 113, 203, 0.1)',
  },
  preferenceTextContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  preferenceLabel: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  cleanlinessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  cleanlinessOption: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.1)',
  },
  selectedCleanlinessOption: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  cleanlinessText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    fontWeight: 'bold',
  },
  selectedCleanlinessText: {
    color: '#000',
  },
  cleanlinessLabel: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.sm,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: SPACING.md,
  },
}); 