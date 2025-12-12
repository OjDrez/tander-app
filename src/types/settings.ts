/**
 * Settings Types
 * Shared types for Settings screens and related features
 */

import { AppStackParamList } from "@/src/navigation/NavigationTypes";

// ==================== NAVIGATION TYPES ====================

/**
 * All Settings-related screen names
 */
export type SettingsScreenName =
  | "SettingsScreen"
  | "EditBasicInfoScreen"
  | "EditAboutYouScreen"
  | "EditBioScreen"
  | "ViewProfileDetailsScreen"
  | "PaymentMethodsScreen"
  | "PrivacyScreen"
  | "BlockedUsersScreen"
  | "ChangePasswordScreen"
  | "SecuritySettingsScreen"
  | "IdVerificationScreen"
  | "HelpCenterScreen";

/**
 * Settings menu item structure
 */
export interface SettingsMenuItem {
  key: string;
  title: string;
  subtitle?: string;
  screen: keyof AppStackParamList;
  icon: {
    name: string;
    library: "Ionicons" | "MaterialCommunityIcons";
    color?: string;
  };
  badge?: {
    text: string;
    backgroundColor: string;
    textColor: string;
  };
  disabled?: boolean;
}

// ==================== PROFILE TYPES ====================

/**
 * Profile form data for editing
 */
export interface ProfileFormData {
  firstName: string;
  lastName: string;
  nickName: string;
  birthday: string;
  age: string;
  country: string;
  civilStatus: string;
  city: string;
  hobby: string;
  avatar: string | null;
}

/**
 * About You form data
 */
export interface AboutYouFormData {
  bio: string;
  interests: string[];
  lookingFor: string[];
}

/**
 * Profile display data (read-only view)
 */
export interface ProfileDisplayData {
  name: string;
  email: string;
  avatar: string | null;
  basicInfo: ProfileInfoItem[];
  about: {
    bio: string;
    interests: string[];
    lookingFor: string[];
  };
}

/**
 * Single profile info item (label/value pair)
 */
export interface ProfileInfoItem {
  label: string;
  value: string;
}

// ==================== PRIVACY TYPES ====================

/**
 * Privacy settings structure
 */
export interface PrivacySettings {
  isProfilePublic: boolean;
  allowLocation: boolean;
  showApproximateDistance: boolean;
}

/**
 * Privacy toggle item
 */
export interface PrivacyToggleItem {
  key: keyof PrivacySettings;
  title: string;
  description: string;
  icon: string;
}

// ==================== SECURITY TYPES ====================

/**
 * Verification status
 */
export type VerificationStatus = "pending" | "verified" | "rejected" | "not_started";

/**
 * Security settings structure
 */
export interface SecuritySettings {
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  twoFactorEnabled: boolean;
  loginNotificationsEnabled: boolean;
  lastPasswordChange?: string;
}

/**
 * Password change form data
 */
export interface PasswordChangeFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Password validation errors
 */
export interface PasswordErrors {
  current?: string;
  new?: string;
  confirm?: string;
}

// ==================== NOTIFICATION TYPES ====================

/**
 * Notification settings structure
 */
export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  newMatches: boolean;
  newMessages: boolean;
  likes: boolean;
  profileViews: boolean;
  appUpdates: boolean;
}

// ==================== HELP CENTER TYPES ====================

/**
 * FAQ item structure
 */
export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

/**
 * Help center contact options
 */
export interface HelpContactOption {
  type: "phone" | "email" | "chat";
  title: string;
  subtitle: string;
  action: string; // Phone number, email address, or chat ID
  icon: string;
}

// ==================== SELECT FIELD OPTIONS ====================

/**
 * Country options for profile
 */
export const COUNTRY_OPTIONS = [
  "Philippines",
  "USA",
  "Canada",
  "UK",
  "Australia",
  "Japan",
  "South Korea",
  "Singapore",
] as const;

/**
 * Civil status options
 */
export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Divorced",
  "Separated",
] as const;

/**
 * Hobby options
 */
export const HOBBY_OPTIONS = [
  "Cooking",
  "Travel",
  "Music",
  "Reading",
  "Gardening",
  "Dancing",
  "Photography",
  "Painting",
  "Golf",
  "Walking",
] as const;

/**
 * Looking for options
 */
export const LOOKING_FOR_OPTIONS = [
  "Friendship",
  "Companionship",
  "Long-term relationship",
  "Travel partner",
  "Activity partner",
  "Marriage",
] as const;

/**
 * Interest options
 */
export const INTEREST_OPTIONS = [
  "Music",
  "Art",
  "Travel",
  "Food",
  "Movies",
  "Books",
  "Fitness",
  "Nature",
  "Technology",
  "History",
  "Culture",
  "Sports",
] as const;

// ==================== TYPE GUARDS ====================

/**
 * Check if a screen is a settings screen
 */
export const isSettingsScreen = (screen: string): screen is SettingsScreenName => {
  const settingsScreens: SettingsScreenName[] = [
    "SettingsScreen",
    "EditBasicInfoScreen",
    "EditAboutYouScreen",
    "EditBioScreen",
    "ViewProfileDetailsScreen",
    "PaymentMethodsScreen",
    "PrivacyScreen",
    "BlockedUsersScreen",
    "ChangePasswordScreen",
    "SecuritySettingsScreen",
    "IdVerificationScreen",
    "HelpCenterScreen",
  ];
  return settingsScreens.includes(screen as SettingsScreenName);
};

// ==================== ASYNC STORAGE KEYS ====================

/**
 * Storage keys for settings-related data
 */
export const SETTINGS_STORAGE_KEYS = {
  NOTIFICATION_SETTINGS: "@tander_notification_settings",
  PRIVACY_SETTINGS: "@tander_privacy_settings",
  THEME_PREFERENCE: "@tander_theme_preference",
  LAST_VIEWED_HELP: "@tander_last_viewed_help",
} as const;

export type SettingsStorageKey = typeof SETTINGS_STORAGE_KEYS[keyof typeof SETTINGS_STORAGE_KEYS];
