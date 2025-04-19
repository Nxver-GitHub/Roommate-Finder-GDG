import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, SPACING, BORDER_RADIUS } from '../../utils/theme';

interface SecondaryTab {
  id: string;
  label: string;
  route: string;
  icon: string;
}

interface SecondaryTabsProps {
  tabs: SecondaryTab[];
  onDismiss?: (tabId: string) => void;
}

export default function SecondaryTabs({ tabs, onDismiss }: SecondaryTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Animation values for each tab
  const [slideAnims] = useState<{[key: string]: Animated.Value}>(() => {
    const anims: {[key: string]: Animated.Value} = {};
    tabs.forEach(tab => {
      anims[tab.id] = new Animated.Value(0);
    });
    return anims;
  });

  const navigateToTab = (route: string) => {
    router.push(route);
  };
  
  const handleDismiss = (tabId: string) => {
    // Animate the tab out
    Animated.timing(slideAnims[tabId], {
      toValue: Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      // Call parent component's onDismiss callback
      if (onDismiss) {
        onDismiss(tabId);
      }
    });
  };
  
  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isActive = pathname.includes(tab.route);
        
        return (
          <Animated.View 
            key={tab.id}
            style={[
              styles.tabContainer,
              {
                transform: [{ translateX: slideAnims[tab.id] }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.tab,
                isActive && styles.activeTab
              ]}
              onPress={() => navigateToTab(tab.route)}
            >
              <Ionicons 
                name={isActive ? tab.icon : `${tab.icon}-outline`}
                size={20} 
                color={isActive ? "#000" : COLORS.text.primary} 
              />
              <Text 
                style={[
                  styles.tabText,
                  isActive && styles.activeTabText
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dismissButton}
              onPress={() => handleDismiss(tab.id)}
            >
              <Ionicons name="close-circle" size={18} color="#666" />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70, // Position above the main tab bar
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.elevated,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  activeTab: {
    backgroundColor: COLORS.secondary,
  },
  tabText: {
    color: COLORS.text.primary,
    marginLeft: 4,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
  },
  activeTabText: {
    color: '#000',
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  dismissButton: {
    marginLeft: 4,
    padding: 4,
  },
}); 