import React, { useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { GooglePlacesAutocomplete, GooglePlaceData, GooglePlaceDetail } from 'react-native-google-places-autocomplete';

// Define the structure of the data we want to pass back via onChange
export interface LocationData {
  description: string; // The formatted address string
  placeId?: string; // Google Place ID
  latitude?: number;
  longitude?: number;
}

interface FormLocationInputProps {
  label: string;
  placeholder?: string;
  onLocationSelect: (location: LocationData) => void; // Callback with structured data
  error?: string;
  currentValue?: string; // Optional initial text value
}

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;

if (!GOOGLE_PLACES_API_KEY) {
  console.error("ERROR: EXPO_PUBLIC_GOOGLE_PLACES_API_KEY is not defined in your .env file!");
  // You might want to throw an error or display a message in the UI in a real app
}

export function FormLocationInput({
  label,
  placeholder = 'Enter location',
  onLocationSelect,
  error,
  currentValue = '',
}: FormLocationInputProps) {

  // Create a ref for the GooglePlacesAutocomplete component
  const placesRef = useRef<GooglePlacesAutocomplete | null>(null);

  const handlePress = (data: GooglePlaceData, detail: GooglePlaceDetail | null = null) => {
    // Extract relevant information
    const locationInfo: LocationData = {
      description: data.description,
      placeId: data.place_id,
      latitude: detail?.geometry?.location?.lat,
      longitude: detail?.geometry?.location?.lng,
    };
    console.log('Selected Location:', locationInfo); // Log the structured data
    onLocationSelect(locationInfo); // Pass the structured data back
  };

  // Use useEffect to update the input text when currentValue changes
  useEffect(() => {
    // Check if the ref exists and the currentValue is different from the current input text
    // Using optional chaining and checking for the setAddressText method
    if (placesRef.current && typeof placesRef.current.setAddressText === 'function') {
       // Only update if the current visible text doesn't match the prop value
       // Note: Getting the current text might be tricky/unavailable, so we often just set it.
       // Be slightly careful here if the user could be typing *while* the prop changes.
       placesRef.current.setAddressText(currentValue);
    }
     // Run this effect whenever the 'currentValue' prop changes
  }, [currentValue]);

  // Determine border color based on error state
  const inputBorderColor = error ? '#FF4444' : '#444';

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <GooglePlacesAutocomplete
        ref={placesRef}
        placeholder={placeholder}
        onPress={handlePress}
        query={{
          key: GOOGLE_PLACES_API_KEY,
          language: 'en', // language of the results
        }}
        fetchDetails={true} // Fetch full place details (needed for geometry/coordinates)
        onFail={(apiError) => console.error('Google Places API Error:', apiError)}
        textInputProps={{
          style: [styles.textInputCore, { borderColor: inputBorderColor }],
          placeholderTextColor: '#888',
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          separator: styles.separator,
          poweredContainer: styles.poweredContainer, // Add styling for Google attribution footer
        }}
        debounce={200}
        keyboardShouldPersistTaps='handled'
        enablePoweredByContainer={true} // Keep Google attribution for compliance
        listViewDisplayed={false} // Initially hide the list view
        minLength={2} // Only search after 2 characters to reduce unnecessary API calls
        suppressDefaultStyles={false} // Keep default styles alongside our custom ones
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// Updated styling with fixes for the dropdown list
const styles = StyleSheet.create({
  container: {
    marginBottom: 80, // Increase bottom margin to make room for dropdown without overlapping
    zIndex: 1, // Ensure container has a modest z-index
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  autocompleteContainer: {
    zIndex: 2, // Higher than container but lower than dropdown
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    zIndex: 3,
    // Ensure the container doesn't artificially restrict width
    // width: '100%', // Usually not needed, flexbox handles it
  },
  textInputCore: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#FFFFFF',
    borderWidth: 1,
    minHeight: 48,
    // Remove textAlignVertical to see if it affects layout/scrolling
    // textAlignVertical: 'center',
    // Explicitly set width to 100% to ensure it uses container width
    width: '100%',
  },
  listView: {
    backgroundColor: '#444',
    borderColor: '#555',
    borderWidth: 1,
    borderRadius: 8,
    position: 'absolute',
    // Adjust top based on label height (~24) + input minHeight (48) + margin (8)
    top: 80,
    left: 0,
    right: 0,
    maxHeight: 200,
    zIndex: 9999,
    overflow: 'scroll',
    marginBottom: 10,
  },
  row: {
    backgroundColor: '#444',
    padding: 13,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    color: '#FFFFFF',
    fontSize: 15,
    flexShrink: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#555',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    marginTop: 4,
  },
  poweredContainer: {
    backgroundColor: '#444', // Match the listView background
    justifyContent: 'flex-end', // Position at the bottom
    padding: 5,
  },
}); 