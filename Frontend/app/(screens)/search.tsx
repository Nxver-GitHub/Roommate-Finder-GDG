import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  SafeAreaView,
  StatusBar,
  Image,
  Animated,
  Easing,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { defaultFilters, SearchFilters, savedFilters } from '../../src/services/searchService';
import { formatCurrency } from '../../src/utils/formatters';
import SavedFilterItem from '../../src/components/search/SavedFilterItem';
import FilterModal from '../../src/components/search/FilterModal';
import { useFilters } from '../../src/contexts/FilterContext';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../src/utils/theme';
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
  const { width } = Dimensions.get('window');
  const { activeFilters, setActiveFilters, resetFilters } = useFilters();
  const [modalFilters, setModalFilters] = useState<SearchFilters>(activeFilters);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [mySavedFilters, setMySavedFilters] = useState(savedFilters);
  const [activeQuickFilters, setActiveQuickFilters] = useState<SpecificQuickFilterType[]>([]);
  const [activeSavedFilterId, setActiveSavedFilterId] = useState<string | null>(activeFilters.id || null);

  // New state for UI enhancements
  const [showTutorial, setShowTutorial] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(true);
  
  // Animation refs
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef<{ [key: string]: Animated.Value }>({
    all: new Animated.Value(1),
    nearCampus: new Animated.Value(1),
    under1000: new Animated.Value(1),
    privateRoom: new Animated.Value(1),
    availableNow: new Animated.Value(1)
  }).current;

  // Add these state and animation values at the beginning of the component
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;

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

  // Animation for scale effect
  const animateScale = (key: string) => {
    Animated.sequence([
      Animated.timing(scaleAnims[key], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[key], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Calculate shimmer translation for effect
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });
  
  // Calculate filter completeness (0-100%)
  const calculateFilterCompleteness = (): number => {
    let score = 0;
    const totalFactors = 10; // Increased number of factors to consider
    
    // Budget Range (0-1 points)
    if (activeFilters.budgetRange) {
      const hasMinBudget = activeFilters.budgetRange.min > defaultFilters.budgetRange.min;
      const hasMaxBudget = activeFilters.budgetRange.max < defaultFilters.budgetRange.max;
      if (hasMinBudget || hasMaxBudget) score += 1;
    }
    
    // Location (0-2 points)
    if (activeFilters.location) {
      if (activeFilters.location.nearCampus) score += 1;
      if (activeFilters.location.description && activeFilters.location.radius) score += 1;
    }
    
    // Room Type (0-2 points)
    if (activeFilters.roomType) {
      // Check if any specific room type is selected
      const hasSpecificRoomType = 
        !activeFilters.roomType.private ||
        !activeFilters.roomType.shared ||
        !activeFilters.roomType.entirePlace;
      if (hasSpecificRoomType) score += 1;
      
      // Check if specific bedroom count is selected
      const hasSpecificBedrooms = activeFilters.roomType.bedrooms.length < 4; // Less than all options
      if (hasSpecificBedrooms) score += 1;
    }
    
    // Move-in Dates (0-2 points)
    if (activeFilters.moveInDates) {
      const today = new Date();
      const hasEarliestDate = activeFilters.moveInDates.earliest > today;
      const hasLatestDate = activeFilters.moveInDates.latest < defaultFilters.moveInDates.latest;
      if (hasEarliestDate) score += 1;
      if (hasLatestDate) score += 1;
    }
    
    // Lifestyle Preferences (0-2 points)
    if (activeFilters.lifestyle) {
      const lifestylePreferences = [
        activeFilters.lifestyle.smoking,
        activeFilters.lifestyle.pets,
        activeFilters.lifestyle.drinking,
        activeFilters.lifestyle.visitors,
        activeFilters.lifestyle.cleanliness
      ];
      
      // Count how many lifestyle preferences are set
      const setPreferences = lifestylePreferences.filter(pref => pref !== null).length;
      if (setPreferences >= 2) score += 2;
      else if (setPreferences === 1) score += 1;
    }
    
    // Gender Preference (0-1 point)
    if (activeFilters.genderPreference !== 'Any') score += 1;
    
    return Math.round((score / totalFactors) * 100);
  };

  // Start shimmer animation
  useEffect(() => {
    // Start infinite shimmer animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
    
    // Hide tutorial after 5 seconds
    if (showTutorial) {
      setTimeout(() => {
        setShowTutorial(false);
      }, 5000);
    }
  }, []);

  // Calculate filter completeness
  const filterCompleteness = calculateFilterCompleteness();

  // Add these animation handlers
  const handlePressIn = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background.default} />
      
      {/* Logo header at the top like discover screen */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'transparent']}
          style={styles.logoGradient}
        >
          <Image 
            source={require('../../assets/images/logo.png')} 
            style={styles.centerLogo} 
            resizeMode="contain"
          />
        </LinearGradient>
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Roommates</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterModal}
        >
          <LinearGradient
            colors={[COLORS.secondary, '#E5B93C']} 
            style={styles.filterButtonGradient}
          >
            <Ionicons name="options-outline" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter completeness indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressLabel}>Filter Specificity</Text>
          <Text style={styles.progressPercentage}>{filterCompleteness}%</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${filterCompleteness}%` }]} />
        </View>
      </View>

      {/* First-time user tutorial tooltip */}
      {isFirstVisit && showTutorial && (
        <View style={styles.tooltipContainer}>
          <BlurView intensity={40} tint="dark" style={styles.tooltipBlur}>
            <Ionicons name="information-circle" size={20} color={COLORS.secondary} style={styles.tooltipIcon} />
            <Text style={styles.tooltipText}>
              Use quick filters to find roommates that match your preferences, or create custom filters
            </Text>
            <TouchableOpacity onPress={() => setShowTutorial(false)} style={styles.tooltipClose}>
              <Ionicons name="close" size={16} color={COLORS.text.secondary} />
            </TouchableOpacity>
          </BlurView>
        </View>
      )}

      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <LinearGradient
          colors={['rgba(31, 41, 55, 0.5)', 'rgba(31, 41, 55, 0.5)']}
          style={[styles.contentContainer, styles.cardBorder]}
        >
          <View style={styles.quickFiltersContainer}>
            <Text style={styles.sectionTitle}>Quick Filters</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={styles.quickFiltersScroll}
              contentContainerStyle={styles.quickFiltersContent}
            >
              {/* "All" Button */}
              <Animated.View style={{ transform: [{ scale: scaleAnims.all }] }}>
                <TouchableOpacity
                  key="all"
                  style={[styles.quickFilterChip, areAllQuickFiltersActive && styles.activeChip]}
                  onPress={handleToggleAllQuickFilters}
                >
                  <Text style={[styles.quickFilterText, areAllQuickFiltersActive && styles.activeChipText]}>
                    {quickFilterLabels.all}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Specific Filter Buttons */}
              {specificQuickFilterTypes.map(type => {
                const isActive = isQuickFilterActive(type);
                return (
                  <Animated.View key={type} style={{ transform: [{ scale: scaleAnims[type] }] }}>
                    <TouchableOpacity
                      style={[styles.quickFilterChip, isActive && styles.activeChip]}
                      onPress={() => handleToggleQuickFilter(type)}
                    >
                      <Text style={[styles.quickFilterText, isActive && styles.activeChipText]}>
                        {quickFilterLabels[type]}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.savedFiltersSection}>
            <Text style={styles.sectionTitle}>Saved Searches</Text>
            
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
                  Tap the filter button to create and save a new search
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ScrollView>

      <View style={styles.applyButtonContainer}>
        <Animated.View style={[
          styles.buttonAnimationContainer,
          {
            transform: [{ scale: buttonScaleAnim }]
          }
        ]}>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => router.push('/(screens)/')}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={1}
          >
            <LinearGradient
              colors={[COLORS.secondary, '#E5B93C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.applyButtonText}>View Matching Profiles</Text>
              
              {/* Shimmer effect */}
              <Animated.View 
                style={[
                  styles.shimmerEffect,
                  {
                    transform: [{ translateX }]
                  }
                ]}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <FilterModal
        visible={filterModalVisible}
        initialFilters={modalFilters}
        onClose={() => setFilterModalVisible(false)}
        onApply={handleApplyModalFilters}
        onSave={addNewSavedFilter}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  logoContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logoGradient: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: SPACING.md,
    alignItems: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  centerLogo: {
    width: 90,
    height: 48,
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'transparent',
    zIndex: 2,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    flex: 1,
    textAlign: 'center',
  },
  filterButton: {
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  filterButtonGradient: {
    padding: 10,
    borderRadius: BORDER_RADIUS.full,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.md,
  },
  contentContainer: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  cardBorder: {
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.15)',
    shadowColor: COLORS.secondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    borderRightColor: 'rgba(0, 0, 0, 0.15)',
    borderBottomColor: 'rgba(0, 0, 0, 0.15)',
  },
  quickFiltersContainer: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(67, 113, 203, 0.1)',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
  },
  quickFiltersScroll: {
    flexDirection: 'row',
  },
  quickFiltersContent: {
    paddingVertical: SPACING.xs,
    paddingRight: SPACING.md,
  },
  quickFilterChip: {
    backgroundColor: 'rgba(51, 51, 51, 0.7)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(51, 51, 51, 0.9)',
    ...SHADOWS.sm,
  },
  activeChip: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  quickFilterText: {
    color: COLORS.text.primary,
    fontWeight: '500',
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  activeChipText: {
    color: '#000',
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(67, 113, 203, 0.1)',
    marginHorizontal: SPACING.lg,
  },
  savedFiltersSection: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyStateText: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.secondary,
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  applyButtonContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background.default,
  },
  buttonAnimationContainer: {
    width: '100%',
    ...SHADOWS.lg,
  },
  applyButton: {
    width: '100%',
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  applyButtonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: TYPOGRAPHY.fontSize.lg,
    letterSpacing: 0.5,
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
    width: 60,
  },
  progressContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressLabel: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  progressPercentage: {
    color: COLORS.text.accent,
    fontSize: TYPOGRAPHY.fontSize.xs,
    fontWeight: 'bold',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.xs,
  },
  tooltipContainer: {
    paddingHorizontal: SPACING.md,
    position: 'absolute',
    top: 130,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tooltipBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(240, 210, 100, 0.3)',
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
  },
  tooltipIcon: {
    marginRight: SPACING.sm,
  },
  tooltipText: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
  tooltipClose: {
    padding: 4,
  },
});