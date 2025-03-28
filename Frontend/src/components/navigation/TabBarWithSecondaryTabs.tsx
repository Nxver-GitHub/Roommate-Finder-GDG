import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSecondaryTabs } from '../../context/SecondaryTabsContext';
import SecondaryTabs from './SecondaryTabs';

export default function TabBarWithSecondaryTabs(props: BottomTabBarProps) {
  const { activeTabs, removeTab } = useSecondaryTabs();
  
  // Render the normal bottom tab bar plus our secondary tabs
  return (
    <View style={{ position: 'relative' }}>
      {activeTabs.length > 0 && (
        <SecondaryTabs 
          tabs={activeTabs} 
          onDismiss={removeTab}
        />
      )}
      {/* Use the default tab bar component from Expo Router */}
      <View style={styles.tabBarContainer}>
        {props.state.routes.map((route, index) => {
          const { options } = props.descriptors[route.key];
          const label = options.title || route.name;
          const isFocused = props.state.index === index;

          const onPress = () => {
            const event = props.navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              props.navigation.navigate(route.name);
            }
          };

          return (
            <View key={route.key} style={styles.tabItem}>
              {options.tabBarIcon && options.tabBarIcon({
                focused: isFocused,
                color: isFocused ? props.activeTintColor || '#FFD700' : props.inactiveTintColor || '#888',
                size: 24,
              })}
              <View style={styles.tabLabelContainer}>
                {options.tabBarLabel && options.tabBarLabel({
                  focused: isFocused,
                  color: isFocused ? props.activeTintColor || '#FFD700' : props.inactiveTintColor || '#888',
                  position: 'below-icon',
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#121212',
    borderTopColor: '#333',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 5,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabelContainer: {
    marginTop: 2,
  },
}); 