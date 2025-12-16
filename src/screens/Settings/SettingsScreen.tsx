import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { userApi, UserProfile } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";
import { useAuth } from "@/src/hooks/useAuth";
import { SETTINGS_STORAGE_KEYS } from "@/src/types/settings";
import { getPlaceholderAvatarUrl } from "@/src/config/styles";
import biometricService from "@/src/services/biometricService";

const NOTIFICATION_SETTINGS_KEY = SETTINGS_STORAGE_KEYS.NOTIFICATION_SETTINGS;

type SettingsNav = NativeStackNavigationProp<AppStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { logout } = useAuth();
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
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(value));
      // Show feedback to user
      Alert.alert(
        value ? "Notifications Enabled" : "Notifications Disabled",
        value
          ? "You will receive notifications about matches and messages."
          : "You will no longer receive notifications. You can turn them back on anytime.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to save notification settings:", error);
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
    } catch (error) {
      console.error("Failed to load biometric settings:", error);
    }
  };

  const handleBiometricToggle = async (value: boolean) => {
    try {
      if (value) {
        // User wants to enable biometrics
        const hasCredentials = await biometricService.hasStoredCredentials();

        if (!hasCredentials) {
          // No credentials stored yet - need to authenticate first
          Alert.alert(
            "Enable " + biometricLabel,
            "To enable " + biometricLabel + " login, you need to verify your identity first. Please log out and log back in with your password to set up " + biometricLabel + ".",
            [{ text: "OK" }]
          );
          return;
        }

        // Credentials exist, perform biometric authentication to confirm
        const authenticated = await biometricService.authenticate(
          "Verify your identity to enable " + biometricLabel
        );

        if (authenticated) {
          await biometricService.enableBiometricLogin();
          setBiometricEnabled(true);
          Alert.alert(
            biometricLabel + " Enabled",
            "You can now use " + biometricLabel + " to sign in to Tander.",
            [{ text: "OK" }]
          );
        } else {
          Alert.alert(
            "Authentication Failed",
            biometricLabel + " authentication was not successful. Please try again.",
            [{ text: "OK" }]
          );
        }
      } else {
        // User wants to disable biometrics
        Alert.alert(
          "Disable " + biometricLabel + "?",
          "You will need to enter your password to sign in. Your saved login credentials will be removed.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Disable",
              style: "destructive",
              onPress: async () => {
                await biometricService.clearCredentials();
                setBiometricEnabled(false);
                Alert.alert(
                  biometricLabel + " Disabled",
                  "Biometric login has been disabled. You will need to use your password to sign in.",
                  [{ text: "OK" }]
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Failed to toggle biometric settings:", error);
      Alert.alert(
        "Error",
        "Failed to update biometric settings. Please try again.",
        [{ text: "OK" }]
      );
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

  const handleLogout = () => {
    Alert.alert(
      "Log Out of Tander?",
      "Are you sure you want to log out? You will need to sign in again to use Tander.",
      [
        {
          text: "No, Stay Logged In",
          style: "cancel",
        },
        {
          text: "Yes, Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Could Not Log Out", "Something went wrong. Please try again.");
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.85}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Back
            </AppText>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <Image
              source={require("@/src/assets/icons/tander-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Page Title */}
          <View style={styles.titleSection}>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Settings
            </AppText>
            <AppText size="body" color={colors.textSecondary}>
              Manage your account, preferences, and security.
            </AppText>
          </View>

          {/* Profile Card */}
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate("ViewProfileDetailsScreen", { userId: profile?.id?.toString() || "1" })
            }
            accessibilityRole="button"
            accessibilityLabel="View your profile"
          >
            <View style={styles.profileRow}>
              {isLoading ? (
                <View style={[styles.profileAvatar, styles.profileAvatarLoading]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ uri: getPhotoUrl() || undefined }}
                  style={styles.profileAvatar}
                />
              )}
              <View style={styles.profileInfo}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  {isLoading ? "Loading..." : (profile?.displayName || "Your Name")}
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  {isLoading ? "" : (profile?.email || "email@example.com")}
                </AppText>
                <AppText size="small" color={colors.primary} weight="semibold" style={styles.viewProfileText}>
                  Tap to view your profile
                </AppText>
              </View>
              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={24} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                ACCOUNT
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("EditBasicInfoScreen")}
                accessibilityRole="button"
                accessibilityLabel="Edit your profile information"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons
                      name="account-edit-outline"
                      size={26}
                      color={colors.accentBlue}
                    />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Edit Profile
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Change your name, photo, and personal info
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("PaymentMethodsScreen")}
                accessibilityRole="button"
                accessibilityLabel="Manage your payment methods"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="card-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Payment Methods
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Add or manage your cards and wallets
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                PREFERENCES
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              <View style={styles.listCard}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="notifications-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Notifications
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      {notificationsEnabled ? "You will receive alerts" : "Notifications are off"}
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.success,
                  }}
                  thumbColor={colors.white}
                  style={styles.switch}
                />
              </View>

              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("PrivacyScreen")}
                accessibilityRole="button"
                accessibilityLabel="Privacy settings"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="eye-off-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Privacy
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Control who can see your profile
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("ChangePasswordScreen")}
                accessibilityRole="button"
                accessibilityLabel="Change your password"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="key-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Change Password
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Update your login password
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                SECURITY
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              {/* Biometric Login Toggle - Only show if device supports it */}
              {biometricAvailable && (
                <View style={styles.listCard}>
                  <View style={styles.itemLeft}>
                    <View style={[styles.iconBadge, styles.biometricIconBadge]}>
                      <Ionicons
                        name={biometricLabel.includes("Face") ? "scan-outline" : "finger-print-outline"}
                        size={26}
                        color={colors.accentBlue}
                      />
                    </View>
                    <View style={styles.itemTextContainer}>
                      <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                        {biometricLabel}
                      </AppText>
                      <AppText size="small" color={colors.textSecondary}>
                        {biometricEnabled
                          ? "Sign in quickly with " + biometricLabel
                          : "Enable " + biometricLabel + " for faster sign-in"}
                      </AppText>
                    </View>
                  </View>
                  <Switch
                    value={biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    trackColor={{
                      false: colors.borderMedium,
                      true: colors.success,
                    }}
                    thumbColor={colors.white}
                    style={styles.switch}
                  />
                </View>
              )}

              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("SecuritySettingsScreen")}
                accessibilityRole="button"
                accessibilityLabel="Security settings"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="lock-closed-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Security Settings
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Two-factor authentication and login alerts
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.listCard, styles.verificationCard]}
                activeOpacity={0.85}
                onPress={() => handleNavigate("IdVerificationScreen")}
                accessibilityRole="button"
                accessibilityLabel="Verify your age"
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, styles.verificationIconBadge]}>
                    <Ionicons name="shield-checkmark" size={26} color={colors.success} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      ID Verification
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Verify your age (60+) to access all features
                    </AppText>
                  </View>
                </View>
                <View style={styles.verificationBadge}>
                  <AppText size="tiny" weight="bold" color={colors.success}>
                    {profile?.verified ? "VERIFIED" : "VERIFY NOW"}
                  </AppText>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="help-buoy-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                SUPPORT
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("HelpCenterScreen")}
                accessibilityRole="button"
                accessibilityLabel="Get help and support"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="help-circle-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Help Center
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      FAQs, contact support, and safety tips
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutCard}
            activeOpacity={0.85}
            onPress={handleLogout}
            disabled={isLoggingOut}
            accessibilityRole="button"
            accessibilityLabel="Log out of your account"
          >
            <View style={styles.logoutContent}>
              <View style={[styles.iconBadge, styles.logoutIconBadge]}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <Ionicons name="log-out-outline" size={26} color={colors.danger} />
                )}
              </View>
              <View style={styles.itemTextContainer}>
                <AppText size="h4" weight="bold" color={colors.danger}>
                  {isLoggingOut ? "Logging Out..." : "Log Out"}
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  Sign out of your Tander account
                </AppText>
              </View>
            </View>
          </TouchableOpacity>

          {/* App Version */}
          <View style={styles.versionInfo}>
            <AppText size="small" color={colors.textMuted}>
              Tander App Version 1.0.0
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  titleSection: {
    gap: 6,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary + '30',
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  profileAvatar: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: colors.borderLight,
  },
  profileAvatarLoading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  viewProfileText: {
    marginTop: 4,
  },
  chevronCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 4,
  },
  cardGroup: {
    gap: 12,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 80,
  },
  verificationCard: {
    borderColor: colors.success + '40',
    backgroundColor: '#FAFFF9',
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  itemTextContainer: {
    flex: 1,
    gap: 2,
  },
  iconBadge: {
    height: 52,
    width: 52,
    borderRadius: 16,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  verificationIconBadge: {
    backgroundColor: '#E8F5E9',
  },
  biometricIconBadge: {
    backgroundColor: '#E3F2FD',
  },
  verificationBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  logoutCard: {
    backgroundColor: "#FFF0F0",
    borderRadius: 18,
    padding: 18,
    borderWidth: 2,
    borderColor: colors.danger + '30',
    minHeight: 80,
  },
  logoutContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logoutIconBadge: {
    backgroundColor: "#FFE5E5",
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 10,
  },
});
