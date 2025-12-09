import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

const PROFILE = {
  name: "Felix Cruz",
  email: "felix.cruz@hotmail.com",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
};

type SettingsNav = NativeStackNavigationProp<AppStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<SettingsNav>();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: keyof AppStackParamList) => {
    navigation.navigate(screen as never);
  };

  const handleLogout = () => {
    // Placeholder logout handler
    console.log("Logging out...");
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
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
              Settings
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

          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={() =>
              navigation.navigate("ViewProfileDetailsScreen", { userId: "1" })
            }
          >
            <View style={styles.profileRow}>
              <Image
                source={{ uri: PROFILE.avatar }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileInfo}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  {PROFILE.name}
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  {PROFILE.email}
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
                  onValueChange={setNotificationsEnabled}
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
          >
            <View style={styles.itemLeft}>
              <View style={[styles.iconBadge, styles.logoutIconBadge]}>
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={colors.danger}
                />
              </View>
              <AppText weight="bold" color={colors.danger}>
                Log Out
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
    paddingTop: 10,
    paddingBottom: 22,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
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
    color: colors.textPrimary,
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
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
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
    gap: 12,
  },
  profileAvatar: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.borderLight,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
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
  logoutCard: {
    backgroundColor: "#FFE9E9",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFD1D1",
  },
  logoutIconBadge: {
    backgroundColor: "#FFF5F5",
  },
});
