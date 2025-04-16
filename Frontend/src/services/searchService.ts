export interface LocationPreference {
  nearCampus: boolean;
  description: string | null; // Store the selected place description
  latitude?: number;         // Optional latitude
  longitude?: number;        // Optional longitude
  radius: number | null;     // Keep radius (nullable for when none is selected)
  // Removed city, state, zipCode
}

export interface RoomType {
  private: boolean;
  shared: boolean;
  entirePlace: boolean;
  bedrooms: number[];
  bathrooms: number[];
}

export interface LifestylePreference {
  smoking: boolean | null;
  pets: boolean | null;
  drinking: boolean | null;
  partying: boolean | null;
  visitors: boolean | null;
  cleanliness: number | null; // 1-5 scale
}

export interface SearchFilters {
  id?: string; // Used for saved filters
  name?: string; // Used for saved filters
  budgetRange: {
    min: number;
    max: number;
  };
  location: LocationPreference;
  moveInDates: {
    earliest: Date;
    latest: Date;
  };
  roomType: RoomType;
  lifestyle: LifestylePreference;
  genderPreference: 'Male' | 'Female' | 'Any';
}

// Update defaultFilters location structure
export const defaultFilters: SearchFilters = {
  budgetRange: {
    min: 500,
    max: 2000,
  },
  location: {
    nearCampus: false,
    description: null,      // Use description instead of city
    radius: null,           // Default radius to null
    latitude: undefined,    // Add latitude
    longitude: undefined,   // Add longitude
  },
  moveInDates: {
    earliest: new Date(),
    latest: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
  },
  roomType: {
    private: true,
    shared: true,
    entirePlace: true,
    bedrooms: [1, 2, 3, 4],
    bathrooms: [1, 2, 3],
  },
  lifestyle: {
    smoking: null, // null means "doesn't matter"
    pets: null,
    drinking: null,
    partying: null,
    visitors: null,
    cleanliness: null,
  },
  genderPreference: 'Any',
};

// Update savedFilters mock data structure
export const savedFilters: SearchFilters[] = [
  {
    id: '1',
    name: 'Campus Housing',
    budgetRange: {
      min: 600,
      max: 900,
    },
    location: {
      // Replace city with description
      description: 'Near UT Austin Campus, Austin, TX, USA',
      radius: 2,
      nearCampus: true,
      // Optionally add mock coordinates
      // latitude: 30.2849,
      // longitude: -97.7341
    },
    moveInDates: {
      earliest: new Date('2024-08-01'),
      latest: new Date('2024-08-15'),
    },
    roomType: {
      private: true,
      shared: false,
      entirePlace: false,
      bedrooms: [1],
      bathrooms: [1],
    },
    lifestyle: {
      smoking: false,
      pets: null,
      drinking: null,
      partying: null,
      visitors: null,
      cleanliness: 4,
    },
    genderPreference: 'Any',
  },
  {
    id: '2',
    name: 'Downtown Apartment',
    budgetRange: {
      min: 1200,
      max: 1800,
    },
    location: {
      // Replace city with description
      description: 'Downtown Austin, Austin, TX, USA',
      radius: 5,
      nearCampus: false,
      // Optionally add mock coordinates
      // latitude: 30.2672,
      // longitude: -97.7431
    },
    moveInDates: {
      earliest: new Date('2024-07-01'),
      latest: new Date('2024-08-30'),
    },
    roomType: {
      private: false,
      shared: false,
      entirePlace: true,
      bedrooms: [2],
      bathrooms: [2],
    },
    lifestyle: {
      smoking: false,
      pets: true,
      drinking: null,
      partying: null,
      visitors: true,
      cleanliness: 3,
    },
    genderPreference: 'Any',
  },
];

// Simulate saving a new filter
export const saveFilter = (filter: SearchFilters, name: string): SearchFilters => {
  const newFilter = {
    ...filter,
    id: Date.now().toString(),
    name,
  };

  // In a real app, you would save this to Firebase
  // For now, we'll just return the new filter
  return newFilter;
};

// Simulate applying filters to search results
export const applyFilters = (filters: SearchFilters) => {
  // This would connect to your backend to fetch filtered results
  console.log('Applying filters:', filters);
  return [];
};