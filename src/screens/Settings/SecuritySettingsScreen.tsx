import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
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

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { securitySettingsApi, SecuritySettings } from "@/src/api/securitySettingsApi";

type SecurityNav = NativeStackNavigationProp<AppStackParamList>;

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<SecurityNav>();

  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSecuritySettings();
    }, [])
  );

  const loadSecuritySettings = async () => {
    try {
      const [user, secSettings] = await Promise.all([
        userApi.getCurrentUser(),
        securitySettingsApi.getSettings(),
      ]);
      setIsVerified(user.verified);
      setSettings(secSettings);
    } catch (error) {
      console.error("Failed to load security settings:", error);
      Alert.alert(
        "Could Not Load Settings",
        "We had trouble loading your security settings. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen as never);
  };

  const handleToggleTwoFactor = async (enabled: boolean) => {
    if (isUpdating) return;

    if (enabled) {
      Alert.alert(
        "Enable Extra Security?",
        "Two-factor authentication adds an extra layer of protection to your account.\n\nWhen enabled, you'll need to enter a code sent to your phone or email whenever you sign in.\n\nHow would you like to receive your codes?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Send to My Phone (SMS)",
            onPress: () => enableTwoFactor("SMS"),
          },
          {
            text: "Send to My Email",
            onPress: () => enableTwoFactor("EMAIL"),
          },
        ]
      );
    } else {
      Alert.alert(
        "Turn Off Extra Security?",
        "Are you sure you want to turn off two-factor authentication?\n\nThis will make your account less secure. We recommend keeping it on.",
        [
          { text: "Keep It On", style: "cancel" },
          {
            text: "Yes, Turn It Off",
            style: "destructive",
            onPress: async () => {
              setIsUpdating(true);
              try {
                const updatedSettings = await securitySettingsApi.setTwoFactor(false);
                setSettings(updatedSettings);
                Alert.alert(
                  "Two-Factor Authentication Disabled",
                  "Your extra security has been turned off. You can turn it back on anytime.",
                  [{ text: "OK" }]
                );
              } catch (error: any) {
                Alert.alert(
                  "Could Not Update Setting",
                  error.message || "Something went wrong. Please try again.",
                  [{ text: "OK" }]
                );
              } finally {
                setIsUpdating(false);
              }
            },
          },
        ]
      );
    }
  };

  const enableTwoFactor = async (method: "SMS" | "EMAIL") => {
    setIsUpdating(true);
    try {
      const updatedSettings = await securitySettingsApi.setTwoFactor(true, method);
      setSettings(updatedSettings);
      const methodName = method === "SMS" ? "phone (SMS)" : "email";
      Alert.alert(
        "Extra Security Enabled!",
        `Great! Two-factor authentication is now on.\n\nYou'll receive a verification code via ${methodName} whenever you sign in.`,
        [{ text: "Got It!" }]
      );
    } catch (error: any) {
      Alert.alert(
        "Could Not Enable",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleLoginNotifications = async (enabled: boolean) => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const updatedSettings = await securitySettingsApi.setLoginNotifications(enabled);
      setSettings(updatedSettings);
      Alert.alert(
        enabled ? "Login Alerts Enabled" : "Login Alerts Disabled",
        enabled
          ? "You will now receive a notification whenever someone signs into your account."
          : "You will no longer receive login notifications. You can turn them back on anytime.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert(
        "Could Not Update Setting",
        error.message || "Something went wrong. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="h4" color={colors.textSecondary} style={{ marginTop: 20 }}>
            Loading security settings...
          </AppText>
        </View>
      </FullScreen>
    );
  }

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
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleIcon}>
              <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
            </View>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Security Settings
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              Keep your account safe with these security options.
            </AppText>
          </View>

          {/* Verification Status Card */}
          <TouchableOpacity
            style={[
              styles.statusCard,
              isVerified ? styles.statusCardVerified : styles.statusCardUnverified,
            ]}
            onPress={() => handleNavigate("IdVerificationScreen")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={isVerified ? "View verification status" : "Verify your age"}
          >
            <View style={[styles.statusIcon, isVerified ? styles.statusIconVerified : styles.statusIconUnverified]}>
              <Ionicons
                name={isVerified ? "shield-checkmark" : "shield-outline"}
                size={36}
                color={isVerified ? colors.success : colors.warning}
              />
            </View>
            <View style={styles.statusContent}>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Age Verification
              </AppText>
              <AppText size="body" color={colors.textSecondary}>
                {isVerified
                  ? "Your age has been verified. Thank you!"
                  : "Please verify your age (60+) to use all features"}
              </AppText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isVerified ? "#E8F5E9" : "#FFF8E1" },
              ]}
            >
              <AppText
                size="small"
                weight="bold"
                color={isVerified ? colors.success : colors.warning}
              >
                {isVerified ? "VERIFIED" : "VERIFY NOW"}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Account Security Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                ACCOUNT SECURITY
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              {/* Change Password */}
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

              {/* Two-Factor Authentication */}
              <View style={styles.listCard}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, settings?.twoFactorEnabled && styles.iconBadgeActive]}>
                    <Ionicons
                      name="phone-portrait-outline"
                      size={26}
                      color={settings?.twoFactorEnabled ? colors.success : colors.accentBlue}
                    />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Extra Security (2FA)
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      {settings?.twoFactorEnabled
                        ? `ON - Codes sent via ${settings.twoFactorMethod === "SMS" ? "phone" : "email"}`
                        : "OFF - Tap the switch to turn on"}
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={settings?.twoFactorEnabled || false}
                  onValueChange={handleToggleTwoFactor}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  disabled={isUpdating}
                  style={styles.switch}
                />
              </View>

              {/* Login Notifications */}
              <View style={styles.listCard}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, settings?.loginNotificationsEnabled && styles.iconBadgeActive]}>
                    <Ionicons
                      name="notifications-outline"
                      size={26}
                      color={settings?.loginNotificationsEnabled ? colors.success : colors.accentBlue}
                    />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Login Alerts
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      {settings?.loginNotificationsEnabled
                        ? "ON - You'll be notified of new sign-ins"
                        : "OFF - Tap the switch to turn on"}
                    </AppText>
                  </View>
                </View>
                <Switch
                  value={settings?.loginNotificationsEnabled || false}
                  onValueChange={handleToggleLoginNotifications}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  disabled={isUpdating}
                  style={styles.switch}
                />
              </View>
            </View>
          </View>

          {/* Privacy & Safety Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-off-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                PRIVACY & SAFETY
              </AppText>
            </View>

            <View style={styles.cardGroup}>
              {/* Blocked Users */}
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("BlockedUsersScreen")}
                accessibilityRole="button"
                accessibilityLabel="Manage blocked users"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="person-remove-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Blocked Users
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      View and manage people you've blocked
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              {/* Privacy Settings */}
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.85}
                onPress={() => handleNavigate("PrivacyScreen")}
                accessibilityRole="button"
                accessibilityLabel="Privacy controls"
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="shield-outline" size={26} color={colors.accentBlue} />
                  </View>
                  <View style={styles.itemTextContainer}>
                    <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                      Privacy Controls
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Control who can see your profile
                    </AppText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconBadge}>
                <Ionicons name="bulb" size={24} color={colors.warning} />
              </View>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Safety Tips
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Never share your password with anyone
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Be careful of messages asking for personal info
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Report any suspicious activity right away
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Keep your email and phone number up to date
                </AppText>
              </View>
            </View>
          </View>

          {/* Help Link */}
          <View style={styles.helpSection}>
            <Ionicons name="help-circle-outline" size={24} color={colors.accentBlue} />
            <AppText size="body" color={colors.textSecondary}>
              Have questions?{" "}
              <AppText
                size="body"
                weight="semibold"
                color={colors.primary}
                onPress={() => handleNavigate("HelpCenterScreen")}
              >
                Visit our Help Center
              </AppText>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 2,
  },
  statusCardVerified: {
    borderColor: colors.success,
    backgroundColor: "#F0FFF4",
  },
  statusCardUnverified: {
    borderColor: colors.warning,
    backgroundColor: "#FFFBEB",
  },
  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconVerified: {
    backgroundColor: "#E8F5E9",
  },
  statusIconUnverified: {
    backgroundColor: "#FFF8E1",
  },
  statusContent: {
    flex: 1,
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    minHeight: 84,
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
  iconBadgeActive: {
    backgroundColor: "#E8F5E9",
  },
  switch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  tipsCard: {
    backgroundColor: "#FFFBEB",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.warning + "40",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  tipsIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  helpSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
});
