/**
 * TABS LAYOUT
 * This layout handles the bottom tab navigation for the main screens.
 * It defines the UI for Discover, Messages, Search, Results, and Profile tabs.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FilterProvider } from '../../src/contexts/FilterContext';

export default function TabLayout() {
  return (
    <FilterProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#121212',
            borderTopColor: '#333',
            borderTopWidth: 1,
          },
          tabBarActiveTintColor: '#0891b2',
          tabBarInactiveTintColor: '#888',
        }}
      >
        {/* Visible Tabs matching the screenshot */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Discover',
            tabBarIcon: ({ color }) => <Ionicons name="compass" size={24} color={color} />,
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
          name="matches"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="edit-profile"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="conversation/[id]"
          options={{ href: null }}
        />
        <Tabs.Screen
          name="conversation"
          options={{ href: null }}
        />
      </Tabs>
    </FilterProvider>
  );
}