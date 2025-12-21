/**
 * Config Index - Centralized Exports for Tander App Design System
 *
 * This file provides a single import point for all design system tokens
 * and utilities. Import from this file for consistent styling across the app.
 *
 * Usage:
 * ```typescript
 * import { colors, typography, spacing, theme, seniorResponsive } from '@/config';
 * ```
 *
 * SENIOR-FRIENDLY DESIGN SYSTEM:
 * - All values optimized for elderly users (60+)
 * - Larger touch targets, fonts, and spacing
 * - High contrast colors for better visibility
 * - Responsive across all device sizes
 */

// Core Design Tokens
export { default as colors, withOpacity, darken, lighten } from "./colors";
export {
  default as typography,
  sizes as fontSizes,
  lineHeights,
  weights as fontWeights,
  letterSpacing,
  fontFamily,
  textStyles,
  responsiveSizes,
  responsiveLineHeights,
  accessibility as typographyAccessibility,
  createResponsiveTextStyle,
} from "./typography";
export {
  default as spacingConfig,
  spacing,
  responsiveSpacing,
  touchTargets,
  componentSpacing,
  layoutPercentages,
  zIndex,
  duration,
  screen,
} from "./spacing";

// Theme Configuration
export {
  default as theme,
  shadows,
  borderRadius,
  animation,
  componentStyles,
  commonStyles,
  getGap,
  getPadding,
} from "./theme";
export type { Theme, ThemeColors, ThemeTypography, ThemeSpacing } from "./theme";

// Shared Styles
export {
  default as styles,
  shadows as sharedShadows,
  cardStyles,
  buttonStyles,
  layoutStyles,
  textStyles as sharedTextStyles,
  avatarStyles,
  inputStyles,
  modalStyles,
  badgeStyles,
  dividerStyles,
  getPlaceholderAvatarUrl,
} from "./styles";

// Responsive Utilities (re-exported for convenience)
export {
  seniorResponsive,
  getResponsiveValue,
  getSimpleResponsiveValue,
  moderateScale,
  scaleFontSize,
  scaleWidth,
  scaleHeight,
  wp,
  hp,
  createShadow,
  safeArea,
  getPhotoGridSize,
  getDeviceCategory,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  BREAKPOINTS,
  isTinyDevice,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
  isTabletLarge,
} from "../utility/responsive";
export type { DeviceCategory } from "../utility/responsive";

// Fonts Configuration (legacy support)
export { default as fonts } from "./fonts";
