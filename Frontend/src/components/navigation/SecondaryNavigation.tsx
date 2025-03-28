import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useSecondaryTabs } from '../../context/SecondaryTabsContext';

export default function SecondaryNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { secondaryTabs, removeSecondaryTab } = useSecondaryTabs();
  
  const [isOpen, setIsOpen] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // If no secondary tabs, return null to avoid rendering anything
  if (!secondaryTabs || secondaryTabs.length === 0) return null;
  
  const openMenu = () => {
    setIsOpen(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  
  const closeMenu = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  };
  
  return (
    <>
      {/* Floating button */}
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={openMenu}
        activeOpacity={0.8}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="time" size={18} color="#000" />
          <Text style={styles.buttonText}>{secondaryTabs.length}</Text>
        </View>
      </TouchableOpacity>
      
      {/* Modal for the menu */}
      <Modal
        transparent={true}
        visible={isOpen}
        animationType="none"
        onRequestClose={closeMenu}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={closeMenu}
        >
          <Animated.View 
            style={[
              styles.menuContainer,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
            // Stop touch propagation to prevent closing when tapping the menu
            onTouchStart={(e) => e.stopPropagation()}
          >
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Recent Screens</Text>
              <TouchableOpacity onPress={closeMenu}>
                <Ionicons name="close" size={22} color="#ccc" />
              </TouchableOpacity>
            </View>
            
            {secondaryTabs.map(tab => {
              const isActive = pathname.includes(tab.route);
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.menuItem, isActive && styles.activeMenuItem]}
                  onPress={() => {
                    router.push(tab.route);
                    closeMenu();
                  }}
                >
                  <View style={styles.menuItemInfo}>
                    <Ionicons 
                      name={tab.id === 'conversations' ? 'chatbubbles' : 'list'} 
                      size={22} 
                      color={isActive ? '#FFD700' : '#ccc'} 
                    />
                    <Text style={[styles.menuItemText, isActive && styles.activeMenuItemText]}>
                      {tab.label}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dismissButton}
                    onPress={() => {
                      removeSecondaryTab(tab.id);
                      if (secondaryTabs.length <= 1) {
                        closeMenu();
                      }
                    }}
                  >
                    <Ionicons name="close-circle" size={18} color="#666" />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    right: 16,
    bottom: 75, // Just above the tab bar
    backgroundColor: '#FFD700',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 100,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#232323',
    borderRadius: 12,
    padding: 0,
    maxHeight: '60%',
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
  },
  menuItemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  activeMenuItemText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  dismissButton: {
    marginLeft: 10,
    padding: 5,
  },
}); 