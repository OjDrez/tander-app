import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";

type SecurityNav = NativeStackNavigationProp<AppStackParamList>;

/**
 * SecuritySettingsScreen
 *
 * Manages security-related settings including:
 * - ID verification status
 * - Two-factor authentication
 * - Login notifications
 * - Account security
 *
 * Senior-friendly design with clear status indicators.
 */
export default function SecuritySettingsScreen() {
  const navigation = useNavigation<SecurityNav>();

  const [isVerified, setIsVerified] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [loginNotifications, setLoginNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSecuritySettings();
    }, [])
  );

  const loadSecuritySettings = async () => {
    try {
      const user = await userApi.getCurrentUser();
      setIsVerified(user.verified);
      // TODO: Load other security settings from backend
    } catch (error) {
      console.error("Failed to load security settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen as never);
  };

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </FullScreen>
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={handleGoBack}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <AppText size="h3" weight="bold" style={styles.headerTitle}>
              Security
            </AppText>

            <View style={styles.logoRow}>
              <Image
                source={require("@/src/assets/icons/tander-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <AppText weight="bold" color={colors.accentBlue}>
                TANDER
              </AppText>
            </View>
          </View>

          {/* Verification Status Card */}
          <TouchableOpacity
            style={[
              styles.statusCard,
              isVerified ? styles.statusCardVerified : styles.statusCardUnverified,
            ]}
            onPress={() => handleNavigate("IdVerificationScreen")}
            activeOpacity={0.9}
          >
            <View style={styles.statusIcon}>
              <Ionicons
                name={isVerified ? "shield-checkmark" : "shield-outline"}
                size={32}
                color={isVerified ? colors.success : colors.warning}
              />
            </View>
            <View style={styles.statusContent}>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                ID Verification
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                {isVerified
                  ? "Your age has been verified"
                  : "Verify your age to access all features"}
              </AppText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isVerified ? colors.successLight || "#E8F5E9" : colors.warningLight || "#FFF8E1" },
              ]}
            >
              <AppText
                size="tiny"
                weight="bold"
                color={isVerified ? colors.success : colors.warning}
              >
                {isVerified ? "Verified" : "Pending"}
              </AppText>
            </View>
          </TouchableOpacity>

          {/* Account Security Section */}
          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Account Security
            </AppText>

            <View style={styles.cardGroup}>
              {/* Change Password */}
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("ChangePasswordScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={20}
                      color={colors.accentBlue}
                    />
                  </View>
                  <View>
                    <AppText weight="semibold" color={colors.textPrimary}>
                      Change Password
                    </AppText>
                    <AppText size="tiny" color={colors.textSecondary}>
                      Update your login password
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Two-Factor Authentication - Coming Soon */}
              <View style={[styles.listCard, styles.disabledCard]}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, styles.disabledIconBadge]}>
                    <MaterialCommunityIcons
                      name="cellphone-key"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" color={colors.textMuted}>
                      Two-Factor Authentication
                    </AppText>
                    <AppText size="tiny" color={colors.textMuted}>
                      Coming soon
                    </AppText>
                  </View>
                </View>
                <View style={styles.comingSoonBadge}>
                  <AppText size="tiny" weight="semibold" color={colors.textMuted}>
                    Soon
                  </AppText>
                </View>
              </View>

              {/* Login Notifications - Coming Soon */}
              <View style={[styles.listCard, styles.disabledCard]}>
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, styles.disabledIconBadge]}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={colors.textMuted}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" color={colors.textMuted}>
                      Login Notifications
                    </AppText>
                    <AppText size="tiny" color={colors.textMuted}>
                      Coming soon
                    </AppText>
                  </View>
                </View>
                <View style={styles.comingSoonBadge}>
                  <AppText size="tiny" weight="semibold" color={colors.textMuted}>
                    Soon
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Privacy & Safety
            </AppText>

            <View style={styles.cardGroup}>
              {/* Blocked Users */}
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("BlockedUsersScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons
                      name="person-remove-outline"
                      size={20}
                      color={colors.accentBlue}
                    />
                  </View>
                  <View>
                    <AppText weight="semibold" color={colors.textPrimary}>
                      Blocked Users
                    </AppText>
                    <AppText size="tiny" color={colors.textSecondary}>
                      Manage users you've blocked
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Privacy Settings */}
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("PrivacyScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons
                      name="shield-outline"
                      size={20}
                      color={colors.accentBlue}
                    />
                  </View>
                  <View>
                    <AppText weight="semibold" color={colors.textPrimary}>
                      Privacy Controls
                    </AppText>
                    <AppText size="tiny" color={colors.textSecondary}>
                      Control who can see your profile
                    </AppText>
                  </View>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={22} color={colors.warning} />
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Security Tips
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <AppText size="small" color={colors.textSecondary}>
                {"\u2022"} Never share your password with anyone
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                {"\u2022"} Be cautious of messages asking for personal info
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                {"\u2022"} Report suspicious activity immediately
              </AppText>
            </View>
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
  content: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 34,
    height: 34,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 2,
  },
  statusCardVerified: {
    borderColor: colors.success,
    backgroundColor: colors.successLight || "#E8F5E9",
  },
  statusCardUnverified: {
    borderColor: colors.warning,
    backgroundColor: colors.warningLight || "#FFF8E1",
  },
  statusIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  statusContent: {
    flex: 1,
    gap: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  section: {
    gap: 10,
  },
  cardGroup: {
    gap: 12,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
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
    minHeight: 72,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  tipsCard: {
    backgroundColor: colors.warningLight || "#FFF8E1",
    borderRadius: 18,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipsList: {
    gap: 6,
    paddingLeft: 4,
  },
  disabledCard: {
    opacity: 0.6,
  },
  disabledIconBadge: {
    backgroundColor: colors.borderLight,
  },
  comingSoonBadge: {
    backgroundColor: colors.borderLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
});
