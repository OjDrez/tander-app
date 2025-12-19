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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { privacySettingsApi } from "@/src/api/privacySettingsApi";
import { useToast } from "@/src/context/ToastContext";

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
  const { success, error } = useToast();
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
    } catch (err: any) {
      console.error("Failed to load privacy settings:", err);
      error("Couldn't load settings. Check connection.");
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
      success("✓ Setting saved");
    } catch (err: any) {
      console.error("Failed to save privacy settings:", err);
      setSettings(previousSettings);
      error("Couldn't save. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleBlockedUsersPress = () => {
    navigation.navigate("BlockedUsersScreen" as never);
  };

  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading privacy settings..."
      />
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
              Privacy
            </AppText>
            <AppText size="h4" color={colors.textSecondary}>
              Control who can see your profile
            </AppText>
          </View>

          {/* PROFILE VISIBILITY */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Profile Visibility
            </AppText>

            <View style={styles.settingCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons
                  name={settings.isProfilePublic ? "eye" : "eye-off"}
                  size={32}
                  color={colors.primary}
                />
              </View>
              <View style={styles.settingTextWithToggle}>
                <View style={styles.titleWithBadge}>
                  <AppText size="h3" weight="bold" color={colors.textPrimary}>
                    Show My Profile
                  </AppText>
                  <View style={[
                    styles.statusBadge,
                    settings.isProfilePublic ? styles.badgeOn : styles.badgeOff
                  ]}>
                    <AppText size="small" weight="bold" color={settings.isProfilePublic ? colors.success : colors.textMuted}>
                      {settings.isProfilePublic ? "ON" : "OFF"}
                    </AppText>
                  </View>
                </View>
                <AppText size="body" color={colors.textSecondary}>
                  {settings.isProfilePublic
                    ? "Others can find and view your profile"
                    : "Your profile is hidden"}
                </AppText>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={settings.isProfilePublic}
                  onValueChange={(value) => handleSettingChange("isProfilePublic", value)}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  disabled={isSaving}
                  style={styles.switch}
                />
              </View>
            </View>
          </View>

          {/* LOCATION SETTINGS */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Location Settings
            </AppText>

            <View style={styles.settingCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentTeal + '15' }]}>
                <Ionicons
                  name={settings.allowLocation ? "location" : "location-off"}
                  size={32}
                  color={colors.accentTeal}
                />
              </View>
              <View style={styles.settingTextWithToggle}>
                <View style={styles.titleWithBadge}>
                  <AppText size="h3" weight="bold" color={colors.textPrimary}>
                    Location Access
                  </AppText>
                  <View style={[
                    styles.statusBadge,
                    settings.allowLocation ? styles.badgeOn : styles.badgeOff
                  ]}>
                    <AppText size="small" weight="bold" color={settings.allowLocation ? colors.success : colors.textMuted}>
                      {settings.allowLocation ? "ON" : "OFF"}
                    </AppText>
                  </View>
                </View>
                <AppText size="body" color={colors.textSecondary}>
                  {settings.allowLocation
                    ? "See people nearby"
                    : "Location disabled"}
                </AppText>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={settings.allowLocation}
                  onValueChange={(value) => handleSettingChange("allowLocation", value)}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  disabled={isSaving}
                  style={styles.switch}
                />
              </View>
            </View>

            <View style={styles.settingCard}>
              <View style={[styles.iconCircle, { backgroundColor: colors.accentBlue + '15' }]}>
                <Ionicons name="map" size={32} color={colors.accentBlue} />
              </View>
              <View style={styles.settingTextWithToggle}>
                <View style={styles.titleWithBadge}>
                  <AppText size="h3" weight="bold" color={colors.textPrimary}>
                    Approximate Distance
                  </AppText>
                  <View style={[
                    styles.statusBadge,
                    settings.showApproximateDistance ? styles.badgeOn : styles.badgeOff
                  ]}>
                    <AppText size="small" weight="bold" color={settings.showApproximateDistance ? colors.success : colors.textMuted}>
                      {settings.showApproximateDistance ? "ON" : "OFF"}
                    </AppText>
                  </View>
                </View>
                <AppText size="body" color={colors.textSecondary}>
                  {settings.showApproximateDistance
                    ? "Show general distance (5-10 miles)"
                    : "Show exact distance"}
                </AppText>
              </View>
              <View style={styles.switchContainer}>
                <Switch
                  value={settings.showApproximateDistance}
                  onValueChange={(value) => handleSettingChange("showApproximateDistance", value)}
                  trackColor={{ false: colors.borderMedium, true: colors.success }}
                  thumbColor={colors.white}
                  disabled={isSaving}
                  style={styles.switch}
                />
              </View>
            </View>
          </View>

          {/* BLOCKED USERS */}
          <View style={styles.section}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
              Blocked Users
            </AppText>

            <TouchableOpacity
              style={styles.settingCard}
              activeOpacity={0.7}
              onPress={handleBlockedUsersPress}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.danger + '15' }]}>
                <Ionicons name="person-remove" size={32} color={colors.danger} />
              </View>
              <View style={styles.settingText}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Manage Blocked Users
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  View and unblock people
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* PRIVACY TIPS */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={28} color={colors.accentTeal} />
              <AppText size="h3" weight="bold" color={colors.textPrimary}>
                Privacy Tips
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <AppText size="body" color={colors.textPrimary} style={styles.tipText}>
                  Use approximate distance to protect your location
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <AppText size="body" color={colors.textPrimary} style={styles.tipText}>
                  Block users who make you uncomfortable
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                <AppText size="body" color={colors.textPrimary} style={styles.tipText}>
                  Hide your profile when you need a break
                </AppText>
              </View>
            </View>
          </View>

          {/* AUTO-SAVE MESSAGE */}
          <View style={styles.autoSaveCard}>
            <Ionicons name="cloud-done" size={24} color={colors.success} />
            <AppText size="body" color={colors.textSecondary}>
              Changes are saved automatically
            </AppText>
          </View>

          {/* HELP LINK */}
          <TouchableOpacity
            style={styles.helpButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate("HelpCenterScreen" as never)}
          >
            <Ionicons name="help-circle" size={24} color={colors.primary} />
            <AppText size="h4" weight="bold" color={colors.primary}>
              Need help with privacy?
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
  // LOADING
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
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
  switchContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  switch: {
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
  },
  // TIPS CARD
  tipsCard: {
    backgroundColor: colors.accentMint,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.accentTeal + '30',
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
    lineHeight: 24,
  },
  // AUTO-SAVE CARD
  autoSaveCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success + '15',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  // HELP BUTTON
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary + '15',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
});
