import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters, defaultFilters } from '../../services/searchService';
import BudgetRangeSelector from './BudgetRangeSelector';
import LocationSelector from './LocationSelector';
import DateRangeSelector from './DateRangeSelector';
import RoomTypeSelector from './RoomTypeSelector';
import LifestyleSelector from './LifestyleSelector';
import GenderSelector from './GenderSelector';

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

  const sections = [
    { 
      title: 'Budget', 
      key: 'budgetRange',
      component: BudgetRangeSelector 
    },
    { 
      title: 'Location', 
      key: 'location',
      component: LocationSelector 
    },
    { 
      title: 'Move-in Dates', 
      key: 'moveInDates',
      component: DateRangeSelector 
    },
    { 
      title: 'Room Type', 
      key: 'roomType',
      component: RoomTypeSelector 
    },
    { 
      title: 'Lifestyle', 
      key: 'lifestyle',
      component: LifestyleSelector 
    },
    { 
      title: 'Gender',
      key: 'genderPreference',
      component: GenderSelector
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

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close-outline" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.navigationContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled={true}
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

        <View style={styles.contentContainer}>
          <SectionComponent
            value={filters[sections[currentSection].key as keyof SearchFilters]}
            onChange={(value: any) => 
              updateFilters(sections[currentSection].key, value)
            }
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={() => setShowSaveDialog(true)}
          >
            <Ionicons name="bookmark-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => onApply(filters)}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>

        {showSaveDialog && (
          <View style={styles.saveDialogContainer}>
            <View style={styles.saveDialogBackdrop} />
            <View style={styles.saveDialog}>
              <Text style={styles.saveDialogTitle}>Save Filter</Text>
              <TextInput
                style={styles.saveDialogInput}
                placeholder="Enter a name for this filter"
                placeholderTextColor="#999"
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
                  <Text style={styles.saveDialogSaveText}>Save</Text>
                </TouchableOpacity>
              </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetText: {
    color: '#FFD700',
    fontSize: 16,
  },
  navigationContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  navItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeNavItem: {
    backgroundColor: '#333',
  },
  navItemText: {
    color: '#ccc',
    fontSize: 16,
  },
  activeNavItemText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    marginRight: 12,
    flex: 1,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  applyButton: {
    backgroundColor: '#FFD700',
    padding: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 2,
  },
  applyButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveDialogContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  saveDialogBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  saveDialog: {
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  saveDialogInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  saveDialogButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveDialogCancelButton: {
    padding: 10,
    marginRight: 10,
  },
  saveDialogCancelText: {
    color: '#ccc',
    fontSize: 16,
  },
  saveDialogSaveButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 6,
    paddingHorizontal: 16,
  },
  saveDialogSaveText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 