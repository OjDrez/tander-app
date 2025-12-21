/**
 * Typography System - Comprehensive Text Styling for Tander App
 *
 * SENIOR-FRIENDLY TYPOGRAPHY PRINCIPLES:
 * - All font sizes are 20-30% LARGER than standard mobile guidelines
 * - Minimum text size is 16px (vs 12px standard)
 * - Line heights are generous for easy reading (1.5-1.7x)
 * - Letter spacing optimized for clarity
 * - High contrast text colors (defined in colors.ts)
 *
 * ACCESSIBILITY STANDARDS:
 * - Follows WCAG 2.1 AA guidelines for text sizing
 * - Supports dynamic type scaling (up to 1.4x)
 * - Clear visual hierarchy through size and weight
 * - Readable at arm's length for elderly users
 *
 * RESPONSIVE DESIGN:
 * - Font sizes scale with screen size
 * - Maintains readability across all device sizes
 * - Uses responsive.ts for scaling calculations
 */

import { Platform, TextStyle } from "react-native";
import {
  seniorResponsive,
  getResponsiveValue,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
} from "../utility/responsive";

/**
 * Font Family Configuration
 * Platform-specific font families for optimal rendering
 */
export const fontFamily = {
  /** System font - Uses SF Pro on iOS, Roboto on Android */
  system: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "System",
  }) as string,

  /** Regular weight */
  regular: Platform.select({
    ios: "System",
    android: "Roboto",
    default: "System",
  }) as string,

  /** Medium weight */
  medium: Platform.select({
    ios: "System",
    android: "Roboto-Medium",
    default: "System",
  }) as string,

  /** Bold weight */
  bold: Platform.select({
    ios: "System",
    android: "Roboto-Bold",
    default: "System",
  }) as string,

  /** Light weight */
  light: Platform.select({
    ios: "System",
    android: "Roboto-Light",
    default: "System",
  }) as string,
};

/**
 * Font Sizes - SENIOR-FRIENDLY
 *
 * All sizes are intentionally larger than standard:
 * - Standard body: 18px (vs 14-16px typical)
 * - Minimum size: 16px (vs 10-12px typical)
 * - Headers: 22-40px (vs 18-32px typical)
 *
 * Static values for TypeScript compatibility
 */
export const sizes = {
  /** Extra small - Minimum accessible size (16px) */
  xs: 16,

  /** Small - Captions, timestamps (17px) */
  sm: 17,

  /** Body - Main content text (18px) */
  body: 18,

  /** Medium - Emphasized body text (20px) */
  md: 20,

  /** Large - Subheadings (22px) */
  lg: 22,

  /** H4 - Section titles (22px) */
  h4: 22,

  /** H3 - Page subtitles (26px) */
  h3: 26,

  /** H2 - Page titles (32px) */
  h2: 32,

  /** H1 - Large headlines (38px) */
  h1: 38,

  /** Display - Hero text (44px) */
  display: 44,

  // Legacy aliases
  tiny: 16,
  small: 17,
  button: 18,
  headerLogo: 60,
  headerBody: 40,
};

/**
 * Responsive Font Sizes
 * Use these functions for dynamic sizing based on device
 */
export const responsiveSizes = {
  xs: (): number => getResponsiveValue(14, 15, 16, 17, 18),
  sm: (): number => getResponsiveValue(15, 16, 17, 18, 19),
  body: (): number => getResponsiveValue(16, 17, 18, 20, 22),
  md: (): number => getResponsiveValue(18, 19, 20, 22, 24),
  lg: (): number => getResponsiveValue(20, 21, 22, 24, 26),
  h4: (): number => getResponsiveValue(20, 21, 22, 24, 28),
  h3: (): number => getResponsiveValue(22, 24, 26, 30, 34),
  h2: (): number => getResponsiveValue(26, 28, 32, 36, 40),
  h1: (): number => getResponsiveValue(32, 34, 38, 42, 48),
  display: (): number => getResponsiveValue(38, 40, 44, 50, 56),
  button: (): number => getResponsiveValue(16, 17, 18, 20, 22),
  input: (): number => getResponsiveValue(16, 17, 18, 20, 22),
  caption: (): number => getResponsiveValue(14, 15, 16, 17, 18),
  label: (): number => getResponsiveValue(14, 15, 16, 18, 20),
};

/**
 * Line Heights - SENIOR-FRIENDLY
 *
 * Generous line heights for easy reading:
 * - Body text: 1.55-1.7x font size
 * - Headers: 1.3-1.4x font size
 * - Extra spacing between lines helps seniors track text
 */
export const lineHeights = {
  /** Tight - For compact UI elements */
  tight: 1.25,

  /** Normal - For headers */
  normal: 1.35,

  /** Relaxed - For body text */
  relaxed: 1.55,

  /** Loose - For long-form content */
  loose: 1.7,

  // Pixel values for legacy compatibility
  h1: 50,
  h2: 42,
  h3: 34,
  h4: 30,
  body: 28,
  small: 26,
  tiny: 24,
  button: 26,
  headerLogo: 66,
  headerBody: 46,
};

/**
 * Responsive Line Heights
 * Calculated based on font size
 */
export const responsiveLineHeights = {
  xs: (): number => Math.round(responsiveSizes.xs() * lineHeights.relaxed),
  sm: (): number => Math.round(responsiveSizes.sm() * lineHeights.relaxed),
  body: (): number => Math.round(responsiveSizes.body() * lineHeights.relaxed),
  md: (): number => Math.round(responsiveSizes.md() * lineHeights.relaxed),
  lg: (): number => Math.round(responsiveSizes.lg() * lineHeights.normal),
  h4: (): number => Math.round(responsiveSizes.h4() * lineHeights.normal),
  h3: (): number => Math.round(responsiveSizes.h3() * lineHeights.normal),
  h2: (): number => Math.round(responsiveSizes.h2() * lineHeights.normal),
  h1: (): number => Math.round(responsiveSizes.h1() * lineHeights.tight),
  display: (): number => Math.round(responsiveSizes.display() * lineHeights.tight),
  button: (): number => Math.round(responsiveSizes.button() * lineHeights.normal),
};

/**
 * Font Weights
 * String values for React Native TextStyle compatibility
 */
export const weights = {
  /** Light - Decorative text only (300) */
  light: "300" as TextStyle["fontWeight"],

  /** Normal - Body text (400) */
  normal: "400" as TextStyle["fontWeight"],

  /** Medium - Emphasized text (500) */
  medium: "500" as TextStyle["fontWeight"],

  /** Semibold - Subheadings, buttons (600) */
  semibold: "600" as TextStyle["fontWeight"],

  /** Bold - Headlines, strong emphasis (700) */
  bold: "700" as TextStyle["fontWeight"],

  /** Extra bold - Display text (800) */
  extrabold: "800" as TextStyle["fontWeight"],
};

/**
 * Letter Spacing
 * Optimized for readability at various sizes
 */
export const letterSpacing = {
  /** Tighter - For large display text */
  tighter: -1,

  /** Tight - For headlines */
  tight: -0.5,

  /** Normal - For body text */
  normal: 0,

  /** Wide - For small text, buttons */
  wide: 0.3,

  /** Wider - For labels, captions */
  wider: 0.5,

  /** Widest - For uppercase text */
  widest: 1,
};

/**
 * Text Transform Options
 */
export const textTransform = {
  none: "none" as const,
  uppercase: "uppercase" as const,
  lowercase: "lowercase" as const,
  capitalize: "capitalize" as const,
};

/**
 * Pre-built Text Styles - SENIOR-FRIENDLY
 *
 * Ready-to-use text style presets that combine
 * size, weight, line height, and letter spacing
 */
export const textStyles: Record<string, TextStyle> = {
  // Display / Hero
  displayLarge: {
    fontSize: sizes.display,
    fontWeight: weights.bold,
    lineHeight: sizes.display * lineHeights.tight,
    letterSpacing: letterSpacing.tighter,
    fontFamily: fontFamily.bold,
  },

  display: {
    fontSize: sizes.h1,
    fontWeight: weights.bold,
    lineHeight: sizes.h1 * lineHeights.tight,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },

  // Headlines
  h1: {
    fontSize: sizes.h1,
    fontWeight: weights.bold,
    lineHeight: lineHeights.h1,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },

  h2: {
    fontSize: sizes.h2,
    fontWeight: weights.bold,
    lineHeight: lineHeights.h2,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },

  h3: {
    fontSize: sizes.h3,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.h3,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },

  h4: {
    fontSize: sizes.h4,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.h4,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },

  // Body Text
  bodyLarge: {
    fontSize: sizes.md,
    fontWeight: weights.normal,
    lineHeight: sizes.md * lineHeights.relaxed,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },

  body: {
    fontSize: sizes.body,
    fontWeight: weights.normal,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },

  bodyMedium: {
    fontSize: sizes.body,
    fontWeight: weights.medium,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
  },

  bodyBold: {
    fontSize: sizes.body,
    fontWeight: weights.bold,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.bold,
  },

  // Small Text
  small: {
    fontSize: sizes.sm,
    fontWeight: weights.normal,
    lineHeight: lineHeights.small,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.regular,
  },

  smallMedium: {
    fontSize: sizes.sm,
    fontWeight: weights.medium,
    lineHeight: lineHeights.small,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.medium,
  },

  // Caption / Tiny
  caption: {
    fontSize: sizes.xs,
    fontWeight: weights.normal,
    lineHeight: lineHeights.tiny,
    letterSpacing: letterSpacing.wider,
    fontFamily: fontFamily.regular,
  },

  captionMedium: {
    fontSize: sizes.xs,
    fontWeight: weights.medium,
    lineHeight: lineHeights.tiny,
    letterSpacing: letterSpacing.wider,
    fontFamily: fontFamily.medium,
  },

  // UI Elements
  button: {
    fontSize: sizes.button,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.button,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.medium,
  },

  buttonLarge: {
    fontSize: sizes.md,
    fontWeight: weights.bold,
    lineHeight: sizes.md * lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.bold,
  },

  buttonSmall: {
    fontSize: sizes.sm,
    fontWeight: weights.semibold,
    lineHeight: sizes.sm * lineHeights.normal,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.medium,
  },

  input: {
    fontSize: sizes.body,
    fontWeight: weights.normal,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },

  label: {
    fontSize: sizes.sm,
    fontWeight: weights.medium,
    lineHeight: lineHeights.small,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.medium,
  },

  labelUppercase: {
    fontSize: sizes.xs,
    fontWeight: weights.semibold,
    lineHeight: lineHeights.tiny,
    letterSpacing: letterSpacing.widest,
    textTransform: "uppercase",
    fontFamily: fontFamily.medium,
  },

  // Specialized
  link: {
    fontSize: sizes.body,
    fontWeight: weights.medium,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.medium,
    textDecorationLine: "underline",
  },

  error: {
    fontSize: sizes.sm,
    fontWeight: weights.medium,
    lineHeight: lineHeights.small,
    letterSpacing: letterSpacing.wide,
    fontFamily: fontFamily.medium,
  },

  placeholder: {
    fontSize: sizes.body,
    fontWeight: weights.normal,
    lineHeight: lineHeights.body,
    letterSpacing: letterSpacing.normal,
    fontFamily: fontFamily.regular,
  },

  // Header/Logo
  headerLogo: {
    fontSize: sizes.headerLogo,
    fontWeight: weights.bold,
    lineHeight: lineHeights.headerLogo,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },

  headerBody: {
    fontSize: sizes.headerBody,
    fontWeight: weights.bold,
    lineHeight: lineHeights.headerBody,
    letterSpacing: letterSpacing.tight,
    fontFamily: fontFamily.bold,
  },
};

/**
 * Responsive Text Style Generator
 * Creates a text style with responsive font size and line height
 */
export const createResponsiveTextStyle = (
  size: keyof typeof responsiveSizes,
  weight: keyof typeof weights = "normal",
  spacing: keyof typeof letterSpacing = "normal"
): TextStyle => {
  const fontSize = responsiveSizes[size]();
  const lineHeight = responsiveLineHeights[size]?.() || Math.round(fontSize * lineHeights.relaxed);

  return {
    fontSize,
    fontWeight: weights[weight],
    lineHeight,
    letterSpacing: letterSpacing[spacing],
    fontFamily: fontFamily.system,
  };
};

/**
 * Get font size by key with fallback
 */
export const getFontSize = (key: keyof typeof sizes): number => {
  return sizes[key] || sizes.body;
};

/**
 * Get line height by key with fallback
 */
export const getLineHeight = (key: keyof typeof lineHeights): number => {
  const value = lineHeights[key];
  return typeof value === "number" ? value : lineHeights.body;
};

/**
 * Accessibility helpers
 */
export const accessibility = {
  /** Maximum font scale multiplier for accessibility */
  maxFontSizeMultiplier: 1.4,

  /** Minimum font scale multiplier */
  minFontSizeMultiplier: 0.85,

  /** Whether to allow font scaling */
  allowFontScaling: true,
};

/**
 * Default export for backward compatibility
 */
export default {
  sizes,
  lineHeights,
  weights,
  letterSpacing,
  fontFamily,
  textStyles,
  responsiveSizes,
  responsiveLineHeights,
  textTransform,
  createResponsiveTextStyle,
  getFontSize,
  getLineHeight,
  accessibility,
};
