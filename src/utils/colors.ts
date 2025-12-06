/**
 * REMODELY.AI Design System - Color Palette
 * Primary: Blue - Professional, trustworthy
 * Accent: Yellow/Gold - Energy, optimism
 * Red: Power, urgency, action
 * Secondary: Teal - Balance, freshness
 *
 * Brand Colors: Blue (#2563eb) + Red (#dc2626) + Yellow (#fbbf24)
 */

export const colors = {
  // Primary - Professional Blue
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main blue
    600: '#2563eb', // Primary brand color
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Red - Power, urgency (NEW brand color)
  red: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444', // Main red
    600: '#dc2626', // Brand red
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Secondary - Teal (complementary)
  secondary: {
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
  },

  // Accent - Yellow/Gold (energy, action)
  accent: {
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24', // Main yellow - Brand color
    500: '#f59e0b', // Amber
    600: '#d97706',
  },

  // Yellow - Sunshine highlights
  yellow: {
    100: '#fef9c3',
    200: '#fef08a',
    300: '#fde047',
    400: '#facc15',
    500: '#eab308',
    600: '#ca8a04',
  },

  // Neutrals - Slate Gray
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
  },

  // Semantic Colors
  success: {
    light: '#dcfce7',
    main: '#22c55e',
    dark: '#16a34a',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#dc2626',
  },

  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#d97706',
  },

  // Background
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
  },

  // Text
  text: {
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
    quaternary: '#94a3b8',
  },

  // Borders
  border: {
    light: '#f1f5f9',
    main: '#e2e8f0',
    dark: '#cbd5e1',
  },
};

// Typography weights
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

// Border radius
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
