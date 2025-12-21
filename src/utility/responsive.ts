/**
 * Responsive Utilities - Comprehensive Scaling System for Tander App
 *
 * SENIOR-FRIENDLY DESIGN:
 * - All sizes are intentionally larger than standard mobile guidelines
 * - Touch targets exceed 44px minimum (56px+ for primary actions)
 * - Font sizes are 20-30% larger than typical for better readability
 * - High contrast and clear visual hierarchy
 *
 * RESPONSIVE DESIGN:
 * - Supports all mobile phone sizes (320px - 428px+)
 * - Tablet support (768px+)
 * - Uses iPhone 14 Pro (393px) as base reference
 * - Scales proportionally across all devices
 */

import { Dimensions, PixelRatio, Platform } from "react-native";

// Get screen dimensions - use 'window' for consistency
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base design dimensions (iPhone 14 Pro as reference)
const BASE_WIDTH = 393;
const BASE_HEIGHT = 852;

/**
 * Screen size breakpoints
 * Covers all common mobile phone and tablet sizes
 */
export const BREAKPOINTS = {
  tiny: 320,      // iPhone SE 1st gen, older Android
  small: 360,     // iPhone SE 2nd/3rd gen, small Android
  medium: 390,    // iPhone 14, Pixel 6, standard phones
  large: 428,     // iPhone 14 Pro Max, Galaxy S series
  xlarge: 480,    // Large phablets
  tablet: 768,    // iPad Mini, Android tablets
  tabletLarge: 1024, // iPad Pro
};

/**
 * Device type detection - responsive to all screen sizes
 */
export const isTinyDevice = SCREEN_WIDTH < BREAKPOINTS.tiny;
export const isSmallDevice = SCREEN_WIDTH >= BREAKPOINTS.tiny && SCREEN_WIDTH < BREAKPOINTS.small;
export const isMediumDevice = SCREEN_WIDTH >= BREAKPOINTS.small && SCREEN_WIDTH < BREAKPOINTS.large;
export const isLargeDevice = SCREEN_WIDTH >= BREAKPOINTS.large && SCREEN_WIDTH < BREAKPOINTS.tablet;
export const isTablet = SCREEN_WIDTH >= BREAKPOINTS.tablet;
export const isTabletLarge = SCREEN_WIDTH >= BREAKPOINTS.tabletLarge;

/**
 * Device category for simplified responsive logic
 */
export type DeviceCategory = 'tiny' | 'small' | 'medium' | 'large' | 'tablet';

export const getDeviceCategory = (): DeviceCategory => {
  if (SCREEN_WIDTH < BREAKPOINTS.small) return 'tiny';
  if (SCREEN_WIDTH < BREAKPOINTS.medium) return 'small';
  if (SCREEN_WIDTH < BREAKPOINTS.large) return 'medium';
  if (SCREEN_WIDTH < BREAKPOINTS.tablet) return 'large';
  return 'tablet';
};

/**
 * Width percentage - Convert percentage to actual pixels
 * @param percentage - Percentage of screen width (0-100)
 */
export const wp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_WIDTH * percentage) / 100);
};

/**
 * Height percentage - Convert percentage to actual pixels
 * @param percentage - Percentage of screen height (0-100)
 */
export const hp = (percentage: number): number => {
  return PixelRatio.roundToNearestPixel((SCREEN_HEIGHT * percentage) / 100);
};

/**
 * Scale width - Scale a value based on screen width ratio
 * @param size - Base size in pixels
 */
export const scaleWidth = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Scale height - Scale a value based on screen height ratio
 * @param size - Base size in pixels
 */
export const scaleHeight = (size: number): number => {
  const scale = SCREEN_HEIGHT / BASE_HEIGHT;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * Moderate scale - Balanced scaling between width/height
 * Best for fonts, padding, margins
 * @param size - Base size in pixels
 * @param factor - Scaling factor (0-1), default 0.5
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size + (scale - 1) * size * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

/**
 * SENIOR-FRIENDLY Font Scaling
 * Scales fonts with accessibility limits for readability
 * - Minimum: 85% of base size (never too small)
 * - Maximum: 140% of base size (prevents layout breaks)
 * - Floor at 14px minimum (increased from 12px for seniors)
 * @param size - Base font size
 */
export const scaleFontSize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;

  // Senior-friendly limits: never too small, not too large
  const minSize = Math.max(14, size * 0.85); // Minimum 14px for seniors
  const maxSize = size * 1.4; // Allow up to 40% larger

  return Math.round(Math.min(Math.max(newSize, minSize), maxSize));
};

/**
 * Get responsive value based on device category
 * Provides values for each screen size category
 */
export const getResponsiveValue = <T>(
  tiny: T,
  small: T,
  medium: T,
  large: T,
  tablet?: T
): T => {
  if (SCREEN_WIDTH < BREAKPOINTS.small) return tiny;
  if (SCREEN_WIDTH < BREAKPOINTS.medium) return small;
  if (SCREEN_WIDTH < BREAKPOINTS.large) return medium;
  if (SCREEN_WIDTH < BREAKPOINTS.tablet) return large;
  return tablet ?? large;
};

/**
 * Simplified responsive value - 3 breakpoints
 */
export const getSimpleResponsiveValue = <T>(
  small: T,
  medium: T,
  large: T
): T => {
  if (SCREEN_WIDTH < BREAKPOINTS.medium) return small;
  if (SCREEN_WIDTH < BREAKPOINTS.tablet) return medium;
  return large;
};

/**
 * SENIOR-FRIENDLY Responsive Sizing
 *
 * All values are intentionally larger than standard mobile guidelines:
 * - Touch targets: 56-80px (vs 44px standard)
 * - Icons: 20-40px (vs 16-24px standard)
 * - Text: 16-38px (vs 12-28px standard)
 * - Padding: 16-32px (vs 8-16px standard)
 */
export const seniorResponsive = {
  // ===================================
  // TOUCH TARGETS (CRITICAL FOR SENIORS)
  // ===================================

  /**
   * Minimum touch target for any interactive element
   * Standard: 44px, Senior-friendly: 52-64px
   */
  touchTargetMin: (): number => {
    return getResponsiveValue(52, 52, 56, 60, 64);
  },

  /**
   * Standard touch target for buttons, list items
   * Standard: 44-48px, Senior-friendly: 56-72px
   */
  touchTarget: (): number => {
    return getResponsiveValue(56, 56, 64, 72, 80);
  },

  /**
   * Large touch target for primary actions, modals
   */
  touchTargetLarge: (): number => {
    return getResponsiveValue(64, 64, 72, 80, 88);
  },

  /**
   * Extra large touch target for critical actions
   */
  touchTargetXL: (): number => {
    return getResponsiveValue(72, 72, 80, 88, 96);
  },

  // ===================================
  // ICON SIZES
  // ===================================

  iconTiny: (): number => {
    return getResponsiveValue(16, 18, 20, 22, 24);
  },

  iconSmall: (): number => {
    return getResponsiveValue(20, 22, 24, 28, 32);
  },

  iconMedium: (): number => {
    return getResponsiveValue(24, 28, 32, 36, 40);
  },

  iconLarge: (): number => {
    return getResponsiveValue(32, 36, 40, 48, 56);
  },

  iconXL: (): number => {
    return getResponsiveValue(48, 56, 64, 72, 80);
  },

  // Navigation/Tab bar icons (need to be prominent)
  iconNav: (): number => {
    return getResponsiveValue(26, 28, 32, 36, 40);
  },

  // ===================================
  // SPACING & PADDING
  // ===================================

  /**
   * Screen content padding (horizontal)
   */
  contentPadding: (): number => {
    return getResponsiveValue(16, 18, 20, 24, 32);
  },

  /**
   * Card internal padding
   */
  cardPadding: (): number => {
    return getResponsiveValue(16, 18, 20, 24, 28);
  },

  /**
   * Button internal padding (vertical)
   */
  buttonPaddingV: (): number => {
    return getResponsiveValue(14, 16, 18, 20, 22);
  },

  /**
   * Button internal padding (horizontal)
   */
  buttonPaddingH: (): number => {
    return getResponsiveValue(20, 24, 28, 32, 36);
  },

  /**
   * Input field padding
   */
  inputPadding: (): number => {
    return getResponsiveValue(14, 16, 18, 20, 24);
  },

  // ===================================
  // GAPS (SPACING BETWEEN ELEMENTS)
  // ===================================

  gapTiny: (): number => {
    return getResponsiveValue(4, 4, 6, 8, 10);
  },

  gapSmall: (): number => {
    return getResponsiveValue(8, 10, 12, 14, 16);
  },

  gapMedium: (): number => {
    return getResponsiveValue(12, 14, 16, 20, 24);
  },

  gapLarge: (): number => {
    return getResponsiveValue(16, 20, 24, 28, 32);
  },

  gapXL: (): number => {
    return getResponsiveValue(24, 28, 32, 40, 48);
  },

  // ===================================
  // BORDER RADIUS
  // ===================================

  radiusSmall: (): number => {
    return getResponsiveValue(8, 10, 12, 14, 16);
  },

  radiusMedium: (): number => {
    return getResponsiveValue(12, 14, 16, 20, 24);
  },

  radiusLarge: (): number => {
    return getResponsiveValue(16, 18, 20, 24, 28);
  },

  radiusCard: (): number => {
    return getResponsiveValue(16, 20, 24, 28, 32);
  },

  // Backward-compatible alias for radiusCard
  cardRadius: (): number => {
    return getResponsiveValue(16, 20, 24, 28, 32);
  },

  radiusButton: (): number => {
    return getResponsiveValue(20, 24, 28, 32, 36);
  },

  // Backward-compatible alias for radiusButton
  buttonRadius: (): number => {
    return getResponsiveValue(20, 24, 28, 32, 36);
  },

  radiusPill: (): number => {
    return getResponsiveValue(30, 36, 40, 48, 56);
  },

  // ===================================
  // BUTTON HEIGHTS
  // ===================================

  /**
   * Standard button height
   */
  buttonHeight: (): number => {
    return getResponsiveValue(52, 56, 60, 64, 72);
  },

  /**
   * Large button height (primary actions)
   */
  buttonHeightLarge: (): number => {
    return getResponsiveValue(56, 60, 64, 72, 80);
  },

  /**
   * Modal button height (extra prominent)
   */
  modalButtonHeight: (): number => {
    return getResponsiveValue(64, 72, 80, 88, 96);
  },

  // ===================================
  // HEADER & NAVIGATION
  // ===================================

  headerHeight: (): number => {
    return getResponsiveValue(56, 60, 64, 72, 80);
  },

  tabBarHeight: (): number => {
    return getResponsiveValue(64, 72, 80, 88, 96);
  },

  // ===================================
  // AVATAR SIZES
  // ===================================

  avatarTiny: (): number => {
    return getResponsiveValue(32, 36, 40, 44, 48);
  },

  avatarSmall: (): number => {
    return getResponsiveValue(44, 48, 52, 56, 64);
  },

  avatarMedium: (): number => {
    return getResponsiveValue(56, 64, 72, 80, 88);
  },

  avatarLarge: (): number => {
    return getResponsiveValue(80, 96, 112, 128, 144);
  },

  avatarXL: (): number => {
    return getResponsiveValue(120, 140, 160, 180, 200);
  },

  // ===================================
  // PROFILE & PHOTOS
  // ===================================

  profilePhotoHeight: (): number => {
    return getResponsiveValue(280, 320, 360, 400, 450);
  },

  photoGridSize: (): number => {
    const padding = seniorResponsive.contentPadding();
    const gap = seniorResponsive.gapSmall();
    const columns = isTablet ? 4 : 3;
    const availableWidth = SCREEN_WIDTH - (padding * 2);
    const totalGaps = gap * (columns - 1);
    return Math.floor((availableWidth - totalGaps) / columns);
  },

  // ===================================
  // MESSAGE BUBBLES
  // ===================================

  messageBubbleMaxWidth: (): string => {
    if (isTablet) return "55%";
    if (isLargeDevice) return "70%";
    return "85%";
  },

  messagePaddingH: (): number => {
    return getResponsiveValue(18, 20, 24, 28, 32);
  },

  messagePaddingV: (): number => {
    return getResponsiveValue(14, 16, 18, 20, 24);
  },

  // ===================================
  // SWIPE CARD (DISCOVERY)
  // ===================================

  swipeCardHeight: (): number => {
    return Math.round(SCREEN_HEIGHT * (isTablet ? 0.6 : 0.65));
  },

  swipeCardWidth: (): number => {
    const padding = seniorResponsive.contentPadding();
    return SCREEN_WIDTH - (padding * 2);
  },

  swipeActionButtonSize: (): number => {
    return getResponsiveValue(64, 72, 80, 88, 96);
  },

  // ===================================
  // FONT SIZES (SENIOR-FRIENDLY)
  // ===================================

  fontSizeBody: (): number => {
    return scaleFontSize(getResponsiveValue(16, 17, 18, 20, 22));
  },

  fontSizeSmall: (): number => {
    return scaleFontSize(getResponsiveValue(14, 15, 16, 18, 20));
  },

  fontSizeLarge: (): number => {
    return scaleFontSize(getResponsiveValue(18, 20, 22, 24, 26));
  },

  fontSizeH1: (): number => {
    return scaleFontSize(getResponsiveValue(32, 34, 38, 42, 48));
  },

  fontSizeH2: (): number => {
    return scaleFontSize(getResponsiveValue(26, 28, 32, 36, 40));
  },

  fontSizeH3: (): number => {
    return scaleFontSize(getResponsiveValue(22, 24, 26, 30, 34));
  },

  fontSizeH4: (): number => {
    return scaleFontSize(getResponsiveValue(20, 21, 22, 24, 28));
  },

  // ===================================
  // LINE HEIGHTS (SENIOR-FRIENDLY)
  // ===================================

  lineHeightBody: (): number => {
    return Math.round(seniorResponsive.fontSizeBody() * 1.6);
  },

  lineHeightSmall: (): number => {
    return Math.round(seniorResponsive.fontSizeSmall() * 1.55);
  },

  lineHeightLarge: (): number => {
    return Math.round(seniorResponsive.fontSizeLarge() * 1.5);
  },

  lineHeightHeading: (): number => {
    return Math.round(seniorResponsive.fontSizeH2() * 1.3);
  },
};

/**
 * Calculate photo grid size based on screen width
 */
export const getPhotoGridSize = (
  photosPerRow: number,
  contentPadding: number,
  cardPadding: number,
  photoGap: number
): number => {
  const availableWidth = SCREEN_WIDTH - contentPadding * 2 - cardPadding * 2;
  const totalGapWidth = photoGap * (photosPerRow - 1);
  return Math.floor((availableWidth - totalGapWidth) / photosPerRow);
};

/**
 * Platform-specific shadow generator
 * Returns appropriate shadow styles for iOS and Android
 */
export const createShadow = (
  elevation: number = 4,
  color: string = "rgba(0, 0, 0, 0.1)"
) => {
  return Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: Math.round(elevation * 0.5) },
      shadowOpacity: 0.15 + (elevation * 0.02),
      shadowRadius: elevation * 1.5,
    },
    android: {
      elevation: elevation,
    },
  });
};

/**
 * Safe area dimensions helper
 * Returns additional padding for notched devices
 */
export const safeArea = {
  top: Platform.select({ ios: 44, android: 24 }) || 44,
  bottom: Platform.select({ ios: 34, android: 0 }) || 34,
};

// Export screen dimensions for convenience
export { SCREEN_WIDTH, SCREEN_HEIGHT };

export default {
  wp,
  hp,
  scaleWidth,
  scaleHeight,
  moderateScale,
  scaleFontSize,
  seniorResponsive,
  getResponsiveValue,
  getSimpleResponsiveValue,
  getPhotoGridSize,
  createShadow,
  safeArea,
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
};
