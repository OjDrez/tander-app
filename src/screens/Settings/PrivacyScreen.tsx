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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { privacySettingsApi } from "@/src/api/privacySettingsApi";

type PrivacyNav = NativeStackNavigationProp<AppStackParamList>;

interface PrivacySettings {
  isProfilePublic: boolean;
  allowLocation: boolean;
  showApproximateDistance: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  isProfilePublic: true,
  allowLocation: true,
  showApproximateDistance: true,
};

export default function PrivacyScreen() {
  const navigation = useNavigation<PrivacyNav>();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const serverSettings = await privacySettingsApi.getPrivacySettings();
      setSettings({
        isProfilePublic: serverSettings.profileVisible,
        allowLocation: serverSettings.locationEnabled,
        showApproximateDistance: serverSettings.showApproximateDistance,
      });
    } catch (error: any) {
      console.error("Failed to load privacy settings:", error);
      Alert.alert(
        "Could Not Load Settings",
        "We had trouble loading your privacy settings. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = async (key: keyof PrivacySettings, value: boolean) => {
    const previousSettings = { ...settings };
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    setIsSaving(true);
    try {
      const updateData: Record<string, boolean> = {};
      if (key === "isProfilePublic") updateData.profileVisible = value;
      if (key === "allowLocation") updateData.locationEnabled = value;
      if (key === "showApproximateDistance") updateData.showApproximateDistance = value;

      await privacySettingsApi.updatePrivacySettings(updateData);
    } catch (error: any) {
      console.error("Failed to save privacy settings:", error);
      setSettings(previousSettings);
      Alert.alert(
        "Could Not Save Setting",
        "We had trouble saving your change. Please try again.",
        [{ text: "OK, I'll Try Again" }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleBlockedUsersPress = () => {
    navigation.navigate("BlockedUsersScreen" as never);
  };

  const renderToggleSetting = (
    icon: keyof typeof Ionicons.glyphMap,
    iconColor: string,
    title: string,
    description: string,
    settingKey: keyof PrivacySettings
  ) => {
    const isEnabled = settings[settingKey];

    return (
      <View style={styles.settingCard}>
        <View style={styles.settingHeader}>
          <View style={[styles.settingIcon, { backgroundColor: iconColor + '15' }]}>
            <Ionicons name={icon} size={28} color={iconColor} />
          </View>
          <View style={styles.settingTitleArea}>
            <AppText size="h4" weight="semibold" color={colors.textPrimary}>
              {title}
            </AppText>
            <View style={[
              styles.statusBadge,
              isEnabled ? styles.statusOn : styles.statusOff
            ]}>
              <AppText size="small" weight="bold" color={isEnabled ? colors.success : colors.textMuted}>
                {isEnabled ? "ON" : "OFF"}
              </AppText>
            </View>
          </View>
        </View>

        <AppText size="body" color={colors.textSecondary} style={styles.settingDescription}>
          {description}
        </AppText>

        <View style={styles.toggleRow}>
          <AppText size="body" weight="medium" color={colors.textPrimary}>
            {isEnabled ? "This setting is turned on" : "This setting is turned off"}
          </AppText>
          <Switch
            value={isEnabled}
            onValueChange={(value) => handleSettingChange(settingKey, value)}
            trackColor={{
              false: colors.borderMedium,
              true: colors.success,
            }}
            thumbColor={colors.white}
            disabled={isSaving}
            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
          />
        </View>
      </View>
    );
  };

  if (isLoading) {
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

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="h4" color={colors.textSecondary}>
              Loading your privacy settings...
            </AppText>
          </View>
        </SafeAreaView>
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
              <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
            </View>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Privacy Settings
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              Control who can see your profile and how your information is shared.
            </AppText>
          </View>

          {/* Profile Visibility Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Profile Visibility
              </AppText>
            </View>

            {renderToggleSetting(
              "person-circle-outline",
              colors.accentBlue,
              "Show My Profile",
              "When this is ON, other people can find and view your profile. When OFF, your profile is hidden from searches and recommendations.",
              "isProfilePublic"
            )}
          </View>

          {/* Location Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={24} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Location Settings
              </AppText>
            </View>

            {renderToggleSetting(
              "navigate-circle-outline",
              colors.success,
              "Allow Location Access",
              "When ON, we can show you people nearby. When OFF, you won't see distance information for potential matches.",
              "allowLocation"
            )}

            {renderToggleSetting(
              "map-outline",
              colors.accentPurple,
              "Show Approximate Distance",
              "When ON, others see a general distance like '5-10 miles away' instead of your exact distance. This helps protect your privacy.",
              "showApproximateDistance"
            )}
          </View>

          {/* Blocked Users Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hand-left-outline" size={24} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Blocked Users
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.blockedUsersCard}
              activeOpacity={0.85}
              onPress={handleBlockedUsersPress}
              accessibilityRole="button"
              accessibilityLabel="View blocked users"
            >
              <View style={styles.blockedUsersLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.danger + '15' }]}>
                  <Ionicons name="person-remove" size={28} color={colors.danger} />
                </View>
                <View style={styles.blockedUsersText}>
                  <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                    Manage Blocked Users
                  </AppText>
                  <AppText size="body" color={colors.textSecondary}>
                    View and unblock people you've blocked
                  </AppText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Privacy Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="information-circle" size={28} color={colors.accentBlue} />
              <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                Privacy Tips
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary} style={styles.tipText}>
                  Use approximate distance to protect your exact location
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary} style={styles.tipText}>
                  Block users who make you feel uncomfortable
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary} style={styles.tipText}>
                  Hide your profile when you need a break from dating
                </AppText>
              </View>
            </View>
          </View>

          {/* Sync Status */}
          <View style={styles.syncCard}>
            <Ionicons name="cloud-done" size={24} color={colors.success} />
            <AppText size="body" color={colors.textSecondary} style={styles.syncText}>
              Your privacy settings are automatically saved and synced to your account.
            </AppText>
          </View>

          {/* Help Link */}
          <TouchableOpacity
            style={styles.helpLink}
            activeOpacity={0.85}
            onPress={() => navigation.navigate("HelpCenterScreen" as never)}
            accessibilityRole="button"
            accessibilityLabel="Get help with privacy settings"
          >
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
            <AppText size="body" weight="medium" color={colors.primary}>
              Need help with privacy settings?
            </AppText>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  sectionContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  settingCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  settingTitleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusOn: {
    backgroundColor: colors.success + '20',
  },
  statusOff: {
    backgroundColor: colors.borderLight,
  },
  settingDescription: {
    lineHeight: 24,
    paddingLeft: 4,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundLight,
    padding: 16,
    borderRadius: 14,
  },
  blockedUsersCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 90,
  },
  blockedUsersLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  blockedUsersText: {
    flex: 1,
    gap: 4,
  },
  tipsCard: {
    backgroundColor: colors.accentMint,
    borderRadius: 18,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.accentBlue + '30',
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipText: {
    flex: 1,
    lineHeight: 22,
  },
  syncCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + '10',
    padding: 16,
    borderRadius: 14,
    gap: 12,
  },
  syncText: {
    flex: 1,
    lineHeight: 22,
  },
  helpLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
});
