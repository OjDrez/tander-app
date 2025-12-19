import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { photoApi } from "@/src/api/photoApi";
import { userApi, UserProfile } from "@/src/api/userApi";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import colors from "@/src/config/colors";
import { getPlaceholderAvatarUrl } from "@/src/config/styles";
import { useToast } from "@/src/context/ToastContext";
import { useAuth } from "@/src/hooks/useAuth";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import biometricService from "@/src/services/biometricService";
import { SETTINGS_STORAGE_KEYS } from "@/src/types/settings";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const NOTIFICATION_SETTINGS_KEY = SETTINGS_STORAGE_KEYS.NOTIFICATION_SETTINGS;

type SettingsNav = NativeStackNavigationProp<AppStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { logout } = useAuth();
  const { success, info, error, confirm } = useToast();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState("Biometric Login");

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadNotificationSettings();
      loadBiometricSettings();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const data = await userApi.getCurrentUser();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile:", err);
      error("Couldn't load your profile. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored !== null) {
        setNotificationsEnabled(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Failed to load notification settings:", err);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(value));
      if (value) {
        success("✓ Notifications ON\n\nYou'll get alerts for messages and matches");
      } else {
        info("Notifications OFF\n\nYou can turn them back on anytime");
      }
    } catch (err) {
      console.error("Failed to save notification settings:", err);
      error("Couldn't save your changes. Please try again.");
    }
  };

  const loadBiometricSettings = async () => {
    try {
      const available = await biometricService.isAvailable();
      setBiometricAvailable(available);

      if (available) {
        const biometricType = await biometricService.getBiometricType();
        const label = biometricService.getBiometricLabel(biometricType);
        setBiometricLabel(label);

        const enabled = await biometricService.isBiometricLoginEnabled();
        setBiometricEnabled(enabled);
      }
    } catch (err) {
      console.error("Failed to load biometric settings:", err);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        const hasCredentials = await biometricService.hasStoredCredentials();

        if (!hasCredentials) {
          info(
            `To enable ${biometricLabel}:\n\n1. Log out\n2. Log back in with password\n3. Enable ${biometricLabel}`
          );
          return;
        }

        const authenticated = await biometricService.authenticate(
          `Verify to enable ${biometricLabel}`
        );

        if (authenticated) {
          // Enable locally
          await biometricService.enableBiometricLogin();

          // Sync with backend
          try {
            await userApi.enableBiometric();
          } catch (apiError) {
            console.warn("Failed to sync biometric status with backend:", apiError);
            // Continue even if backend sync fails - local is more important
          }

          setBiometricEnabled(true);
          success(`✓ ${biometricLabel} Enabled!`);
        } else {
          error(`${biometricLabel} failed. Try again.`);
        }
      } else {
        const confirmed = await confirm({
          title: `Disable ${biometricLabel}?`,
          message: `You'll need your password to sign in.\n\nAre you sure?`,
          type: "warning",
          confirmText: "Yes, Disable",
          cancelText: "No, Keep It",
        });

        if (confirmed) {
          // Clear locally
          await biometricService.clearCredentials();

          // Sync with backend
          try {
            await userApi.disableBiometric();
          } catch (apiError) {
            console.warn("Failed to sync biometric status with backend:", apiError);
            // Continue even if backend sync fails - local is more important
          }

          setBiometricEnabled(false);
          info(`${biometricLabel} disabled`);
        }
      }
    } catch (err) {
      console.error("Failed to toggle biometric settings:", err);
      error("Couldn't update settings. Try again.");
    }
  };

  const getPhotoUrl = () => {
    if (profile?.profilePhotoUrl) {
      return photoApi.getPhotoUrl(profile.profilePhotoUrl);
    }
    return getPlaceholderAvatarUrl(profile?.displayName);
  };

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: keyof AppStackParamList) => {
    navigation.navigate(screen as never);
  };

  const handleLogout = async () => {
    const confirmed = await confirm({
      title: "Log Out?",
      message: "You'll need to sign in again.\n\nLog out now?",
      type: "warning",
      confirmText: "Yes, Log Out",
      cancelText: "No, Stay",
    });

    if (confirmed) {
      setIsLoggingOut(true);
      try {
        await logout();
        success("✓ Logged out");
      } catch (err) {
        console.error("Logout error:", err);
        error("❌ Couldn't log out\n\nCheck connection and try again");
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Double tap to return"
            activeOpacity={0.7}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Back
            </AppText>
          </TouchableOpacity>

          <Image
            source={require("@/src/assets/icons/tander-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* PAGE TITLE */}
          <View style={styles.titleSection}>
            <AppText size="h1" weight="bold" color={colors.textPrimary}>
              Settings
            </AppText>
            <AppText size="h4" color={colors.textSecondary}>
              Manage your account and preferences
            </AppText>
          </View>

          {/* PROFILE CARD */}
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("ViewProfileDetailsScreen", { userId: profile?.id?.toString() || "" })
            }
            accessibilityRole="button"
            accessibilityLabel="View your profile"
          >
            {isLoading ? (
              <LoadingIndicator
                variant="inline"
                message="Loading profile..."
              />
            ) : (
              <View style={styles.profileContent}>
                <Image
                  source={{ uri: getPhotoUrl() || undefined }}
                  style={styles.profileAvatar}
                />
                <View style={styles.profileInfo}>
                  <AppText size="h2" weight="bold" color={colors.textPrimary}>
                    {profile?.displayName || "Your Name"}
                  </AppText>
                  <AppText size="h4" color={colors.textSecondary}>
                    {profile?.email || "email@example.com"}
                  </AppText>
                  <View style={styles.tapHint}>
                    <Ionicons name="eye" size={20} color={colors.primary} />
                    <AppText size="body" color={colors.primary} weight="semibold">
                      View Full Profile
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={32} color={colors.primary} />
              </View>
            )}
          </TouchableOpacity>

          {/* ACCOUNT SETTINGS */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Your Account
            </AppText>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("EditBasicInfoScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="account-edit" size={32} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Edit Profile
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Update your info and photos
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("PaymentMethodsScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentTeal + '15' }]}>
                <Ionicons name="card" size={32} color={colors.accentTeal} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Payment Methods
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Manage cards and wallets
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* PREFERENCES */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Preferences
            </AppText>

            {/* NOTIFICATIONS TOGGLE */}
            <View style={styles.settingCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons
                  name={notificationsEnabled ? "notifications" : "notifications-off"}
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingTextWithToggle}>
                <View style={styles.titleWithBadge}>
                  <AppText size="h3" weight="bold" color={colors.textPrimary}>
                    Notifications
                  </AppText>
                  <View style={[
                    styles.statusBadge,
                    notificationsEnabled ? styles.badgeOn : styles.badgeOff
                  ]}>
                    <AppText size="small" weight="bold" color={notificationsEnabled ? colors.success : colors.textMuted}>
                      {notificationsEnabled ? "ON" : "OFF"}
                    </AppText>
                  </View>
                </View>
                <AppText size="body" color={colors.textSecondary}>
                  {notificationsEnabled ? "Receiving alerts" : "No alerts"}
                </AppText>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  style={styles.switch}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("PrivacyScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentTeal + '15' }]}>
                <Ionicons name="shield-checkmark" size={32} color={colors.accentTeal} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Privacy
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Control who sees your profile
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("ChangePasswordScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentBlue + '15' }]}>
                <Ionicons name="key" size={32} color={colors.accentBlue} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Change Password
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Update your login password
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* SECURITY & SAFETY */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Security & Safety
            </AppText>

            {/* BIOMETRIC - Only show if available */}
            {biometricAvailable && (
            <View style={styles.settingCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentPurple + '15' }]}>
                <Ionicons
                  name={biometricLabel.includes("Face") ? "scan" : "finger-print"}
                  size={32}
                  color={colors.accentPurple}
                />
              </View>
              <View style={styles.settingTextWithToggle}>
                <View style={styles.titleWithBadge}>
                  <AppText size="h3" weight="bold" color={colors.textPrimary}>
                    {biometricLabel}
                  </AppText>
                  <View style={[
                    styles.statusBadge,
                    biometricEnabled ? styles.badgeOn : styles.badgeOff
                  ]}>
                    <AppText size="small" weight="bold" color={biometricEnabled ? colors.success : colors.textMuted}>
                      {biometricEnabled ? "ON" : "OFF"}
                    </AppText>
                  </View>
                </View>
                <AppText size="body" color={colors.textSecondary}>
                  {biometricEnabled ? "Quick sign-in enabled" : "Enable for quick sign-in"}
                </AppText>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  style={styles.switch}
                />
              </View>
            </View>
            )}

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("SecuritySettingsScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="lock-closed" size={32} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Extra Security
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Two-step verification
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingCard, styles.verifyCard]}
              activeOpacity={0.7}
              onPress={() => handleNavigate("IdVerificationScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="shield-checkmark" size={32} color={colors.success} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  ID Verification
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  {profile?.verified ? "Age verified ✓" : "Verify your age (60+)"}
                </AppText>
              </View>
              <View style={styles.verifyBadge}>
                <AppText size="body" weight="bold" color={profile?.verified ? colors.success : colors.primary}>
                  {profile?.verified ? "✓ VERIFIED" : "VERIFY"}
                </AppText>
              </View>
            </TouchableOpacity>
          </View>

          {/* HELP & SUPPORT */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Help & Support
            </AppText>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={() => handleNavigate("HelpCenterScreen")}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="help-circle" size={32} color={colors.primary} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Help Center
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  FAQs and support
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* LOGOUT BUTTON */}
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.7}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.logoutIconCircle}>
              {isLoggingOut ? (
                <ActivityIndicator size="large" color={colors.danger} />
              ) : (
                <Ionicons name="log-out" size={36} color={colors.danger} />
              )}
            </View>
            <View>
              <AppText size="h2" weight="bold" color={colors.danger}>
                {isLoggingOut ? "Logging Out..." : "Log Out"}
              </AppText>
              <AppText size="h4" color={colors.textSecondary}>
                Sign out of Tander
              </AppText>
            </View>
          </TouchableOpacity>

          {/* VERSION */}
          <View style={styles.versionContainer}>
            <AppText size="body" color={colors.textMuted}>
              Tander Version 1.0.0
            </AppText>
          </View>
        </ScrollView>
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  logo: {
    width: 44,
    height: 44,
  },
  // CONTENT
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 32,
  },
  // TITLE
  titleSection: {
    gap: 8,
  },
  // PROFILE CARD
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileLoading: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
  },
  profileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
  },
  profileInfo: {
    flex: 1,
    gap: 6,
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  // SECTION
  section: {
    gap: 16,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  // SETTING CARD
  settingCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 88,
  },
  verifyCard: {
    backgroundColor: colors.successBackground,
    borderColor: colors.success + '30',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  settingText: {
    flex: 1,
    gap: 4,
  },
  settingTextWithToggle: {
    flex: 1,
    gap: 4,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeOn: {
    backgroundColor: colors.success + '20',
  },
  badgeOff: {
    backgroundColor: colors.borderLight,
  },
  verifyBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.success + '15',
  },
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  // LOGOUT
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerBackground,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: colors.danger + '30',
    minHeight: 88,
  },
  logoutIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // VERSION
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
