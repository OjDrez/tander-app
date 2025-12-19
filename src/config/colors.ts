/**
 * Color System - Comprehensive Design Tokens for Tander App
 *
 * SENIOR-FRIENDLY COLOR PRINCIPLES:
 * - High contrast ratios (WCAG AA minimum, AAA preferred)
 * - Clear visual distinction between interactive and non-interactive elements
 * - Consistent semantic colors for status and feedback
 * - Larger color blocks for better visibility
 *
 * ACCESSIBILITY STANDARDS:
 * - Text contrast: Minimum 4.5:1 for normal text, 3:1 for large text
 * - Interactive elements: Clearly distinguishable from background
 * - Status colors: Distinct hues for each status type
 * - Focus states: Clear visual feedback
 */

/**
 * Base color palette - Raw color values
 */
const palette = {
  // Orange spectrum (Primary brand)
  orange50: "#FFF7ED",
  orange100: "#FFECD4",
  orange200: "#FFE2C1",
  orange300: "#FED7AA",
  orange400: "#F7B366",
  orange500: "#F5A14B", // Primary
  orange600: "#E38F38",
  orange700: "#D97706",
  orange800: "#92400E",
  orange900: "#78350F",

  // Teal spectrum (Accent/Success)
  teal50: "#F0FDFA",
  teal100: "#E8F8F7",
  teal200: "#C8E6E2",
  teal300: "#6BB8B4",
  teal400: "#33A9A2", // Accent Teal
  teal500: "#2E908A",
  teal600: "#268580",
  teal700: "#0D9488",
  teal800: "#115E59",
  teal900: "#134E4A",

  // Blue spectrum
  blue50: "#E0F2FE",
  blue100: "#DBEAFE",
  blue200: "#BFDBFE",
  blue400: "#3B82F6",
  blue500: "#0369A1",
  blue600: "#2563EB",
  blue700: "#0B2E61", // Accent Blue
  blue800: "#1E40AF",
  blue900: "#1E3A8A",

  // Purple spectrum
  purple400: "#A855F7",
  purple500: "#8B5CF6", // Accent Purple
  purple600: "#7C3AED",

  // Red spectrum (Error/Danger)
  red50: "#FEF2F2",
  red100: "#FEE2E2",
  red200: "#FECACA",
  red400: "#F87171",
  red500: "#EF4444", // Error
  red600: "#DC2626",
  red700: "#B91C1C",
  red800: "#991B1B",
  red900: "#7F1D1D",

  // Green spectrum (Success)
  green50: "#F0FDF4",
  green100: "#DCFCE7",
  green200: "#D1FAE5",
  green300: "#BBF7D0",
  green400: "#4ADE80",
  green500: "#22C55E",
  green600: "#059669",
  green700: "#15803D",
  green800: "#166534",

  // Yellow/Amber spectrum (Warning)
  yellow50: "#FFFBEB",
  yellow100: "#FEF3C7",
  yellow200: "#FEF9C3",
  yellow400: "#FACC15",
  yellow500: "#F59E0B", // Warning
  yellow600: "#D97706",
  yellow700: "#B45309",
  yellow800: "#92400E",

  // Gray spectrum (Neutral)
  gray50: "#F9FAFB",
  gray100: "#F6F6F6",
  gray150: "#F5F5F5",
  gray200: "#F3F3F5",
  gray300: "#E5E7EB",
  gray400: "#D1D5DB",
  gray500: "#9CA3AF",
  gray600: "#717182",
  gray700: "#4B5563",
  gray800: "#1E2939",
  gray900: "#111827",

  // Pure values
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Dark mode background
  dark: "#030213",
};

/**
 * Main color exports
 */
export default {
  // ===================================
  // BRAND COLORS (Primary Identity)
  // ===================================

  /** Primary brand color - Warm Orange */
  primary: palette.orange500,

  /** Primary darker variant - For hover/pressed states */
  primaryDark: palette.orange600,

  /** Primary lighter variant - For backgrounds */
  primaryLight: palette.orange300,

  /** Primary lightest - For subtle backgrounds */
  primaryLightest: palette.orange100,

  // ===================================
  // ACCENT COLORS (Secondary Identity)
  // ===================================

  /** Accent Teal - Secondary actions, success states */
  accentTeal: palette.teal400,

  /** Accent Teal Dark - Pressed states */
  accentTealDark: palette.teal500,

  /** Accent Teal Light - Backgrounds */
  accentTealLight: palette.teal100,

  /** Accent Blue - Tertiary, links, info */
  accentBlue: palette.blue700,

  /** Accent Blue Light - Info backgrounds */
  accentBlueLight: palette.blue50,

  /** Accent Purple - Special highlights */
  accentPurple: palette.purple500,

  /** Accent Mint - Subtle teal backgrounds */
  accentMint: palette.teal100,

  /** Accent Peach - Subtle orange backgrounds */
  accentPeach: palette.orange100,

  /** Accent Orange - Alias for primary */
  accentOrange: palette.orange500,

  // ===================================
  // PRESSED/ACTIVE STATES
  // High contrast for clear feedback
  // ===================================
  pressed: {
    /** Primary button pressed */
    primary: palette.orange600,
    /** Teal button pressed */
    teal: palette.teal500,
    /** Light background pressed */
    light: palette.gray300,
    /** Dark text pressed */
    darkText: "#0A0A0A",
  },

  // ===================================
  // TEXT COLORS
  // High contrast for readability
  // ===================================

  /** Primary text - Main content (high contrast) */
  textPrimary: palette.gray800,

  /** Secondary text - Supporting content */
  textSecondary: palette.gray600,

  /** Muted text - Less important, labels */
  textMuted: "#6B7280", // Improved contrast from #A4A5A6

  /** Inverse text - White on dark backgrounds */
  textInverse: palette.white,

  /** Link text - Clickable text */
  textLink: palette.blue500,

  // ===================================
  // BASE COLORS
  // ===================================

  white: palette.white,
  black: palette.black,
  transparent: palette.transparent,

  // ===================================
  // BACKGROUNDS & SURFACES
  // ===================================

  /** Light background - Main screen background */
  backgroundLight: palette.gray100,

  /** Dark background - Dark mode */
  backgroundDark: palette.dark,

  /** Secondary background - Subtle differentiation */
  backgroundSecondary: palette.gray150,

  /** Card background - White cards */
  backgroundCard: palette.gray50,

  /** Input background - Form inputs */
  backgroundInput: palette.gray150,

  /** Orange tinted background */
  backgroundOrange: palette.orange50,

  /** Teal tinted background */
  backgroundTeal: palette.teal50,

  /** Overlay background - Modals, popups */
  backgroundOverlay: "rgba(0, 0, 0, 0.5)",

  /** Overlay light - Subtle overlays */
  backgroundOverlayLight: "rgba(0, 0, 0, 0.3)",

  // ===================================
  // BORDERS
  // ===================================

  /** Light border - Subtle separation */
  borderLight: palette.gray200,

  /** Medium border - More visible separation */
  borderMedium: palette.gray300,

  /** Dark border - Strong separation */
  borderDark: palette.gray400,

  /** Focus border - Accessibility focus ring */
  borderFocus: palette.teal400,

  // ===================================
  // STATUS COLORS - SEMANTIC
  // Clear, distinct colors for each status
  // ===================================

  // --- SUCCESS ---
  /** Success - Confirmations, completed actions */
  success: palette.teal400,

  /** Success light - Background */
  successLight: palette.green200,

  /** Success background - Containers */
  successBackground: palette.green50,

  /** Success dark - Text on light backgrounds */
  successDark: palette.green600,

  /** Success bright - Icons, emphasis */
  successBright: palette.green400,

  // --- ERROR/DANGER ---
  /** Error - Validation errors, failures */
  error: palette.red500,

  /** Danger - Destructive actions */
  danger: "#E53935", // Slightly different red for distinction

  /** Danger light - Background */
  dangerLight: palette.red100,

  /** Danger background - Containers */
  dangerBackground: palette.red50,

  /** Error light - Background */
  errorLight: palette.red100,

  /** Error background - Containers */
  errorBackground: palette.red50,

  /** Error text - Error messages */
  errorText: palette.red600,

  /** Error border - Error state borders */
  errorBorder: "#D9534F",

  // --- WARNING ---
  /** Warning - Alerts, cautions */
  warning: palette.orange500,

  /** Warning light - Background */
  warningLight: palette.yellow100,

  /** Warning background - Containers */
  warningBackground: palette.yellow50,

  /** Warning dark - Text on light backgrounds */
  warningDark: palette.yellow800,

  /** Warning bulb - Icons */
  warningBulb: palette.yellow500,

  // --- INFO ---
  /** Info - Informational messages */
  info: palette.blue500,

  /** Info light - Background */
  infoLight: palette.blue50,

  /** Info background - Containers */
  infoBackground: palette.blue50,

  // ===================================
  // DISABLED/MUTED STATES
  // ===================================

  /** Disabled background */
  disabled: palette.gray300,

  /** Disabled text - Grayed out content */
  disabledText: palette.gray500,

  /** Placeholder text - Input placeholders */
  placeholder: palette.gray500,

  // ===================================
  // SHADOWS
  // ===================================

  /** Light shadow */
  shadowLight: "rgba(0, 0, 0, 0.05)",

  /** Medium shadow */
  shadowMedium: "rgba(0, 0, 0, 0.1)",

  /** Heavy shadow */
  shadowHeavy: "rgba(0, 0, 0, 0.15)",

  /** Colored shadow - Brand */
  shadowPrimary: "rgba(245, 161, 75, 0.3)",

  /** Colored shadow - Teal */
  shadowTeal: "rgba(51, 169, 162, 0.3)",

  // ===================================
  // GRADIENTS
  // Pre-defined gradient configurations
  // ===================================
  gradients: {
    /**
     * MAIN - App-wide background gradient (Mint to Peach)
     * This is THE canonical gradient used across all screens
     */
    main: {
      start: palette.teal200,
      end: palette.orange200,
      array: [palette.teal200, palette.orange200] as const,
      locations: [0, 1] as const,
    },

    /**
     * Registration Background (legacy - use main instead)
     */
    registration: {
      start: palette.orange50,
      end: palette.teal100,
      array: [palette.orange50, palette.teal100] as const,
      locations: [0, 1] as const,
    },

    /**
     * MultiColor - 4-Stop Brand Gradient for buttons/CTAs
     */
    multiColor: {
      stops: [
        { offset: "0%", color: palette.orange500 },
        { offset: "30%", color: palette.orange400 },
        { offset: "70%", color: palette.teal300 },
        { offset: "100%", color: palette.teal400 },
      ],
      array: [palette.orange500, palette.orange400, palette.teal300, palette.teal400] as const,
      locations: [0, 0.3, 0.7, 1] as const,
    },

    /**
     * Soft Peach to Aqua - Subtle background
     */
    softAqua: {
      start: palette.orange50,
      end: palette.teal50,
      array: [palette.orange50, palette.teal50] as const,
      locations: [0, 1] as const,
    },

    /**
     * Brand Strong - Orange to Teal (Primary gradient for buttons)
     */
    brandStrong: {
      start: palette.orange500,
      end: palette.teal400,
      array: [palette.orange500, palette.teal400] as const,
      locations: [0, 1] as const,
    },

    /**
     * Success gradient - For success states
     */
    success: {
      start: palette.green400,
      end: palette.teal400,
      array: [palette.green400, palette.teal400] as const,
      locations: [0, 1] as const,
    },

    /**
     * Danger gradient - For destructive actions
     */
    danger: {
      start: palette.red500,
      end: palette.red600,
      array: [palette.red500, palette.red600] as const,
      locations: [0, 1] as const,
    },

    /**
     * Disabled gradient - For inactive buttons
     */
    disabled: {
      start: palette.gray400,
      end: palette.gray500,
      array: [palette.gray400, palette.gray500] as const,
      locations: [0, 1] as const,
    },

    /**
     * Dark overlay - For image overlays
     */
    darkOverlay: {
      start: "transparent",
      end: "rgba(0, 0, 0, 0.7)",
      array: ["transparent", "rgba(0, 0, 0, 0.7)"] as const,
      locations: [0, 1] as const,
    },

    /**
     * Card shine - Subtle highlight effect
     */
    cardShine: {
      start: "rgba(255, 255, 255, 0.1)",
      end: "transparent",
      array: ["rgba(255, 255, 255, 0.1)", "transparent"] as const,
      locations: [0, 1] as const,
    },
  },

  // ===================================
  // SOCIAL COLORS
  // ===================================
  social: {
    facebook: "#1877F2",
    google: "#4285F4",
    apple: "#000000",
    twitter: "#1DA1F2",
  },

  // ===================================
  // CHAT/MESSAGE COLORS
  // ===================================
  chat: {
    /** Own message bubble */
    ownBubble: palette.teal400,
    /** Other person's message bubble */
    theirBubble: palette.gray100,
    /** Own message text */
    ownText: palette.white,
    /** Their message text */
    theirText: palette.gray800,
    /** Timestamp text */
    timestamp: palette.gray500,
    /** Online indicator */
    online: palette.green400,
    /** Offline indicator */
    offline: palette.gray400,
  },

  // ===================================
  // MATCH/DISCOVERY COLORS
  // ===================================
  match: {
    /** Like action */
    like: palette.green400,
    /** Pass action */
    pass: palette.red500,
    /** Super like */
    superLike: palette.blue400,
    /** Match celebration */
    celebration: palette.orange500,
  },
};

/**
 * Color utility functions
 */

/**
 * Add opacity to a hex color
 * @param hex - Hex color string
 * @param opacity - Opacity value (0-1)
 */
export const withOpacity = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Darken a hex color
 * @param hex - Hex color string
 * @param amount - Amount to darken (0-1)
 */
export const darken = (hex: string, amount: number): string => {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

/**
 * Lighten a hex color
 * @param hex - Hex color string
 * @param amount - Amount to lighten (0-1)
 */
export const lighten = (hex: string, amount: number): string => {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};
