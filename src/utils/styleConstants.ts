/**
 * Global Style Constants
 * Consistent styling across all screens using cutStone/Surprise Granite branding
 */

import { colors } from './colors';

export const styleConstants = {
  // Backgrounds
  bg: {
    primary: colors.background.primary,
    secondary: colors.background.secondary,
    tertiary: colors.background.tertiary,
    input: colors.background.tertiary,
    card: colors.background.primary,
  },
  
  // Text colors
  text: {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    tertiary: colors.text.tertiary,
    placeholder: colors.neutral[300],
    link: colors.primary[600],
  },
  
  // Borders
  border: {
    light: colors.border.light,
    main: colors.border.main,
    dark: colors.border.dark,
    input: colors.border.main,
  },
  
  // Buttons
  button: {
    primary: {
      bg: colors.primary[600],
      text: '#ffffff',
    },
    secondary: {
      bg: colors.background.tertiary,
      text: colors.text.primary,
    },
    accent: {
      bg: colors.accent[500],
      text: colors.text.primary,
    },
    disabled: {
      bg: colors.neutral[200],
      text: colors.neutral[400],
    },
  },
  
  // Brand colors
  brand: {
    navy: colors.primary[600],
    yellow: colors.accent[500],
    beige: colors.secondary[200],
  },
  
  // Semantic
  success: colors.success.main,
  error: colors.error.main,
  warning: colors.warning.main,
  
  // Icons
  icon: {
    primary: colors.text.secondary,
    secondary: colors.neutral[300],
    accent: colors.accent[500],
  },
};
