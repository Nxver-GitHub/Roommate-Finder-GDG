import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, BORDER_RADIUS, SHADOWS, SPACING } from '../../utils/theme';

interface ThemedCardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export default function ThemedCard({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}: ThemedCardProps) {
  
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'default':
        cardStyle.backgroundColor = COLORS.background.elevated;
        break;
      case 'elevated':
        cardStyle.backgroundColor = COLORS.background.elevated;
        cardStyle = { ...cardStyle, ...SHADOWS.md };
        break;
      case 'outlined':
        cardStyle.backgroundColor = 'transparent';
        cardStyle.borderWidth = 1;
        cardStyle.borderColor = COLORS.border.default;
        break;
    }
    
    // Padding styles
    switch (padding) {
      case 'none':
        cardStyle.padding = 0;
        break;
      case 'small':
        cardStyle.padding = SPACING.sm;
        break;
      case 'medium':
        cardStyle.padding = SPACING.md;
        break;
      case 'large':
        cardStyle.padding = SPACING.lg;
        break;
    }
    
    return cardStyle;
  };
  
  return (
    <View style={[styles.card, getCardStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    marginVertical: SPACING.sm,
    overflow: 'hidden',
  },
}); 