import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput,
  Platform,
  Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SearchFilters, defaultFilters } from '../../services/searchService';
import BudgetRangeSelector from './BudgetRangeSelector';
import LocationSelector from './LocationSelector';
import DateRangeSelector from './DateRangeSelector';
import RoomTypeSelector from './RoomTypeSelector';
import LifestyleSelector from './LifestyleSelector';
import GenderSelector from './GenderSelector';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from '../../utils/theme';

interface FilterModalProps {
  visible: boolean;
  initialFilters: SearchFilters;
  onClose: () => void;
  onApply: (filters: SearchFilters) => void;
  onSave: (filters: SearchFilters, name: string) => SearchFilters;
}

export default function FilterModal({ 
  visible, 
  initialFilters, 
  onClose, 
  onApply,
  onSave
}: FilterModalProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  
  // Animation values for button effects
  const saveButtonAnim = React.useRef(new Animated.Value(1)).current;
  const applyButtonAnim = React.useRef(new Animated.Value(1)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  
  // Shimmer effect
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, []);
  
  // Calculate shimmer translation
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200],
  });

  const sections = [
    { 
      title: 'Budget', 
      key: 'budgetRange',
      component: BudgetRangeSelector,
      icon: 'cash-outline'
    },
    { 
      title: 'Location', 
      key: 'location',
      component: LocationSelector,
      icon: 'location-outline'
    },
    { 
      title: 'Move-in Dates', 
      key: 'moveInDates',
      component: DateRangeSelector,
      icon: 'calendar-outline'
    },
    { 
      title: 'Room Type', 
      key: 'roomType',
      component: RoomTypeSelector,
      icon: 'bed-outline'
    },
    { 
      title: 'Lifestyle', 
      key: 'lifestyle',
      component: LifestyleSelector,
      icon: 'people-outline'
    },
    { 
      title: 'Gender',
      key: 'genderPreference',
      component: GenderSelector,
      icon: 'person-outline'
    },
  ];

  const handleReset = () => {
    setFilters(defaultFilters);
  };

  const handleSave = () => {
    if (saveFilterName.trim() === '') {
      Alert.alert('Error', 'Please enter a name for your saved filter');
      return;
    }
    
    onSave(filters, saveFilterName);
    setShowSaveDialog(false);
    setSaveFilterName('');
    onClose();
  };

  const updateFilters = (sectionKey: string, value: any) => {
    // Special handling for moveInDates to ensure we have proper Date objects
    if (sectionKey === 'moveInDates') {
      // Make sure both dates are actual Date objects before updating state
      const earliest = ensureDateObject(value.earliest);
      const latest = ensureDateObject(value.latest);
      
      setFilters(prev => ({
        ...prev,
        [sectionKey]: {
          earliest,
          latest
        }
      }));
    } else {
      // Normal handling for other filter types
      setFilters(prev => ({
        ...prev,
        [sectionKey]: value
      }));
    }
  };

  // Helper function to ensure we have a Date object
  const ensureDateObject = (dateValue: any): Date => {
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      return dateValue;
    }
    if (typeof dateValue === 'string') {
      const parsedDate = new Date(dateValue);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    // Default to current date if invalid
    return new Date();
  };

  useEffect(() => {
    setFilters(initialFilters || defaultFilters);
  }, [initialFilters]);

  const SectionComponent = sections[currentSection].component;
  
  // Button animation handlers
  const handlePressIn = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = (animValue: Animated.Value) => {
    Animated.spring(animValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Determine if the current section is Location to handle it specially
  const isLocationSection = sections[currentSection].key === 'location';

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header with gradient and close button */}
        <LinearGradient
          colors={['rgba(0,0,0,0.8)', 'rgba(31, 41, 55, 0.4)']}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={onClose}
              style={styles.iconButton}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity 
              onPress={handleReset}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Filter navigation tabs */}
        <View style={styles.navigationContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.navScrollContent}
          >
            {sections.map((section, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.navItem,
                  currentSection === index && styles.activeNavItem
                ]}
                onPress={() => setCurrentSection(index)}
              >
                <Ionicons 
                  name={section.icon as any} 
                  size={18} 
                  color={currentSection === index ? COLORS.text.accent : COLORS.text.secondary} 
                  style={styles.navIcon}
                />
                <Text 
                  style={[
                    styles.navItemText,
                    currentSection === index && styles.activeNavItemText
                  ]}
                >
                  {section.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Filter content container */}
        <View style={styles.contentOuterContainer}>
          <LinearGradient
            colors={['rgba(31, 41, 55, 0.5)', 'rgba(31, 41, 55, 0.5)']}
            style={styles.contentGradient}
          >
            {/* 
              Special handling for Location section to avoid nesting 
              ScrollView and FlatList with same orientation
            */}
            {isLocationSection ? (
              // For Location section, render directly without ScrollView
              <View style={[styles.contentContainer, styles.contentScrollViewContent]}>
                <LocationSelector
                  value={filters.location}
                  onChange={(value: any) => 
                    updateFilters('location', value)
                  }
                />
              </View>
            ) : (
              // For other sections, use ScrollView for scrolling
              <ScrollView 
                style={styles.contentScrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentScrollViewContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.contentContainer}>
                  <SectionComponent
                    value={filters[sections[currentSection].key as keyof SearchFilters]}
                    onChange={(value: any) => 
                      updateFilters(sections[currentSection].key, value)
                    }
                  />
                </View>
              </ScrollView>
            )}
          </LinearGradient>
        </View>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {/* Save button */}
          <Animated.View style={{
            transform: [{ scale: saveButtonAnim }],
            flex: 1,
          }}>
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={() => setShowSaveDialog(true)}
              onPressIn={() => handlePressIn(saveButtonAnim)}
              onPressOut={() => handlePressOut(saveButtonAnim)}
              activeOpacity={1}
            >
              <LinearGradient
                colors={['rgba(31, 41, 55, 0.8)', 'rgba(31, 41, 55, 0.9)']}
                style={styles.saveButtonGradient}
              >
                <Ionicons name="bookmark-outline" size={20} color={COLORS.text.primary} />
                <Text style={styles.saveButtonText}>Save</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Apply button */}
          <Animated.View style={{
            transform: [{ scale: applyButtonAnim }],
            flex: 2,
            marginLeft: SPACING.sm,
          }}>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => onApply(filters)}
              onPressIn={() => handlePressIn(applyButtonAnim)}
              onPressOut={() => handlePressOut(applyButtonAnim)}
              activeOpacity={1}
            >
              <LinearGradient
                colors={[COLORS.secondary, '#E5B93C']}
                style={styles.applyButtonGradient}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
                
                {/* Shimmer effect */}
                <Animated.View 
                  style={[
                    styles.shimmerEffect,
                    { transform: [{ translateX }] }
                  ]}
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Save dialog */}
        {showSaveDialog && (
          <View style={styles.saveDialogContainer}>
            <BlurView intensity={40} tint="dark" style={styles.saveDialogBackdrop} />
            <View style={styles.saveDialog}>
              <LinearGradient
                colors={['rgba(31, 41, 55, 0.9)', 'rgba(31, 41, 55, 0.95)']}
                style={styles.saveDialogGradient}
              >
                <Text style={styles.saveDialogTitle}>Save Filter</Text>
                <TextInput
                  style={styles.saveDialogInput}
                  placeholder="Enter a name for this filter"
                  placeholderTextColor={COLORS.text.secondary}
                  value={saveFilterName}
                  onChangeText={setSaveFilterName}
                  autoFocus={true}
                />
                <View style={styles.saveDialogButtons}>
                  <TouchableOpacity 
                    style={styles.saveDialogCancelButton}
                    onPress={() => {
                      setShowSaveDialog(false);
                      setSaveFilterName('');
                    }}
                  >
                    <Text style={styles.saveDialogCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveDialogSaveButton}
                    onPress={handleSave}
                  >
                    <LinearGradient
                      colors={[COLORS.secondary, '#E5B93C']}
                      style={styles.saveDialogSaveButtonGradient}
                    >
                      <Text style={styles.saveDialogSaveText}>Save</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    textAlign: 'center',
  },
  iconButton: {
    padding: SPACING.xs,
  },
  resetButton: {
    padding: SPACING.xs,
  },
  resetText: {
    color: COLORS.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  navigationContainer: {
    paddingVertical: SPACING.sm,
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(67, 113, 203, 0.1)',
  },
  navScrollContent: {
    paddingHorizontal: SPACING.md,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.1)',
  },
  activeNavItem: {
    backgroundColor: 'rgba(67, 113, 203, 0.2)',
    borderColor: 'rgba(67, 113, 203, 0.3)',
  },
  navIcon: {
    marginRight: SPACING.xs,
  },
  navItemText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  activeNavItemText: {
    color: COLORS.secondary,
    fontWeight: '600',
  },
  contentOuterContainer: {
    flex: 1,
    margin: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.15)',
    ...SHADOWS.md,
  },
  contentGradient: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
  },
  contentScrollView: {
    flex: 1,
  },
  contentScrollViewContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl, // Extra padding at bottom for better scrolling
  },
  contentContainer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(67, 113, 203, 0.1)',
    backgroundColor: COLORS.background.default,
  },
  saveButton: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.2)',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  saveButtonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    marginLeft: SPACING.xs,
  },
  applyButton: {
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  applyButtonGradient: {
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
  saveDialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    zIndex: 1000,
  },
  saveDialogBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  saveDialog: {
    width: '100%',
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.lg,
  },
  saveDialogGradient: {
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.2)',
  },
  saveDialogTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  saveDialogInput: {
    backgroundColor: 'rgba(31, 41, 55, 0.7)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: 'rgba(67, 113, 203, 0.2)',
  },
  saveDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveDialogCancelButton: {
    padding: SPACING.md,
    flex: 1,
  },
  saveDialogCancelText: {
    color: COLORS.text.secondary,
    fontSize: TYPOGRAPHY.fontSize.md,
    textAlign: 'center',
  },
  saveDialogSaveButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
    height: 44,
  },
  saveDialogSaveButtonGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDialogSaveText: {
    color: '#000000',
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: 'bold',
  },
}); 