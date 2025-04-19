/**
 * TABS LAYOUT
 * This layout handles the bottom tab navigation for the main screens.
 * It defines the UI for Discover, Messages, Search, Results, and Profile tabs.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FilterProvider } from '../../src/contexts/FilterContext';
import { COLORS } from '../../src/utils/theme';
import { Platform, Text } from 'react-native';

export default function TabLayout() {
  return (
    <FilterProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: COLORS.background.default,
            borderTopColor: COLORS.border.default,
            borderTopWidth: 1,
            height: Platform.OS === 'ios' ? 85 : 60,
            paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          },
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: '#888',
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 12,
            color: '#FFFFFF',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
            tabBarLabel: ({ focused, color }) => (
              <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                Discover
              </Text>
            ),
          }}
        />
        <Tabs.Screen
          name="messages"
          options={{
            title: 'Messages',
            tabBarIcon: ({ color }) => <Ionicons name="chatbubbles" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Search',
            tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="results"
          options={{
            title: 'Results',
            tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
          }}
        />

        {/* Hidden Screens - Ensure these are explicitly hidden */}
        <Tabs.Screen
          name="edit-profile"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="conversation"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </FilterProvider>
  );
}