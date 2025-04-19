/**
 * SlugSpace UI Theme
 * 
 * This file contains all theme-related constants based on the Canva design.
 */

export const COLORS = {
  // Primary colors
  primary: '#4371CB', // Primary blue
  secondary: '#F0D264', // Yellow/gold for slug and accents
  success: '#3AB795', // Teal/light green
  danger: '#FF4444', // Red for errors
  
  // Dark mode backgrounds
  background: {
    default: '#121212', // Main background
    elevated: '#1F2937', // Cards, modals
    input: '#333333', // Input fields
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF', // White text
    secondary: '#9CA3AF', // Gray text
    accent: '#F0D264', // Gold accent text
    error: '#FF4444', // Error text
  },
  
  // Borders and dividers
  border: {
    default: '#333333',
    light: '#444444',
    focus: '#4371CB',
  },
  
  // Special colors
  darkGreen: '#1B5E41', // Dark green from palette
};

// Typography - using system fonts
export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'System', // System font instead of Poppins
    body: 'System', // System font instead of Inter
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

// Border radius
export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
}; 