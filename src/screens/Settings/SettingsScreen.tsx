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
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { userApi, UserProfile } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";
import { useAuth } from "@/src/hooks/useAuth";
import { SETTINGS_STORAGE_KEYS } from "@/src/types/settings";
import { getPlaceholderAvatarUrl } from "@/src/config/styles";

const NOTIFICATION_SETTINGS_KEY = SETTINGS_STORAGE_KEYS.NOTIFICATION_SETTINGS;

type SettingsNav = NativeStackNavigationProp<AppStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const { logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Load profile and notification settings when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
      loadNotificationSettings();
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
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const getPhotoUrl = () => {
    if (profile?.profilePhotoUrl) {
      return photoApi.getPhotoUrl(profile.profilePhotoUrl);
    }
    // Generate avatar with user initials if we have a name
    return getPlaceholderAvatarUrl(profile?.displayName);
  };

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: keyof AppStackParamList) => {
    navigation.navigate(screen as never);
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to log out. Please try again.");
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
        <AppHeader
          title="Settings"
          titleAlign="left"
          onBackPress={handleGoBack}
          showLogo
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("ViewProfileDetailsScreen", { userId: profile?.id?.toString() || "1" })
            }
          >
            <View style={styles.profileRow}>
              {isLoading ? (
                <View style={[styles.profileAvatar, { justifyContent: 'center', alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                <Image
                  source={{ uri: getPhotoUrl() || undefined }}
                  style={styles.profileAvatar}
                />
              )}
              <View style={styles.profileInfo}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  {isLoading ? "Loading..." : (profile?.displayName || "Your Name")}
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  {isLoading ? "" : (profile?.email || "email@example.com")}
                </AppText>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Account
            </AppText>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("EditBasicInfoScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <MaterialCommunityIcons
                      name="account-circle-outline"
                      size={20}
                      color={colors.accentBlue}
                    />
                  </View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Edit Profile
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("PaymentMethodsScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons name="card" size={18} color={colors.accentBlue} />
                  </View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Payment Methods
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Preferences
            </AppText>

            <View style={styles.cardGroup}>
              <View style={styles.listCard}>
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons
                      name="notifications"
                      size={18}
                      color={colors.accentBlue}
                    />
                  </View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Notifications
                  </AppText>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                />
              </View>

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
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Privacy
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

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
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Change Password
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Security Section */}
          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Security
            </AppText>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("IdVerificationScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={[styles.iconBadge, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons
                      name="shield-checkmark"
                      size={18}
                      color={colors.success}
                    />
                  </View>
                  <View>
                    <AppText weight="semibold" color={colors.textPrimary}>
                      ID Verification
                    </AppText>
                    <AppText size="tiny" color={colors.textSecondary}>
                      Verify your age (60+)
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

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Support
            </AppText>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={() => handleNavigate("HelpCenterScreen")}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons
                      name="help-circle-outline"
                      size={20}
                      color={colors.accentBlue}
                    />
                  </View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Help Center
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutCard}
            activeOpacity={0.9}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconBadge, styles.logoutIconBadge]}>
                {isLoggingOut ? (
                  <ActivityIndicator size="small" color={colors.danger} />
                ) : (
                  <MaterialCommunityIcons
                    name="logout"
                    size={20}
                    color={colors.danger}
                  />
                )}
              </View>
              <AppText weight="bold" color={colors.danger}>
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </AppText>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* <MainNavigationBar activeTab="Profile" /> */}
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
    paddingTop: 8,
    paddingBottom: 30,
    gap: 20,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  profileAvatar: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: colors.borderLight,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  section: {
    gap: 12,
  },
  cardGroup: {
    gap: 14,
  },
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
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 64,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBadge: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutCard: {
    backgroundColor: "#FFE9E9",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FFD1D1",
    minHeight: 64,
  },
  logoutIconBadge: {
    backgroundColor: "#FFF5F5",
  },
});
