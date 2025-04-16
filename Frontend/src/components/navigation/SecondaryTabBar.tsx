import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSecondaryTabs } from '../../contexts/SecondaryTabsContext';

export default function SecondaryTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { secondaryTabs, removeSecondaryTab } = useSecondaryTabs();
  
  // If no secondary tabs, don't render anything
  if (secondaryTabs.length === 0) return null;
  
  return (
    <View style={styles.container}>
      {secondaryTabs.map(tab => {
        const isActive = pathname.includes(tab.route);
        
        return (
          <View key={tab.id} style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => router.push(tab.route)}
            >
              <Ionicons 
                name={tab.id === 'conversations' ? 'chatbubbles' : 'list'} 
                size={16} 
                color={isActive ? '#000' : '#fff'} 
                style={styles.tabIcon}
              />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dismissButton}
              onPress={() => removeSecondaryTab(tab.id)}
            >
              <Ionicons name="close" size={12} color="#ccc" />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 80, // Increase this to move it higher above the tab bar
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 100,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  tab: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  activeTab: {
    backgroundColor: '#FFD700',
  },
  tabText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
  },
  dismissButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tabIcon: {
    marginRight: 6,
  },
}); 