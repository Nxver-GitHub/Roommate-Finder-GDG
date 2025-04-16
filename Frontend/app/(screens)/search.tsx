import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { defaultFilters, SearchFilters, savedFilters } from '../../src/services/searchService';
import { formatCurrency } from '../../src/utils/formatters';
import SavedFilterItem from '../../src/components/search/SavedFilterItem';
import FilterModal from '../../src/components/search/FilterModal';
import { useFilters } from '../../src/contexts/FilterContext';
import BudgetRangeSelector from './BudgetRangeSelector';

// Define specific quick filter types (excluding 'all')
type SpecificQuickFilterType = 'nearCampus' | 'under1000' | 'privateRoom' | 'availableNow';
const specificQuickFilterTypes: SpecificQuickFilterType[] = ['nearCampus', 'under1000', 'privateRoom', 'availableNow'];

// Define labels for quick filters
const quickFilterLabels: Record<SpecificQuickFilterType | 'all', string> = {
  all: 'All',
  nearCampus: 'Near Campus',
  under1000: 'Under $1000',
  privateRoom: 'Private Room',
  availableNow: 'Available Now'
};

// Add the UCSC location constant to search.tsx at the top of the file (after imports)
const UCSC_LOCATION = {
  description: "University of California Santa Cruz, High Street, Santa Cruz, CA, USA",
  latitude: 36.9916,
  longitude: -122.0583,
};

export default function SearchScreen() {
  const router = useRouter();
  const { activeFilters, setActiveFilters, resetFilters } = useFilters();
  const [modalFilters, setModalFilters] = useState<SearchFilters>(activeFilters);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mySavedFilters, setMySavedFilters] = useState(savedFilters);
  const [activeQuickFilters, setActiveQuickFilters] = useState<SpecificQuickFilterType[]>([]);
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(activeFilters.id || null);

  useEffect(() => {
    setModalFilters(activeFilters);
    setActiveSavedFilterId(activeFilters.id || null);

    if (activeFilters.id) {
      // If a saved filter is active, clear quick filters
      setActiveQuickFilters([]);
    } else {
      // Otherwise, derive active quick filters from the activeFilters properties
      const derivedQuickFilters: SpecificQuickFilterType[] = [];

      // Check 'nearCampus'
      // Note: This assumes 'nearCampus: true' means the quick filter should be active,
      // even if other filters were also changed via the modal.
      if (activeFilters.location?.nearCampus === true) {
        derivedQuickFilters.push('nearCampus');
      }

      // Check 'under1000'
      if (activeFilters.budgetRange?.max === 1000 && activeFilters.budgetRange?.min === 0) {
         // Only activate if *both* min and max match the quick filter criteria
         // to avoid activating it if only max is 1000 but min is different.
        derivedQuickFilters.push('under1000');
      }

      // Check 'privateRoom'
      if (
        activeFilters.roomType?.private === true &&
        activeFilters.roomType?.shared === false &&
        activeFilters.roomType?.entirePlace === false
      ) {
        derivedQuickFilters.push('privateRoom');
      }

      // Check 'availableNow'
      const today = new Date();
      const oneMonth = new Date();
      oneMonth.setMonth(today.getMonth() + 1);

      if (activeFilters.moveInDates?.earliest && activeFilters.moveInDates?.latest) {
        // Create a temp filter just to get the date range for 'availableNow'
        const tempAvailableNowFilter = calculateFiltersFromQuickFilters(['availableNow']);
        
        // Compare dates by checking if they're on the same day
        const isSameDay = (date1: Date, date2: Date) => {
          return date1.getFullYear() === date2.getFullYear() &&
                 date1.getMonth() === date2.getMonth() &&
                 date1.getDate() === date2.getDate();
        };
        
        // Check if earliest dates are on the same day and 
        // latest dates are within a reasonable range (1 day)
        const earliestDate = new Date(activeFilters.moveInDates.earliest);
        const latestDate = new Date(activeFilters.moveInDates.latest);
        
        if (isSameDay(earliestDate, today) && 
            Math.abs(latestDate.getTime() - oneMonth.getTime()) < 24 * 60 * 60 * 1000) {
          derivedQuickFilters.push('availableNow');
        }
      }

      // Avoid duplicates if multiple conditions somehow overlap
      const uniqueDerivedQuickFilters = Array.from(new Set(derivedQuickFilters));

      // Update the state only if it has changed
      if (JSON.stringify(uniqueDerivedQuickFilters.sort()) !== JSON.stringify(activeQuickFilters.sort())) {
        setActiveQuickFilters(uniqueDerivedQuickFilters);
      }
    }

  }, [activeFilters]); // Keep dependency only on activeFilters

  // --- Helper function to calculate filters based on active quick filters ---
  const calculateFiltersFromQuickFilters = (quickFilters: SpecificQuickFilterType[]): SearchFilters => {
    // Deep clone defaultFilters to avoid mutation issues
    const newFilter = JSON.parse(JSON.stringify(defaultFilters));

    // Apply modifications based on active quick filters
    quickFilters.forEach(type => {
      switch (type) {
        case 'nearCampus':
          // Set the full UCSC location data
          newFilter.location = { 
            ...newFilter.location, 
            nearCampus: true,
            description: UCSC_LOCATION.description,
            latitude: UCSC_LOCATION.latitude,
            longitude: UCSC_LOCATION.longitude,
            radius: 2, // Default campus radius
          };
          break;
        case 'under1000':
          // Ensure budgetRange exists before modifying
          newFilter.budgetRange = { ...newFilter.budgetRange, min: 0, max: 1000 };
          break;
        case 'privateRoom':
          // Update the roomType for the private room quick filter
          newFilter.roomType = { 
              ...newFilter.roomType, 
              private: true, 
              shared: false, 
              entirePlace: false, 
              // Keep all bedroom and bathroom options by default
              // This is more flexible for users than restricting to specific counts
              bedrooms: [1, 2, 3, 4, 5],  // All bedroom options
              bathrooms: [1, 1.5, 2, 2.5, 3, 3.5, 4]  // All bathroom options
          };
          break;
        case 'availableNow':
          const today = new Date();
          const oneMonth = new Date();
          oneMonth.setMonth(today.getMonth() + 1);
          
          // Make sure we create new Date objects to avoid reference issues
          newFilter.moveInDates = { 
              earliest: new Date(today),
              latest: new Date(oneMonth)
          };
          break;
      }
    });
    
    return newFilter;
  };

  const applySavedFilter = (filter: SearchFilters) => {
    setActiveFilters(filter);
    setActiveSavedFilterId(filter.id || null);
    setActiveQuickFilters([]); // Clear quick filters when applying saved filter
  };

  const handleApplyModalFilters = (filtersFromModal: SearchFilters) => {
    const matchingSavedFilter = mySavedFilters.find(sf =>
        JSON.stringify({...sf, id: undefined, name: undefined}) === JSON.stringify({...filtersFromModal, id: undefined, name: undefined})
    );
    const filtersToApply = {
        ...filtersFromModal,
        id: matchingSavedFilter?.id,
        name: matchingSavedFilter?.name
    };

    setActiveFilters(filtersToApply);
    setActiveSavedFilterId(filtersToApply.id || null);
    setActiveQuickFilters([]); // Clear quick filters when applying modal filters
    setFilterModalVisible(false);
  };

  const addNewSavedFilter = (filter: SearchFilters, name: string) => {
    const filterToSave = { ...filter };
    delete filterToSave.id;
    delete filterToSave.name;

    const newFilter = {
      ...filterToSave,
      id: Date.now().toString(),
      name,
    };
    setMySavedFilters([...mySavedFilters, newFilter]);
    return newFilter;
  };

  const deleteSavedFilter = (id: string) => {
    setMySavedFilters(mySavedFilters.filter(filter => filter.id !== id));
    if (activeFilters.id === id) {
        // Use the resetFilters function from the context if available
        if (resetFilters) {
            resetFilters(); // This should reset activeFilters to defaultFilters in the context
        } else {
             // Fallback if resetFilters is not provided by the context
            setActiveFilters(defaultFilters);
        }
        // No need to manually clear quick filters here, the useEffect will handle it
        // when activeFilters updates to the default state (without an ID).
    }
  };

  const openFilterModal = () => {
    setModalFilters(activeFilters);
    setFilterModalVisible(true);
  };

  const formatFilterSummary = (filter: SearchFilters) => {
    const budgetMin = filter.budgetRange?.min ?? 0;
    const budgetMax = filter.budgetRange?.max ?? Infinity;
    
    // Use description field instead of city for location display
    let locationDisplay = 'Any location';
    if (filter.location?.nearCampus) {
      locationDisplay = 'Near UCSC';
    } else if (filter.location?.description) {
      // Shorten the description if it's too long
      locationDisplay = filter.location.description.length > 25 
        ? filter.location.description.substring(0, 22) + '...' 
        : filter.location.description;
    }
    
    return `${formatCurrency(budgetMin)}-${formatCurrency(budgetMax)} • ${locationDisplay}`;
  };

  // --- Updated handler for specific quick filters ---
  const handleToggleQuickFilter = (filterType: SpecificQuickFilterType) => {
    const currentlyActive = activeQuickFilters.includes(filterType);
    const nextActiveQuickFilters = currentlyActive
        ? activeQuickFilters.filter(qf => qf !== filterType)
        : [...activeQuickFilters, filterType];

    setActiveQuickFilters(nextActiveQuickFilters);
    const newFilter = calculateFiltersFromQuickFilters(nextActiveQuickFilters);
    setActiveFilters(newFilter);
    setActiveSavedFilterId(null); // Clear saved filter selection
  };

  // --- New handler for the "All" quick filter ---
  const handleToggleAllQuickFilters = () => {
    const allAreActive = activeQuickFilters.length === specificQuickFilterTypes.length;
    const nextActiveQuickFilters = allAreActive ? [] : [...specificQuickFilterTypes];

    setActiveQuickFilters(nextActiveQuickFilters);
    const newFilter = calculateFiltersFromQuickFilters(nextActiveQuickFilters);
    setActiveFilters(newFilter);
    setActiveSavedFilterId(null); // Clear saved filter selection
  };

  // --- Updated check for active state ---
  const isQuickFilterActive = (type: SpecificQuickFilterType) => {
       return activeQuickFilters.includes(type);
   }

  const areAllQuickFiltersActive = activeQuickFilters.length === specificQuickFilterTypes.length;

  // Enhanced toggle logic for room type options
  const toggleRoomType = (type: keyof Pick<RoomType, 'private' | 'shared' | 'entirePlace'>) => {
    // Make a copy of the current value to avoid mutation issues
    const newValue = { ...value };
    
    // Toggle the selected option
    newValue[type] = !newValue[type];
    
    // Handle mutual exclusivity logic:
    if (type === 'entirePlace' && newValue.entirePlace) {
      // If "Entire Place" is selected, disable "Private Room" and "Shared Room"
      newValue.private = false;
      newValue.shared = false;
    } else if ((type === 'private' || type === 'shared') && (newValue.private || newValue.shared)) {
      // If either "Private Room" or "Shared Room" is selected, disable "Entire Place"
      newValue.entirePlace = false;
    }
    
    // Ensure at least one option is selected
    if (!newValue.private && !newValue.shared && !newValue.entirePlace) {
      // If trying to unselect the last option, keep it selected
      newValue[type] = true;
    }
    
    // Apply the changes
    onChange(newValue);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Roommates</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterModal}
        >
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.quickFiltersContainer}>
        <Text style={styles.sectionTitle}>Quick Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersScroll}>
          {/* "All" Button */}
          <TouchableOpacity
             key="all"
             style={[styles.quickFilterChip, areAllQuickFiltersActive && styles.activeChip]}
             onPress={handleToggleAllQuickFilters}
          >
             <Text style={[styles.quickFilterText, areAllQuickFiltersActive && styles.activeChipText]}>{quickFilterLabels.all}</Text>
          </TouchableOpacity>

          {/* Specific Filter Buttons */}
          {specificQuickFilterTypes.map(type => {
             const isActive = isQuickFilterActive(type);
             return (
                 <TouchableOpacity
                    key={type}
                    style={[styles.quickFilterChip, isActive && styles.activeChip]}
                    onPress={() => handleToggleQuickFilter(type)}
                 >
                    <Text style={[styles.quickFilterText, isActive && styles.activeChipText]}>{quickFilterLabels[type]}</Text>
                 </TouchableOpacity>
             );
          })}
        </ScrollView>
      </View>

      <View style={styles.savedFiltersContainer}>
        <Text style={styles.sectionTitle}>Saved Searches</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {mySavedFilters.map(filter => (
            <SavedFilterItem
              key={filter.id}
              filter={filter}
              isActive={activeSavedFilterId === filter.id}
              onApply={() => applySavedFilter(filter)}
              onDelete={() => deleteSavedFilter(filter.id!)}
              summary={formatFilterSummary(filter)}
            />
          ))}
          {mySavedFilters.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No saved searches yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap Filters to create and save a new search
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <View style={styles.applyButtonContainer}>
        <TouchableOpacity style={styles.applyButton} onPress={() => router.push('/(screens)/')}>
          <Text style={styles.applyButtonText}>View New Profiles</Text>
        </TouchableOpacity>
      </View>

      <FilterModal
        visible={filterModalVisible}
        initialFilters={modalFilters}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyModalFilters}
        onSave={addNewSavedFilter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginLeft: -24,
  },
  filterButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 20,
  },
  quickFiltersContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  quickFiltersScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  quickFilterChip: {
    backgroundColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  activeChip: {
    backgroundColor: '#FFD700',
  },
  quickFilterText: {
    color: '#fff',
    fontWeight: '500',
  },
  activeChipText: {
    color: '#000',
  },
  savedFiltersContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccc',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  applyButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  applyButton: {
    backgroundColor: '#0891b2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});