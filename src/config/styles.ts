import { Platform, StyleSheet, ViewStyle, TextStyle } from "react-native";
import colors from "./colors";
import typography from "./typography";

/**
 * Shared shadow styles for iOS and Android
 */
export const shadows = {
  light: {
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  } as ViewStyle,
  medium: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  } as ViewStyle,
};

/**
 * Common card styles used across the app
 * Senior-friendly with larger touch targets and clear visual hierarchy
 */
export const cardStyles = StyleSheet.create({
  // Standard white card with border and shadow
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.light,
  },
  // List item card (used in settings menus)
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 64, // Minimum touch target for seniors
    ...shadows.light,
  },
  // Profile card with larger avatar area
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.light,
  },
  // Section card grouping
  section: {
    gap: 12,
  },
  cardGroup: {
    gap: 14,
  },
});

/**
 * Common button styles
 * Senior-friendly with larger touch targets
 */
export const buttonStyles = StyleSheet.create({
  // Primary action button
  primary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 60,
    ...shadows.light,
  },
  primaryDisabled: {
    opacity: 0.7,
  },
  // Icon badge (used in list items)
  iconBadge: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  // Back button style
  backButton: {
    height: 48,
    width: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    ...shadows.light,
  },
});

/**
 * Common layout styles
 */
export const layoutStyles = StyleSheet.create({
  // Full screen container
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  // Standard content padding
  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 20,
  },
  // Centered loading container
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  // Row with items
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  // Flex item for equal width columns
  flexItem: {
    flex: 1,
  },
});

/**
 * Common text styles beyond AppText
 */
export const textStyles = StyleSheet.create({
  sectionTitle: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 4,
  } as TextStyle,
});

/**
 * Avatar/Profile photo styles
 */
export const avatarStyles = StyleSheet.create({
  // Small avatar (list items)
  small: {
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
  },
  // Medium avatar (profile cards)
  medium: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: colors.borderLight,
  },
  // Large avatar (profile screens)
  large: {
    height: 80,
    width: 80,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
  },
  // Camera badge overlay
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
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

export default {
  colors,
  shadows,
  cardStyles,
  buttonStyles,
  layoutStyles,
  textStyles,
  avatarStyles,
  getPlaceholderAvatarUrl,

  text: {
    fontSize: typography.sizes.body,
    color: colors.textPrimary || colors.primaryDark,
    fontFamily: Platform.OS === "android" ? "Roboto" : "System", // SF Pro on iOS
  },
};
