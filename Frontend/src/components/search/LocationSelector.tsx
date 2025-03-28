import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LocationPreference } from '../../services/searchService';

interface LocationSelectorProps {
  value: LocationPreference;
  onChange: (value: LocationPreference) => void;
}

export default function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const [showCityInput, setShowCityInput] = useState(!!value.city);
  
  const radiusOptions = [1, 2, 5, 10, 15, 25, 50];
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Location Preferences</Text>
      
      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>Near campus</Text>
        <Switch
          value={value.nearCampus}
          onValueChange={(newValue) => onChange({ ...value, nearCampus: newValue })}
          trackColor={{ false: '#333', true: '#FFD700' }}
          thumbColor={value.nearCampus ? '#FFD700' : '#f4f3f4'}
        />
      </View>
      
      <TouchableOpacity 
        style={styles.cityInputContainer}
        onPress={() => setShowCityInput(true)}
      >
        {!showCityInput ? (
          <View style={styles.cityPlaceholder}>
            <Ionicons name="location-outline" size={20} color="#ccc" />
            <Text style={styles.cityPlaceholderText}>Specify a location</Text>
          </View>
        ) : (
          <TextInput
            style={styles.textInput}
            placeholder="Enter city or neighborhood"
            placeholderTextColor="#999"
            value={value.city}
            onChangeText={(text) => onChange({ ...value, city: text })}
            autoFocus={!value.city}
          />
        )}
      </TouchableOpacity>
      
      {showCityInput && (
        <>
          <Text style={styles.sectionLabel}>Search radius</Text>
          <View style={styles.radiusOptions}>
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  value.radius === radius && styles.selectedRadiusOption
                ]}
                onPress={() => onChange({ ...value, radius })}
              >
                <Text 
                  style={[
                    styles.radiusOptionText,
                    value.radius === radius && styles.selectedRadiusOptionText
                  ]}
                >
                  {radius} mi
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>State (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter state"
              placeholderTextColor="#999"
              value={value.state}
              onChangeText={(text) => onChange({ ...value, state: text })}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Zip code (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter zip code"
              placeholderTextColor="#999"
              value={value.zipCode}
              onChangeText={(text) => onChange({ ...value, zipCode: text })}
              keyboardType="numeric"
            />
          </View>
        </>
      )}
    </ScrollView>
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
  optionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
  },
  cityInputContainer: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cityPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  cityPlaceholderText: {
    color: '#ccc',
    marginLeft: 8,
    fontSize: 16,
  },
  textInput: {
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  radiusOption: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    marginBottom: 10,
  },
  selectedRadiusOption: {
    backgroundColor: '#FFD700',
  },
  radiusOptionText: {
    color: '#fff',
  },
  selectedRadiusOptionText: {
    color: '#000',
    fontWeight: 'bold',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
}); 