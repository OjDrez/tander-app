/**
 * Shared Styles - Reusable Component Styles for Tander App
 *
 * SENIOR-FRIENDLY DESIGN:
 * - All touch targets exceed 56px minimum
 * - Large, readable text sizes
 * - High contrast colors
 * - Generous padding and spacing
 *
 * RESPONSIVE DESIGN:
 * - All values scale with device size
 * - Uses seniorResponsive utilities
 * - Consistent across all screen sizes
 */

import { Platform, StyleSheet, ViewStyle, TextStyle } from "react-native";
import colors from "./colors";
import typography, { fontFamily } from "./typography";
import { seniorResponsive } from "../utility/responsive";

/**
 * Shadow Styles
 * Platform-specific shadows for iOS and Android
 */
export const shadows = {
  /** Extra small shadow - subtle elevation */
  xs: Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
  }) as ViewStyle,

  /** Small shadow - cards, list items */
  light: Platform.select({
    ios: {
      shadowColor: colors.shadowLight,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
  }) as ViewStyle,

  /** Medium shadow - elevated cards, buttons */
  medium: Platform.select({
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

  /** Large shadow - modals, popovers */
  heavy: Platform.select({
    ios: {
      shadowColor: colors.shadowHeavy,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
    },
    android: {
      elevation: 6,
    },
  }) as ViewStyle,

  /** Extra large shadow - toast, overlays */
  xl: Platform.select({
    ios: {
      shadowColor: colors.shadowHeavy,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
  }) as ViewStyle,

  /** Primary colored shadow */
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

  /** Teal colored shadow */
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
 * Card Styles
 * Senior-friendly with larger touch targets and clear visual hierarchy
 */
export const cardStyles = StyleSheet.create({
  /** Standard card - for general content */
  card: {
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.light,
  } as ViewStyle,

  /** Elevated card - more prominent */
  cardElevated: {
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 0,
    ...shadows.medium,
  } as ViewStyle,

  /** List item card - for settings, menus */
  listCard: {
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusMedium(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.cardPadding(),
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: seniorResponsive.touchTarget(),
    ...shadows.light,
  } as ViewStyle,

  /** Profile card - with avatar area */
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.light,
  } as ViewStyle,

  /** Section grouping - for organizing related items */
  section: {
    gap: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Card group - for stacked cards */
  cardGroup: {
    gap: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Info card - highlighted information */
  infoCard: {
    backgroundColor: colors.accentTealLight,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.accentTeal,
  } as ViewStyle,

  /** Warning card - alerts and cautions */
  warningCard: {
    backgroundColor: colors.warningBackground,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.warning,
  } as ViewStyle,

  /** Error card - for error states */
  errorCard: {
    backgroundColor: colors.errorBackground,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    borderWidth: 1,
    borderColor: colors.error,
  } as ViewStyle,
});

/**
 * Button Styles
 * Senior-friendly with large touch targets
 */
export const buttonStyles = StyleSheet.create({
  /** Primary button - main actions */
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: seniorResponsive.radiusButton(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.buttonPaddingH(),
    minHeight: seniorResponsive.buttonHeight(),
    gap: seniorResponsive.gapSmall(),
    ...shadows.medium,
  } as ViewStyle,

  /** Primary disabled state */
  primaryDisabled: {
    backgroundColor: colors.disabled,
    opacity: 0.7,
  } as ViewStyle,

  /** Secondary button - alternative actions */
  secondary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentTeal,
    borderRadius: seniorResponsive.radiusButton(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.buttonPaddingH(),
    minHeight: seniorResponsive.buttonHeight(),
    gap: seniorResponsive.gapSmall(),
    ...shadows.medium,
  } as ViewStyle,

  /** Outline button - less prominent */
  outline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: seniorResponsive.radiusButton(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.buttonPaddingH(),
    minHeight: seniorResponsive.buttonHeight(),
    gap: seniorResponsive.gapSmall(),
  } as ViewStyle,

  /** Ghost button - minimal style */
  ghost: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.transparent,
    borderRadius: seniorResponsive.radiusButton(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.buttonPaddingH(),
    minHeight: seniorResponsive.buttonHeight(),
    gap: seniorResponsive.gapSmall(),
  } as ViewStyle,

  /** Danger button - destructive actions */
  danger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    borderRadius: seniorResponsive.radiusButton(),
    paddingVertical: seniorResponsive.buttonPaddingV(),
    paddingHorizontal: seniorResponsive.buttonPaddingH(),
    minHeight: seniorResponsive.buttonHeight(),
    gap: seniorResponsive.gapSmall(),
    ...shadows.medium,
  } as ViewStyle,

  /** Icon badge - for icons in buttons/list items */
  iconBadge: {
    height: seniorResponsive.touchTargetMin(),
    width: seniorResponsive.touchTargetMin(),
    borderRadius: seniorResponsive.radiusMedium(),
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  } as ViewStyle,

  /** Back button - navigation */
  backButton: {
    height: seniorResponsive.touchTarget(),
    width: seniorResponsive.touchTarget(),
    borderRadius: seniorResponsive.radiusMedium(),
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    ...shadows.light,
  } as ViewStyle,

  /** Icon button - circular */
  iconButton: {
    height: seniorResponsive.touchTarget(),
    width: seniorResponsive.touchTarget(),
    borderRadius: seniorResponsive.touchTarget() / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    ...shadows.light,
  } as ViewStyle,

  /** Small button - secondary actions */
  small: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: seniorResponsive.radiusMedium(),
    paddingVertical: seniorResponsive.gapSmall(),
    paddingHorizontal: seniorResponsive.gapMedium(),
    minHeight: seniorResponsive.touchTargetMin(),
    gap: seniorResponsive.gapTiny(),
    ...shadows.light,
  } as ViewStyle,
});

/**
 * Layout Styles
 * Screen and content container styles
 */
export const layoutStyles = StyleSheet.create({
  /** Full screen container */
  screen: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  } as ViewStyle,

  /** Screen with white background */
  screenWhite: {
    flex: 1,
    backgroundColor: colors.white,
  } as ViewStyle,

  /** Safe area container */
  safeArea: {
    flex: 1,
  } as ViewStyle,

  /** Standard content padding */
  content: {
    paddingHorizontal: seniorResponsive.contentPadding(),
    paddingTop: seniorResponsive.gapLarge(),
    paddingBottom: seniorResponsive.gapXL(),
    gap: seniorResponsive.gapLarge(),
  } as ViewStyle,

  /** Scroll content - with extra bottom padding */
  scrollContent: {
    paddingHorizontal: seniorResponsive.contentPadding(),
    paddingTop: seniorResponsive.gapLarge(),
    paddingBottom: seniorResponsive.gapXL() + 40,
    gap: seniorResponsive.gapLarge(),
  } as ViewStyle,

  /** Centered loading container */
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: seniorResponsive.contentPadding(),
  } as ViewStyle,

  /** Empty state container */
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: seniorResponsive.contentPadding(),
    gap: seniorResponsive.gapLarge(),
  } as ViewStyle,

  /** Row layout */
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Row with space between */
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  } as ViewStyle,

  /** Column layout */
  column: {
    flexDirection: "column",
    gap: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Flex item */
  flexItem: {
    flex: 1,
  } as ViewStyle,

  /** Center content */
  center: {
    justifyContent: "center",
    alignItems: "center",
  } as ViewStyle,

  /** Absolute fill */
  absoluteFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  } as ViewStyle,
});

/**
 * Text Styles
 * Reusable text styles beyond AppText component
 */
export const textStyles = StyleSheet.create({
  /** Section title - uppercase label */
  sectionTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.widest,
    textTransform: "uppercase",
    color: colors.textSecondary,
    marginLeft: 4,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Screen title */
  screenTitle: {
    fontSize: typography.sizes.h2,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    lineHeight: typography.lineHeights.h2,
    fontFamily: fontFamily.bold,
  } as TextStyle,

  /** Card title */
  cardTitle: {
    fontSize: typography.sizes.h4,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    lineHeight: typography.lineHeights.h4,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Body text */
  body: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.normal,
    color: colors.textPrimary,
    lineHeight: typography.lineHeights.body,
    fontFamily: fontFamily.regular,
  } as TextStyle,

  /** Body text - secondary color */
  bodySecondary: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.normal,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.body,
    fontFamily: fontFamily.regular,
  } as TextStyle,

  /** Small text */
  small: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.normal,
    color: colors.textSecondary,
    lineHeight: typography.lineHeights.small,
    fontFamily: fontFamily.regular,
  } as TextStyle,

  /** Caption text */
  caption: {
    fontSize: typography.sizes.tiny,
    fontWeight: typography.weights.normal,
    color: colors.textMuted,
    lineHeight: typography.lineHeights.tiny,
    fontFamily: fontFamily.regular,
  } as TextStyle,

  /** Error text */
  error: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.errorText,
    lineHeight: typography.lineHeights.small,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Link text */
  link: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.medium,
    color: colors.accentTeal,
    lineHeight: typography.lineHeights.body,
    textDecorationLine: "underline",
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Button text - primary */
  buttonPrimary: {
    fontSize: typography.sizes.button,
    fontWeight: typography.weights.semibold,
    color: colors.white,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Button text - secondary */
  buttonSecondary: {
    fontSize: typography.sizes.button,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: fontFamily.medium,
  } as TextStyle,
});

/**
 * Avatar Styles
 * Profile photo and avatar sizes
 */
export const avatarStyles = StyleSheet.create({
  /** Tiny avatar - inline mentions */
  tiny: {
    height: seniorResponsive.avatarTiny(),
    width: seniorResponsive.avatarTiny(),
    borderRadius: seniorResponsive.avatarTiny() / 2,
    backgroundColor: colors.borderLight,
  } as ViewStyle,

  /** Small avatar - list items */
  small: {
    height: seniorResponsive.avatarSmall(),
    width: seniorResponsive.avatarSmall(),
    borderRadius: seniorResponsive.avatarSmall() / 2,
    backgroundColor: colors.borderLight,
  } as ViewStyle,

  /** Medium avatar - profile cards */
  medium: {
    height: seniorResponsive.avatarMedium(),
    width: seniorResponsive.avatarMedium(),
    borderRadius: seniorResponsive.avatarMedium() / 2,
    backgroundColor: colors.borderLight,
  } as ViewStyle,

  /** Large avatar - profile screens */
  large: {
    height: seniorResponsive.avatarLarge(),
    width: seniorResponsive.avatarLarge(),
    borderRadius: seniorResponsive.radiusLarge(),
    backgroundColor: colors.borderLight,
  } as ViewStyle,

  /** Extra large avatar - hero sections */
  xl: {
    height: seniorResponsive.avatarXL(),
    width: seniorResponsive.avatarXL(),
    borderRadius: seniorResponsive.radiusCard(),
    backgroundColor: colors.borderLight,
  } as ViewStyle,

  /** Camera badge overlay */
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: seniorResponsive.radiusMedium(),
    padding: seniorResponsive.gapSmall(),
    borderWidth: 2,
    borderColor: colors.white,
    ...shadows.light,
  } as ViewStyle,

  /** Online indicator */
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: colors.chat.online,
    borderWidth: 2,
    borderColor: colors.white,
  } as ViewStyle,
});

/**
 * Input Styles
 * Form input field styles
 */
export const inputStyles = StyleSheet.create({
  /** Container for input with error */
  container: {
    width: "100%",
    marginBottom: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Input wrapper */
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: seniorResponsive.inputPadding(),
    paddingVertical: seniorResponsive.inputPadding(),
    borderRadius: seniorResponsive.radiusPill(),
    backgroundColor: colors.backgroundInput,
    borderWidth: 1,
    borderColor: colors.transparent,
    minHeight: seniorResponsive.touchTarget(),
  } as ViewStyle,

  /** Input wrapper with error */
  wrapperError: {
    borderColor: colors.error,
    borderWidth: 2,
  } as ViewStyle,

  /** Input wrapper focused */
  wrapperFocused: {
    borderColor: colors.borderFocus,
    borderWidth: 2,
  } as ViewStyle,

  /** Text input */
  input: {
    flex: 1,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontFamily: fontFamily.regular,
    paddingVertical: 0,
  } as TextStyle,

  /** Error text */
  error: {
    color: colors.errorText,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    marginLeft: seniorResponsive.gapSmall(),
    marginTop: seniorResponsive.gapTiny(),
    height: 20,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Error placeholder - maintains layout */
  errorPlaceholder: {
    height: 20,
    marginLeft: seniorResponsive.gapSmall(),
    marginTop: seniorResponsive.gapTiny(),
    opacity: 0,
  } as ViewStyle,

  /** Label text */
  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: seniorResponsive.gapTiny(),
    marginLeft: seniorResponsive.gapTiny(),
    fontFamily: fontFamily.medium,
  } as TextStyle,
});

/**
 * Modal Styles
 * Modal and overlay styles
 */
export const modalStyles = StyleSheet.create({
  /** Modal overlay background */
  overlay: {
    flex: 1,
    backgroundColor: colors.backgroundOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: seniorResponsive.contentPadding(),
  } as ViewStyle,

  /** Modal container */
  container: {
    backgroundColor: colors.white,
    borderRadius: seniorResponsive.radiusCard(),
    padding: seniorResponsive.cardPadding(),
    width: "100%",
    maxWidth: 400,
    gap: seniorResponsive.gapLarge(),
    ...shadows.xl,
  } as ViewStyle,

  /** Modal header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: seniorResponsive.gapMedium(),
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  } as ViewStyle,

  /** Modal title */
  title: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    fontFamily: fontFamily.bold,
  } as TextStyle,

  /** Modal body */
  body: {
    gap: seniorResponsive.gapMedium(),
  } as ViewStyle,

  /** Modal footer */
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: seniorResponsive.gapMedium(),
    paddingTop: seniorResponsive.gapMedium(),
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  } as ViewStyle,

  /** Full width modal button */
  button: {
    flex: 1,
    minHeight: seniorResponsive.modalButtonHeight(),
  } as ViewStyle,
});

/**
 * Badge Styles
 * Tags, chips, and badges
 */
export const badgeStyles = StyleSheet.create({
  /** Standard badge */
  badge: {
    paddingHorizontal: seniorResponsive.gapMedium(),
    paddingVertical: seniorResponsive.gapSmall(),
    borderRadius: seniorResponsive.radiusPill(),
    backgroundColor: colors.accentMint,
  } as ViewStyle,

  /** Badge text */
  badgeText: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.accentTeal,
    fontFamily: fontFamily.medium,
  } as TextStyle,

  /** Primary badge */
  primary: {
    paddingHorizontal: seniorResponsive.gapMedium(),
    paddingVertical: seniorResponsive.gapSmall(),
    borderRadius: seniorResponsive.radiusPill(),
    backgroundColor: colors.primaryLightest,
  } as ViewStyle,

  /** Error badge */
  error: {
    paddingHorizontal: seniorResponsive.gapMedium(),
    paddingVertical: seniorResponsive.gapSmall(),
    borderRadius: seniorResponsive.radiusPill(),
    backgroundColor: colors.errorBackground,
  } as ViewStyle,

  /** Success badge */
  success: {
    paddingHorizontal: seniorResponsive.gapMedium(),
    paddingVertical: seniorResponsive.gapSmall(),
    borderRadius: seniorResponsive.radiusPill(),
    backgroundColor: colors.successBackground,
  } as ViewStyle,
});

/**
 * Divider Styles
 */
export const dividerStyles = StyleSheet.create({
  /** Horizontal divider */
  horizontal: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: "100%",
  } as ViewStyle,

  /** Vertical divider */
  vertical: {
    width: 1,
    backgroundColor: colors.borderLight,
    height: "100%",
  } as ViewStyle,

  /** Divider with margin */
  withMargin: {
    height: 1,
    backgroundColor: colors.borderLight,
    width: "100%",
    marginVertical: seniorResponsive.gapMedium(),
  } as ViewStyle,
});

/**
 * Generate placeholder avatar URL with initials
 * @param name - User's display name
 * @returns URL for ui-avatars.com placeholder
 */
export const getPlaceholderAvatarUrl = (name?: string): string => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2)
    : 'U';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=E8F8F7&color=33A9A2&size=200&font-size=0.4&bold=true`;
};

/**
 * Default export - All styles
 */
export default {
  colors,
  shadows,
  cardStyles,
  buttonStyles,
  layoutStyles,
  textStyles,
  avatarStyles,
  inputStyles,
  modalStyles,
  badgeStyles,
  dividerStyles,
  getPlaceholderAvatarUrl,

  // Legacy compatibility
  text: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    fontFamily: Platform.OS === "android" ? "Roboto" : "System",
  },
};
