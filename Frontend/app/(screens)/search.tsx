import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { defaultFilters, SearchFilters, savedFilters } from '../../src/services/searchService';
import { formatCurrency } from '../../src/utils/formatters';
import SavedFilterItem from '../../src/components/search/SavedFilterItem';
import FilterModal from '../../src/components/search/FilterModal';

export default function SearchScreen() {
  const router = useRouter();
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>(defaultFilters);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [mySavedFilters, setMySavedFilters] = useState(savedFilters);

  const applyFilter = (filter: SearchFilters) => {
    setCurrentFilters(filter);
    setActiveFilter(filter.id || null);
    // In a real app, this would navigate to the results screen
    console.log('Applying filter:', filter);
  };

  const addNewSavedFilter = (filter: SearchFilters, name: string) => {
    const newFilter = {
      ...filter,
      id: Date.now().toString(),
      name,
    };
    setMySavedFilters([...mySavedFilters, newFilter]);
    return newFilter;
  };

  const deleteSavedFilter = (id: string) => {
    setMySavedFilters(mySavedFilters.filter(filter => filter.id !== id));
    if (activeFilter === id) {
      setActiveFilter(null);
    }
  };

  const formatFilterSummary = (filter: SearchFilters) => {
    return `${formatCurrency(filter.budgetRange.min)}-${formatCurrency(filter.budgetRange.max)} • ${filter.location.city || 'Any location'}`;
  };

  const handleApplyQuickFilter = (filterType: string) => {
    let newFilter = {...currentFilters};
    
    switch(filterType) {
      case 'nearCampus':
        newFilter.location.nearCampus = true;
        break;
      case 'under1000':
        newFilter.budgetRange.max = 1000;
        break;
      case 'privateRoom':
        newFilter.roomType.private = true;
        newFilter.roomType.shared = false;
        newFilter.roomType.entirePlace = false;
        break;
      case 'availableNow':
        const today = new Date();
        const oneMonth = new Date();
        oneMonth.setMonth(today.getMonth() + 1);
        newFilter.moveInDates = {
          earliest: today,
          latest: oneMonth
        };
        break;
    }
    
    setCurrentFilters(newFilter);
    setActiveFilter(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Roommates</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons name="options-outline" size={24} color="#fff" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickFiltersContainer}>
        <Text style={styles.sectionTitle}>Quick Filters</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFiltersScroll}>
          <TouchableOpacity 
            style={[styles.quickFilterChip, !activeFilter && styles.activeChip]}
            onPress={() => {
              setCurrentFilters(defaultFilters);
              setActiveFilter(null);
            }}
          >
            <Text style={[styles.quickFilterText, !activeFilter && styles.activeChipText]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickFilterChip}
            onPress={() => handleApplyQuickFilter('nearCampus')}
          >
            <Text style={styles.quickFilterText}>Near Campus</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickFilterChip}
            onPress={() => handleApplyQuickFilter('under1000')}
          >
            <Text style={styles.quickFilterText}>Under $1000</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickFilterChip}
            onPress={() => handleApplyQuickFilter('privateRoom')}
          >
            <Text style={styles.quickFilterText}>Private Room</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickFilterChip}
            onPress={() => handleApplyQuickFilter('availableNow')}
          >
            <Text style={styles.quickFilterText}>Available Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View style={styles.savedFiltersContainer}>
        <Text style={styles.sectionTitle}>Saved Searches</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {mySavedFilters.map(filter => (
            <SavedFilterItem
              key={filter.id}
              filter={filter}
              isActive={activeFilter === filter.id}
              onApply={() => applyFilter(filter)}
              onDelete={() => deleteSavedFilter(filter.id!)}
              summary={formatFilterSummary(filter)}
            />
          ))}

          {mySavedFilters.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bookmark-outline" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No saved searches yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Save your search filters to quickly access them later
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      <FilterModal
        visible={filterModalVisible}
        initialFilters={currentFilters}
        onClose={() => setFilterModalVisible(false)}
        onApply={(filters) => {
          setCurrentFilters(filters);
          setFilterModalVisible(false);
          // In a real app, we would navigate to the results screen
          console.log('Applied filters:', filters);
        }}
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
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
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
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
  },
});