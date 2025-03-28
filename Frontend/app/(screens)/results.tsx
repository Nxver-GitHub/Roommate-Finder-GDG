import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { formatCurrency } from '../../src/utils/formatters';

// Mock data for search results
const mockResults = [
  {
    id: '1',
    name: 'Michael Chen',
    age: 24,
    occupation: 'Software Engineer',
    photo: 'https://randomuser.me/api/portraits/men/32.jpg',
    location: 'Downtown, Austin',
    price: 1200,
    moveInDate: 'Jun 1, 2024',
    compatibility: 92,
    distance: 2.4,
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    age: 26,
    occupation: 'Graphic Designer',
    photo: 'https://randomuser.me/api/portraits/women/44.jpg',
    location: 'East Austin',
    price: 950,
    moveInDate: 'Jul 15, 2024',
    compatibility: 87,
    distance: 3.8,
  },
  {
    id: '3',
    name: 'David Kim',
    age: 23,
    occupation: 'Student',
    photo: 'https://randomuser.me/api/portraits/men/22.jpg',
    location: 'Near Campus',
    price: 850,
    moveInDate: 'Aug 1, 2024',
    compatibility: 79,
    distance: 0.7,
  },
  {
    id: '4',
    name: 'Olivia Martinez',
    age: 25,
    occupation: 'Nurse',
    photo: 'https://randomuser.me/api/portraits/women/57.jpg',
    location: 'South Austin',
    price: 1100,
    moveInDate: 'Jun 15, 2024',
    compatibility: 82,
    distance: 5.2,
  },
  {
    id: '5',
    name: 'James Wilson',
    age: 27,
    occupation: 'Marketing Manager',
    photo: 'https://randomuser.me/api/portraits/men/52.jpg',
    location: 'North Austin',
    price: 1300,
    moveInDate: 'Jul 1, 2024',
    compatibility: 85,
    distance: 4.6,
  },
];

export default function ResultsScreen() {
  const router = useRouter();
  const [results] = useState(mockResults);
  
  const renderResultItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.resultCard}
      onPress={() => {
        // In a real app, navigate to profile detail
        console.log('View profile:', item.id);
      }}
    >
      <Image source={{ uri: item.photo }} style={styles.profileImage} />
      <View style={styles.resultInfo}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{item.name}, {item.age}</Text>
          <View style={styles.compatibilityBadge}>
            <Text style={styles.compatibilityText}>{item.compatibility}%</Text>
          </View>
        </View>
        <Text style={styles.occupation}>{item.occupation}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color="#ccc" />
            <Text style={styles.detailText}>{item.location}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cash-outline" size={16} color="#ccc" />
            <Text style={styles.detailText}>{formatCurrency(item.price)}/mo</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#ccc" />
            <Text style={styles.detailText}>{item.moveInDate}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="navigate-outline" size={16} color="#ccc" />
            <Text style={styles.detailText}>{item.distance} miles away</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Results</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{results.length} results found</Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical-outline" size={18} color="#ccc" />
          <Text style={styles.sortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={results}
        renderItem={renderResultItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.resultsList}
        showsVerticalScrollIndicator={false}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButtonText: {
    color: '#ccc',
    marginLeft: 4,
  },
  resultsList: {
    padding: 16,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  compatibilityBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  compatibilityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  occupation: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 8,
  },
  detailsContainer: {
    flex: 1,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#ccc',
    marginLeft: 6,
  },
}); 