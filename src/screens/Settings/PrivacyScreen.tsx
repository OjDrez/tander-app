import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
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
import { SETTINGS_STORAGE_KEYS, PrivacySettings } from "@/src/types/settings";

type PrivacyNav = NativeStackNavigationProp<AppStackParamList>;

const PRIVACY_SETTINGS_KEY = SETTINGS_STORAGE_KEYS.PRIVACY_SETTINGS;

const DEFAULT_SETTINGS: PrivacySettings = {
  isProfilePublic: true,
  allowLocation: true,
  showApproximateDistance: false,
};

export default function PrivacyScreen() {
  const navigation = useNavigation<PrivacyNav>();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load privacy settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error("Failed to save privacy settings:", error);
    }
  };

  const handleSettingChange = (key: keyof PrivacySettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleGoBack = () => navigation.goBack();

  const handleBlockedUsersPress = () => {
    navigation.navigate("BlockedUsersScreen" as never);
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <AppHeader
          title="Privacy"
          titleAlign="left"
          onBackPress={handleGoBack}
          showLogo
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Privacy Controls
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Manage how others see your profile and activity.
            </AppText>
          </View>

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Privacy
            </AppText>

            <View style={styles.cardGroup}>
              <View style={styles.listCard}>
                <View style={styles.settingInfo}>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Show my profile publicly
                  </AppText>
                  <AppText size="tiny" color={colors.textSecondary}>
                    When off, others cannot find your profile
                  </AppText>
                </View>
                <Switch
                  value={settings.isProfilePublic}
                  onValueChange={(value) => handleSettingChange("isProfilePublic", value)}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Location
            </AppText>

            <View style={styles.cardGroup}>
              <View style={styles.listCard}>
                <View style={styles.settingInfo}>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Allow location access
                  </AppText>
                  <AppText size="tiny" color={colors.textSecondary}>
                    Used to show matches near you
                  </AppText>
                </View>
                <Switch
                  value={settings.allowLocation}
                  onValueChange={(value) => handleSettingChange("allowLocation", value)}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                  disabled={isLoading}
                />
              </View>

              <View style={styles.listCard}>
                <View style={styles.settingInfo}>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Show approximate distance
                  </AppText>
                  <AppText size="tiny" color={colors.textSecondary}>
                    Shows rough distance instead of exact
                  </AppText>
                </View>
                <Switch
                  value={settings.showApproximateDistance}
                  onValueChange={(value) => handleSettingChange("showApproximateDistance", value)}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                  disabled={isLoading}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <AppText size="tiny" weight="semibold" color={colors.textMuted}>
              Blocked
            </AppText>

            <View style={styles.cardGroup}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.listCard}
                onPress={handleBlockedUsersPress}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>
                    <Ionicons
                      name="person-remove"
                      size={18}
                      color={colors.accentBlue}
                    />
                  </View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    Blocked Users
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

          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color={colors.accentBlue} />
            <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 10 }}>
              Your privacy settings are saved automatically on this device.
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
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
    paddingHorizontal: 2,
  },
  section: {
    gap: 10,
  },
  cardGroup: {
    gap: 12,
  },
  listCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
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
  },
  settingInfo: {
    flex: 1,
    gap: 2,
    marginRight: 12,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    height: 36,
    width: 36,
    borderRadius: 12,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.accentMint,
    padding: 14,
    borderRadius: 14,
  },
});
