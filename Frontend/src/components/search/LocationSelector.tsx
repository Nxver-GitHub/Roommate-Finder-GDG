import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { LocationPreference } from '../../services/searchService';
import { FormLocationInput, LocationData } from '../../components/ui/FormLocationInput';

// Define UCSC campus location details
const UCSC_LOCATION: LocationData = {
  description: "University of California Santa Cruz, High Street, Santa Cruz, CA, USA",
  latitude: 36.9916,
  longitude: -122.0583,
  placeId: "ChIJd5aP0k7ljYARZbfMCVGjzFY", // This is Google's PlaceID for UCSC
};

// Default radius when "near campus" is enabled
const DEFAULT_NEAR_CAMPUS_RADIUS = 2; // 2 miles

interface LocationSelectorProps {
  value: LocationPreference;
  onChange: (value: LocationPreference) => void;
}

export default function LocationSelector({ value, onChange }: LocationSelectorProps) {
  const radiusOptions = [1, 2, 5, 10, 15, 25, 50];
  
  const handleLocationSelect = (locationData: LocationData) => {
    console.log("Location selected in LocationSelector:", locationData);
    onChange({
      ...value,
      description: locationData.description,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      // If user selects a new location, ensure nearCampus is turned off
      nearCampus: false,
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    onChange({ ...value, radius: value.radius === newRadius ? null : newRadius });
  };

  // Handler for the Near Campus toggle
  const handleNearCampusToggle = (isEnabled: boolean) => {
    if (isEnabled) {
      // When enabling "Near Campus", set location to UCSC and a default radius
      onChange({
        ...value,
        nearCampus: true,
        description: UCSC_LOCATION.description,
        latitude: UCSC_LOCATION.latitude,
        longitude: UCSC_LOCATION.longitude,
        radius: DEFAULT_NEAR_CAMPUS_RADIUS,
      });
    } else {
      // When disabling "Near Campus", only change the nearCampus flag
      onChange({
        ...value,
        nearCampus: false,
      });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Preferences</Text>
      
      <View style={styles.optionContainer}>
        <Text style={styles.optionLabel}>Near Campus</Text>
        <Switch
          value={value.nearCampus}
          onValueChange={handleNearCampusToggle}
          trackColor={{ false: '#333', true: '#FFD700' }}
          thumbColor={value.nearCampus ? '#FFD700' : '#f4f3f4'}
        />
      </View>
      
      {/* Only show search input if "Near Campus" is OFF */}
      {!value.nearCampus && (
        <FormLocationInput
          label="Search Location"
          placeholder="Enter city, neighborhood, or address"
          onLocationSelect={handleLocationSelect}
          currentValue={value.description || ''}
        />
      )}
      
      {/* Always show radius options when a location is selected (from search OR near campus) */}
      {value.description && (
        <>
          <Text style={styles.sectionLabel}>
            {value.nearCampus 
              ? "Search radius from campus" 
              : "Search radius from selected location"}
          </Text>
          <View style={styles.radiusOptions}>
            {radiusOptions.map((radius) => (
              <TouchableOpacity
                key={radius}
                style={[
                  styles.radiusOption,
                  value.radius === radius && styles.selectedRadiusOption
                ]}
                onPress={() => handleRadiusChange(radius)}
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
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
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
    paddingHorizontal: 5,
  },
  optionLabel: {
    fontSize: 16,
    color: '#fff',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 20,
    paddingHorizontal: 5,
  },
  radiusOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    paddingHorizontal: 5,
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
}); 