/**
 * Shared theme constants for web and mobile apps
 * These values match the custom Tailwind config used in web
 */

// Color palette - Spotify-inspired dark theme
export const colors = {
  // Gray scale
  gray: {
    900: '#121212', // Main background
    800: '#181818', // Card/section backgrounds
    700: '#282828', // Borders, secondary buttons
    600: '#3e3e3e', // Disabled states, subtle borders
    500: '#535353', // Muted text, section titles
    400: '#b3b3b3', // Secondary text, descriptions
    300: '#e0e0e0', // Primary text
    200: '#f0f0f0', // Labels, bright text
  },

  // Brand colors
  brand: {
    discogs: '#333333',
    lastfm: '#d51007',
  },

  // Semantic colors
  primary: '#2563eb',   // blue-600 - primary actions
  primaryHover: '#1d4ed8', // blue-700
  success: '#4ade80',   // green-400 - success states, checkmarks
  error: '#ef4444',     // red-500 - error states
  errorDark: '#dc2626', // red-600 - error buttons

  // Common colors
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// Spacing scale (matches common Tailwind spacing)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

// Border radius scale
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
} as const;

// Font sizes
export const fontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Font weights
export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Opacity values for overlays
export const opacity = {
  disabled: 0.5,
  overlay: 0.6,
  overlayLight: 0.4,
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
} as const;

// Combined theme object for convenience
export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  opacity,
  zIndex,
} as const;

// Type exports for TypeScript
export type Colors = typeof colors;
export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type FontSize = typeof fontSize;
export type FontWeight = typeof fontWeight;
export type Theme = typeof theme;
