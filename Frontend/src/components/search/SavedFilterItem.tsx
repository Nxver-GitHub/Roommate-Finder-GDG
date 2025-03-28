import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SearchFilters } from '../../services/searchService';

interface SavedFilterItemProps {
  filter: SearchFilters;
  isActive: boolean;
  onApply: () => void;
  onDelete: () => void;
  summary: string;
}

export default function SavedFilterItem({
  filter,
  isActive,
  onApply,
  onDelete,
  summary,
}: SavedFilterItemProps) {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={onApply}
    >
      <View style={styles.infoContainer}>
        <Text style={styles.filterName}>{filter.name}</Text>
        <Text style={styles.filterSummary}>{summary}</Text>
      </View>
      <View style={styles.actionsContainer}>
        {isActive && (
          <View style={styles.activeIndicator}>
            <Text style={styles.activeText}>Active</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#f44" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activeContainer: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  infoContainer: {
    flex: 1,
  },
  filterName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  filterSummary: {
    fontSize: 14,
    color: '#ccc',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeIndicator: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 12,
  },
  activeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  deleteButton: {
    padding: 8,
  },
}); 