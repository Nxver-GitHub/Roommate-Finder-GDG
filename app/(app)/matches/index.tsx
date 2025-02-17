import { useState } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { useMatches } from '../../../hooks/useMatches';

export default function Matches() {
  const { matches } = useMatches();

  const renderMatch = ({ item }) => (
    <Link href={`/messages/${item.id}`} asChild>
      <TouchableOpacity style={styles.matchCard}>
        <Image source={{ uri: item.photoUrl }} style={styles.avatar} />
        <View style={styles.matchInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.details}>{item.major} • {item.year}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Matches</Text>
      </View>

      {matches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            No matches yet! Keep swiping to find your perfect roommate.
          </Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderMatch}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#001A57',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD200',
  },
  list: {
    padding: 20,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  matchInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: '#001A57',
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});