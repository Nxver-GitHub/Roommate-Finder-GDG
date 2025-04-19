import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, BORDER_RADIUS, SPACING } from '../../utils/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export default function ThemedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ThemedButtonProps) {
  
  const getButtonStyle = () => {
    let baseStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = COLORS.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = COLORS.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = COLORS.border.focus;
        break;
      case 'danger':
        baseStyle.backgroundColor = COLORS.danger;
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingVertical = SPACING.xs;
        baseStyle.paddingHorizontal = SPACING.md;
        break;
      case 'medium':
        baseStyle.paddingVertical = SPACING.sm;
        baseStyle.paddingHorizontal = SPACING.lg;
        break;
      case 'large':
        baseStyle.paddingVertical = SPACING.md;
        baseStyle.paddingHorizontal = SPACING.xl;
        break;
    }
    
    // Full width style
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    
    // Disabled style
    if (disabled || loading) {
      baseStyle.opacity = 0.6;
    }
    
    return baseStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    let textStyleObj: TextStyle = {};
    
    // Size styles for text
    switch (size) {
      case 'small':
        textStyleObj.fontSize = TYPOGRAPHY.fontSize.sm;
        break;
      case 'medium':
        textStyleObj.fontSize = TYPOGRAPHY.fontSize.md;
        break;
      case 'large':
        textStyleObj.fontSize = TYPOGRAPHY.fontSize.lg;
        break;
    }
    
    // Variant specific text colors
    if (variant === 'outline') {
      textStyleObj.color = COLORS.text.primary;
    } else if (variant === 'secondary') {
      textStyleObj.color = '#000000'; // Black text on yellow background
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        getButtonStyle(),
        style
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? COLORS.text.primary : 
                variant === 'secondary' ? '#000000' : 
                COLORS.text.primary} 
          size={size === 'small' ? 'small' : 'small'}
        />
      ) : (
        <Text style={[
          styles.text,
          getTextStyle(),
          textStyle
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  text: {
    color: COLORS.text.primary,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  }
}); 