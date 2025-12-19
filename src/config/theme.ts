/**
 * Theme Configuration - Unified Design System for Tander App
 *
 * This file consolidates all design tokens into a single theme object
 * that can be used throughout the application. It provides a consistent
 * API for accessing colors, typography, spacing, and other design tokens.
 *
 * SENIOR-FRIENDLY DESIGN:
 * - All values optimized for elderly users (60+)
 * - Larger touch targets, fonts, and spacing
 * - High contrast colors for better visibility
 * - Clear visual hierarchy
 *
 * RESPONSIVE DESIGN:
 * - Adapts to all mobile phone sizes (320px - 428px+)
 * - Tablet support (768px+)
 * - Consistent experience across devices
 */

import { Platform, StyleSheet, ViewStyle, TextStyle, ImageStyle } from "react-native";
import colors, { withOpacity, darken, lighten } from "./colors";
import typography, {
  sizes as fontSizes,
  lineHeights,
  weights as fontWeights,
  letterSpacing,
  fontFamily,
  textStyles,
  responsiveSizes,
  responsiveLineHeights,
  accessibility,
} from "./typography";
import {
  spacing,
  responsiveSpacing,
  touchTargets,
  componentSpacing,
  layoutPercentages,
  zIndex,
  duration,
  screen,
} from "./spacing";
import {
  seniorResponsive,
  getResponsiveValue,
  moderateScale,
  scaleFontSize,
  scaleWidth,
  scaleHeight,
  wp,
  hp,
  createShadow,
  safeArea,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BREAKPOINTS,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
} from "../utility/responsive";

/**
 * Shadow presets for different elevations
 */
export const shadows = {
  none: {},

  xs: Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }) as ViewStyle,

  sm: Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  md: Platform.select({
    ios: {
      shadowColor: colors.shadowMedium,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  lg: Platform.select({
    ios: {
      shadowColor: colors.shadowMedium,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,

  xl: Platform.select({
    ios: {
      shadowColor: colors.shadowHeavy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  // Colored shadows
  primary: Platform.select({
    ios: {
      shadowColor: colors.shadowPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,

  teal: Platform.select({
    ios: {
      shadowColor: colors.shadowTeal,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }) as ViewStyle,
};

/**
 * Border radius presets
 */
export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,

  // Responsive
  button: seniorResponsive.radiusButton,
  card: seniorResponsive.radiusCard,
  input: seniorResponsive.radiusMedium,
  pill: seniorResponsive.radiusPill,
};

/**
 * Animation/Transition presets
 */
export const animation = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  easing: {
    // Standard easing curves for React Native Animated
    linear: { useNativeDriver: true },
    easeIn: { useNativeDriver: true },
    easeOut: { useNativeDriver: true },
    easeInOut: { useNativeDriver: true },
  },

  spring: {
    gentle: { friction: 10, tension: 40, useNativeDriver: true },
    bouncy: { friction: 5, tension: 40, useNativeDriver: true },
    stiff: { friction: 20, tension: 180, useNativeDriver: true },
  },
};

/**
 * Common component style generators
 */
export const componentStyles = {
  /**
   * Generate button styles with senior-friendly defaults
   */
  button: (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
    const base: ViewStyle = {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: seniorResponsive.buttonHeight(),
      paddingVertical: seniorResponsive.buttonPaddingV(),
      paddingHorizontal: seniorResponsive.buttonPaddingH(),
      borderRadius: seniorResponsive.radiusButton(),
      ...shadows.md,
    };

    const variants: Record<string, ViewStyle> = {
      primary: {
        ...base,
        backgroundColor: colors.primary,
      },
      secondary: {
        ...base,
        backgroundColor: colors.accentTeal,
      },
      outline: {
        ...base,
        backgroundColor: colors.transparent,
        borderWidth: 2,
        borderColor: colors.primary,
      },
      ghost: {
        ...base,
        backgroundColor: colors.transparent,
        ...shadows.none,
      },
    };

    return variants[variant] || variants.primary;
  },

  /**
   * Generate card styles
   */
  card: (elevated: boolean = true): ViewStyle => ({
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...(elevated ? shadows.md : shadows.none),
  }),

  /**
   * Generate input styles
   */
  input: (hasError: boolean = false): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: seniorResponsive.touchTarget(),
    paddingVertical: seniorResponsive.inputPadding(),
    paddingHorizontal: seniorResponsive.inputPadding() + 4,
    borderRadius: seniorResponsive.radiusMedium(),
    backgroundColor: colors.backgroundInput,
    borderWidth: hasError ? 2 : 1,
    borderColor: hasError ? colors.error : colors.transparent,
  }),

  /**
   * Generate list item styles
   */
  listItem: (): ViewStyle => ({
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: seniorResponsive.touchTarget(),
    paddingVertical: componentSpacing.listItem.paddingVertical(),
    paddingHorizontal: componentSpacing.listItem.paddingHorizontal(),
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusMedium(),
    gap: seniorResponsive.gapMedium(),
    ...shadows.sm,
  }),

  /**
   * Generate screen container styles
   */
  screen: (): ViewStyle => ({
    flex: 1,
    backgroundColor: colors.backgroundLight,
  }),

  /**
   * Generate content container styles
   */
  content: (): ViewStyle => ({
    flex: 1,
    paddingHorizontal: seniorResponsive.contentPadding(),
    paddingTop: componentSpacing.screen.paddingTop(),
    paddingBottom: componentSpacing.screen.paddingBottom(),
    gap: seniorResponsive.gapLarge(),
  }),
};

/**
 * Main Theme Object
 *
 * Unified access to all design tokens
 */
const theme = {
  // Color System
  colors,

  // Color Utilities
  colorUtils: {
    withOpacity,
    darken,
    lighten,
  },

  // Typography
  typography: {
    fontFamily,
    sizes: fontSizes,
    lineHeights,
    weights: fontWeights,
    letterSpacing,
    textStyles,
    responsiveSizes,
    responsiveLineHeights,
    accessibility,
  },

  // Spacing
  spacing: {
    ...spacing,
    responsive: responsiveSpacing,
    component: componentSpacing,
  },

  // Touch Targets (Senior-Friendly)
  touchTargets,

  // Layout
  layout: {
    percentages: layoutPercentages,
    screen: {
      width: SCREEN_WIDTH,
      height: SCREEN_HEIGHT,
      ...screen,
    },
    safeArea,
  },

  // Shadows
  shadows,

  // Border Radius
  borderRadius,

  // Z-Index
  zIndex,

  // Animation
  animation,

  // Duration
  duration,

  // Responsive Utilities
  responsive: {
    seniorResponsive,
    getResponsiveValue,
    moderateScale,
    scaleFontSize,
    scaleWidth,
    scaleHeight,
    wp,
    hp,
    createShadow,
    breakpoints: BREAKPOINTS,
    isSmallDevice,
    isMediumDevice,
    isLargeDevice,
    isTablet,
  },

  // Component Style Generators
  componentStyles,
};

/**
 * Type definitions for theme
 */
export type Theme = typeof theme;
export type ThemeColors = typeof colors;
export type ThemeTypography = typeof theme.typography;
export type ThemeSpacing = typeof theme.spacing;

/**
 * Common style presets as StyleSheet
 */
export const commonStyles = StyleSheet.create({
  // Layout
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  flexShrink: { flexShrink: 1 },
  flexRow: { flexDirection: 'row' },
  flexColumn: { flexDirection: 'column' },
  flexWrap: { flexWrap: 'wrap' },

  // Alignment
  center: { justifyContent: 'center', alignItems: 'center' },
  centerH: { alignItems: 'center' },
  centerV: { justifyContent: 'center' },
  spaceBetween: { justifyContent: 'space-between' },
  spaceAround: { justifyContent: 'space-around' },
  spaceEvenly: { justifyContent: 'space-evenly' },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  justifyStart: { justifyContent: 'flex-start' },
  justifyEnd: { justifyContent: 'flex-end' },

  // Sizing
  fullWidth: { width: '100%' },
  fullHeight: { height: '100%' },
  fullSize: { width: '100%', height: '100%' },

  // Position
  absolute: { position: 'absolute' },
  relative: { position: 'relative' },
  absoluteFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  // Overflow
  hidden: { overflow: 'hidden' },
  visible: { overflow: 'visible' },

  // Common backgrounds
  bgWhite: { backgroundColor: colors.white },
  bgLight: { backgroundColor: colors.backgroundLight },
  bgTransparent: { backgroundColor: colors.transparent },
  bgPrimary: { backgroundColor: colors.primary },
  bgTeal: { backgroundColor: colors.accentTeal },

  // Common borders
  borderLight: { borderWidth: 1, borderColor: colors.borderLight },
  borderMedium: { borderWidth: 1, borderColor: colors.borderMedium },
  borderPrimary: { borderWidth: 2, borderColor: colors.primary },

  // Text alignment
  textCenter: { textAlign: 'center' },
  textLeft: { textAlign: 'left' },
  textRight: { textAlign: 'right' },
});

/**
 * Helper to get responsive gap value
 */
export const getGap = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): number => {
  const gaps = {
    xs: seniorResponsive.gapTiny(),
    sm: seniorResponsive.gapSmall(),
    md: seniorResponsive.gapMedium(),
    lg: seniorResponsive.gapLarge(),
    xl: seniorResponsive.gapXL(),
  };
  return gaps[size];
};

/**
 * Helper to get responsive padding value
 */
export const getPadding = (size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): number => {
  const paddings = {
    xs: spacing.xs,
    sm: spacing.sm,
    md: seniorResponsive.contentPadding(),
    lg: seniorResponsive.cardPadding(),
    xl: componentSpacing.modal.padding(),
  };
  return paddings[size];
};

export default theme;
