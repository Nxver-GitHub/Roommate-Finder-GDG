import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSecondaryTabs } from '../../context/SecondaryTabsContext';

export default function SecondaryNavigationSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const { secondaryTabs, removeSecondaryTab } = useSecondaryTabs();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  
  // If no secondary tabs, don't render anything
  if (secondaryTabs.length === 0) return null;
  
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      if (gesture.dy > 0) { // Only allow downward movement
        pan.y.setValue(gesture.dy);
      }
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 50) {
        // User swiped down significantly, collapse the sheet
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
        setIsExpanded(false);
      } else {
        // Reset position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
      }
    }
  });
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.handle}
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <View style={styles.handleBar} />
        <Text style={styles.handleText}>
          Recent Navigation
        </Text>
      </TouchableOpacity>
      
      {isExpanded && (
        <Animated.View 
          style={[styles.sheetContent, { transform: [{ translateY: pan.y }] }]}
          {...panResponder.panHandlers}
        >
          {secondaryTabs.map(tab => {
            const isActive = pathname.includes(tab.route);
            
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tabItem, isActive && styles.activeTabItem]}
                onPress={() => {
                  router.push(tab.route);
                  setIsExpanded(false);
                }}
              >
                <View style={styles.tabInfo}>
                  <Ionicons 
                    name={tab.id === 'conversations' ? 'chatbubbles' : 'list'} 
                    size={22} 
                    color={isActive ? '#FFD700' : '#ccc'} 
                  />
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => removeSecondaryTab(tab.id)}
                >
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, // Just above the tab bar
    left: 0,
    right: 0,
    zIndex: 100,
  },
  handle: {
    backgroundColor: 'rgba(40, 40, 40, 0.95)',
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    alignItems: 'center',
    alignSelf: 'center',
    width: 150,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#666',
    borderRadius: 2,
    marginBottom: 6,
  },
  handleText: {
    color: '#ccc',
    fontSize: 12,
  },
  sheetContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    paddingVertical: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 200,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeTabItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
  },
  tabInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  activeTabText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  dismissButton: {
    padding: 6,
  },
}); 