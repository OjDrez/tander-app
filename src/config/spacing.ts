/**
 * Spacing System - Comprehensive Design Tokens for Tander App
 *
 * SENIOR-FRIENDLY DESIGN PRINCIPLES:
 * - All spacing values are generous for easy tapping and reading
 * - Touch targets exceed 44px minimum (56px+ for primary actions)
 * - Consistent spacing scale based on 4px base unit
 * - Clear visual hierarchy through spacing
 *
 * RESPONSIVE DESIGN:
 * - Values scale appropriately across device sizes
 * - Uses 4px base unit for mathematical consistency
 * - Breakpoint-aware spacing recommendations
 */

import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Base unit for spacing (4px system)
const BASE_UNIT = 4;

// Device size detection
const isSmallDevice = SCREEN_WIDTH < 360;
const isMediumDevice = SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 428;
const isLargeDevice = SCREEN_WIDTH >= 428 && SCREEN_WIDTH < 768;
const isTablet = SCREEN_WIDTH >= 768;

/**
 * Get device multiplier for responsive spacing
 * Small devices: 1x, Medium: 1.1x, Large: 1.2x, Tablet: 1.3x
 */
const getDeviceMultiplier = (): number => {
  if (isSmallDevice) return 1;
  if (isMediumDevice) return 1.1;
  if (isLargeDevice) return 1.2;
  return 1.3; // Tablet
};

/**
 * Scale a spacing value responsively
 */
const scaleSpacing = (value: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel(value * getDeviceMultiplier()));
};

/**
 * Core Spacing Scale (based on 4px unit)
 *
 * xxs: 4px  - Minimal spacing (icon gaps, inline elements)
 * xs:  8px  - Tight spacing (small gaps, compact lists)
 * sm:  12px - Small spacing (between related elements)
 * md:  16px - Medium spacing (standard component padding)
 * lg:  20px - Large spacing (section gaps)
 * xl:  24px - Extra large (major section breaks)
 * xxl: 32px - Double extra large (page sections)
 * xxxl: 40px - Triple extra large (hero spacing)
 * huge: 48px - Huge spacing (major visual breaks)
 * massive: 64px - Massive spacing (screen-level separation)
 */
export const spacing = {
  // Fixed spacing (non-responsive)
  none: 0,
  xxs: BASE_UNIT,           // 4px
  xs: BASE_UNIT * 2,        // 8px
  sm: BASE_UNIT * 3,        // 12px
  md: BASE_UNIT * 4,        // 16px
  lg: BASE_UNIT * 5,        // 20px
  xl: BASE_UNIT * 6,        // 24px
  xxl: BASE_UNIT * 8,       // 32px
  xxxl: BASE_UNIT * 10,     // 40px
  huge: BASE_UNIT * 12,     // 48px
  massive: BASE_UNIT * 16,  // 64px
};

/**
 * Responsive Spacing - Scales based on device size
 * Use these for layout-critical spacing that should adapt
 */
export const responsiveSpacing = {
  xxs: () => scaleSpacing(spacing.xxs),
  xs: () => scaleSpacing(spacing.xs),
  sm: () => scaleSpacing(spacing.sm),
  md: () => scaleSpacing(spacing.md),
  lg: () => scaleSpacing(spacing.lg),
  xl: () => scaleSpacing(spacing.xl),
  xxl: () => scaleSpacing(spacing.xxl),
  xxxl: () => scaleSpacing(spacing.xxxl),
  huge: () => scaleSpacing(spacing.huge),
  massive: () => scaleSpacing(spacing.massive),
};

/**
 * SENIOR-FRIENDLY Touch Targets
 *
 * All interactive elements must meet these minimum sizes:
 * - Minimum: 56px (Apple recommends 44px, we exceed this)
 * - Standard: 60px (comfortable for most seniors)
 * - Large: 72px (modal buttons, primary actions)
 * - Extra Large: 80px (critical actions, tablet)
 */
export const touchTargets = {
  minimum: (): number => {
    if (isSmallDevice) return 52;
    if (isMediumDevice) return 56;
    if (isLargeDevice) return 60;
    return 64; // Tablet
  },

  standard: (): number => {
    if (isSmallDevice) return 56;
    if (isMediumDevice) return 60;
    if (isLargeDevice) return 64;
    return 72; // Tablet
  },

  large: (): number => {
    if (isSmallDevice) return 64;
    if (isMediumDevice) return 72;
    if (isLargeDevice) return 76;
    return 80; // Tablet
  },

  extraLarge: (): number => {
    if (isSmallDevice) return 72;
    if (isMediumDevice) return 80;
    if (isLargeDevice) return 88;
    return 96; // Tablet
  },
};

/**
 * Component-Specific Spacing
 * Pre-calculated spacing for common UI patterns
 */
export const componentSpacing = {
  // Button padding
  button: {
    paddingVertical: (): number => {
      if (isSmallDevice) return 14;
      if (isMediumDevice) return 16;
      if (isLargeDevice) return 18;
      return 20;
    },
    paddingHorizontal: (): number => {
      if (isSmallDevice) return 20;
      if (isMediumDevice) return 24;
      if (isLargeDevice) return 28;
      return 32;
    },
    minHeight: touchTargets.standard,
    gap: (): number => scaleSpacing(spacing.sm),
  },

  // Card padding
  card: {
    padding: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    gap: (): number => {
      if (isSmallDevice) return 12;
      if (isMediumDevice) return 16;
      if (isLargeDevice) return 18;
      return 20;
    },
    borderRadius: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
  },

  // Input field spacing
  input: {
    paddingVertical: (): number => {
      if (isSmallDevice) return 14;
      if (isMediumDevice) return 16;
      if (isLargeDevice) return 18;
      return 20;
    },
    paddingHorizontal: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    minHeight: touchTargets.minimum,
    borderRadius: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    iconSize: (): number => {
      if (isSmallDevice) return 22;
      if (isMediumDevice) return 24;
      if (isLargeDevice) return 26;
      return 28;
    },
    gap: (): number => scaleSpacing(spacing.sm),
  },

  // Screen/content padding
  screen: {
    paddingHorizontal: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 32;
    },
    paddingTop: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    paddingBottom: (): number => {
      if (isSmallDevice) return 24;
      if (isMediumDevice) return 32;
      if (isLargeDevice) return 40;
      return 48;
    },
    gap: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
  },

  // List item spacing
  listItem: {
    paddingVertical: (): number => {
      if (isSmallDevice) return 14;
      if (isMediumDevice) return 16;
      if (isLargeDevice) return 18;
      return 20;
    },
    paddingHorizontal: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 18;
      if (isLargeDevice) return 20;
      return 24;
    },
    minHeight: touchTargets.standard,
    gap: (): number => scaleSpacing(spacing.md),
  },

  // Modal spacing
  modal: {
    padding: (): number => {
      if (isSmallDevice) return 20;
      if (isMediumDevice) return 24;
      if (isLargeDevice) return 28;
      return 32;
    },
    borderRadius: (): number => {
      if (isSmallDevice) return 20;
      if (isMediumDevice) return 24;
      if (isLargeDevice) return 28;
      return 32;
    },
    gap: (): number => {
      if (isSmallDevice) return 20;
      if (isMediumDevice) return 24;
      if (isLargeDevice) return 28;
      return 32;
    },
    buttonHeight: touchTargets.large,
  },

  // Header spacing
  header: {
    height: (): number => {
      if (isSmallDevice) return 56;
      if (isMediumDevice) return 60;
      if (isLargeDevice) return 64;
      return 72;
    },
    paddingHorizontal: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    iconSize: (): number => {
      if (isSmallDevice) return 24;
      if (isMediumDevice) return 28;
      if (isLargeDevice) return 32;
      return 36;
    },
  },

  // Tab bar spacing
  tabBar: {
    height: (): number => {
      if (isSmallDevice) return 64;
      if (isMediumDevice) return 72;
      if (isLargeDevice) return 80;
      return 88;
    },
    iconSize: (): number => {
      if (isSmallDevice) return 24;
      if (isMediumDevice) return 28;
      if (isLargeDevice) return 32;
      return 36;
    },
    paddingBottom: (): number => {
      if (isSmallDevice) return 8;
      if (isMediumDevice) return 12;
      if (isLargeDevice) return 16;
      return 20;
    },
  },

  // Avatar sizes
  avatar: {
    small: (): number => {
      if (isSmallDevice) return 44;
      if (isMediumDevice) return 48;
      if (isLargeDevice) return 52;
      return 56;
    },
    medium: (): number => {
      if (isSmallDevice) return 56;
      if (isMediumDevice) return 64;
      if (isLargeDevice) return 72;
      return 80;
    },
    large: (): number => {
      if (isSmallDevice) return 80;
      if (isMediumDevice) return 96;
      if (isLargeDevice) return 112;
      return 128;
    },
    extraLarge: (): number => {
      if (isSmallDevice) return 120;
      if (isMediumDevice) return 140;
      if (isLargeDevice) return 160;
      return 180;
    },
  },

  // Icon sizes - SENIOR-FRIENDLY (larger than standard)
  icon: {
    tiny: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 18;
      if (isLargeDevice) return 20;
      return 22;
    },
    small: (): number => {
      if (isSmallDevice) return 20;
      if (isMediumDevice) return 22;
      if (isLargeDevice) return 24;
      return 28;
    },
    medium: (): number => {
      if (isSmallDevice) return 24;
      if (isMediumDevice) return 28;
      if (isLargeDevice) return 32;
      return 36;
    },
    large: (): number => {
      if (isSmallDevice) return 32;
      if (isMediumDevice) return 36;
      if (isLargeDevice) return 40;
      return 48;
    },
    extraLarge: (): number => {
      if (isSmallDevice) return 48;
      if (isMediumDevice) return 56;
      if (isLargeDevice) return 64;
      return 72;
    },
  },

  // Border radius presets
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    full: 9999,

    // Responsive border radius
    button: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    card: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    input: (): number => {
      if (isSmallDevice) return 16;
      if (isMediumDevice) return 20;
      if (isLargeDevice) return 24;
      return 28;
    },
    pill: (): number => {
      if (isSmallDevice) return 30;
      if (isMediumDevice) return 36;
      if (isLargeDevice) return 40;
      return 48;
    },
  },

  // Gap sizes for flex layouts
  gap: {
    none: 0,
    xxs: (): number => scaleSpacing(spacing.xxs),
    xs: (): number => scaleSpacing(spacing.xs),
    sm: (): number => scaleSpacing(spacing.sm),
    md: (): number => scaleSpacing(spacing.md),
    lg: (): number => scaleSpacing(spacing.lg),
    xl: (): number => scaleSpacing(spacing.xl),
  },
};

/**
 * Layout percentages for responsive design
 */
export const layoutPercentages = {
  // Content width constraints (for tablets)
  maxContentWidth: isTablet ? 600 : SCREEN_WIDTH,

  // Card widths
  fullWidth: "100%",
  halfWidth: "50%",
  thirdWidth: "33.33%",
  twoThirds: "66.67%",
  quarterWidth: "25%",
  threeQuarters: "75%",

  // Message bubble width
  messageBubbleMaxWidth: isTablet ? "65%" : "85%",

  // Photo grid
  photoGridColumns: isTablet ? 4 : 3,
};

/**
 * Z-Index scale for layering
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 400,
  popover: 500,
  toast: 600,
  tooltip: 700,
  overlay: 800,
  max: 9999,
};

/**
 * Animation/transition durations (in ms)
 */
export const duration = {
  instant: 0,
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
  slowest: 750,
};

/**
 * Screen dimension helpers
 */
export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice,
  isMediumDevice,
  isLargeDevice,
  isTablet,
};

export default {
  spacing,
  responsiveSpacing,
  touchTargets,
  componentSpacing,
  layoutPercentages,
  zIndex,
  duration,
  screen,
};
