import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useCallback } from "react";
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

import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { securitySettingsApi, SecuritySettings } from "@/src/api/securitySettingsApi";
import { useToast } from "@/src/context/ToastContext";

type SecurityNav = NativeStackNavigationProp<AppStackParamList>;

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<SecurityNav>();
  const { success, error, info, confirm, alert } = useToast();

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
    } catch (err) {
      console.error("Failed to load security settings:", err);
      error("We had trouble loading your security settings. Please try again.");
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
      // Show options for 2FA method
      const smsConfirmed = await confirm({
        title: "Enable Extra Security?",
        message: "Two-factor authentication adds an extra layer of protection. How would you like to receive your codes?",
        type: "info",
        confirmText: "Send to Phone (SMS)",
        cancelText: "Send to Email",
      });

      if (smsConfirmed) {
        await enableTwoFactor("SMS");
      } else {
        await enableTwoFactor("EMAIL");
      }
    } else {
      const confirmed = await confirm({
        title: "Turn Off Extra Security?",
        message: "This will make your account less secure. We recommend keeping it on.",
        type: "warning",
        confirmText: "Yes, Turn It Off",
        cancelText: "Keep It On",
      });

      if (confirmed) {
        setIsUpdating(true);
        try {
          const updatedSettings = await securitySettingsApi.setTwoFactor(false);
          setSettings(updatedSettings);
          info("Two-factor authentication disabled. You can turn it back on anytime.");
        } catch (err: any) {
          error(err.message || "Something went wrong. Please try again.");
        } finally {
          setIsUpdating(false);
        }
      }
    }
  };

  const enableTwoFactor = async (method: "SMS" | "EMAIL") => {
    setIsUpdating(true);
    try {
      const updatedSettings = await securitySettingsApi.setTwoFactor(true, method);
      setSettings(updatedSettings);
      const methodName = method === "SMS" ? "phone (SMS)" : "email";
      success(`Two-factor authentication is now on! You'll receive codes via ${methodName}.`);
    } catch (err: any) {
      error(err.message || "Something went wrong. Please try again.");
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
      if (enabled) {
        success("You will receive a notification whenever someone signs into your account.");
      } else {
        info("Login notifications disabled. You can turn them back on anytime.");
      }
    } catch (err: any) {
      error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading security settings..."
      />
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

          {/* Two-Factor Authentication Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.textMuted} />
              <AppText size="body" weight="bold" color={colors.textMuted}>
                EXTRA SECURITY
              </AppText>
            </View>

            <View style={styles.cardGroup}>
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
