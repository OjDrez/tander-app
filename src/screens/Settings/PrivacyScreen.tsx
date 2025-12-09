import { Ionicons } from "@expo/vector-icons";
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
import NavigationService from "@/src/navigation/NavigationService";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type PrivacyNav = NativeStackNavigationProp<AppStackParamList>;

export default function PrivacyScreen() {
  const navigation = useNavigation<PrivacyNav>();
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [allowLocation, setAllowLocation] = useState(true);
  const [showApproximateDistance, setShowApproximateDistance] = useState(false);

  const handleGoBack = () => navigation.goBack();

  const handleBlockedUsersPress = () => {
    NavigationService.navigate("BlockedUsersScreen");
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
              Privacy
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
                <AppText weight="semibold" color={colors.textPrimary}>
                  Show my profile publicly
                </AppText>
                <Switch
                  value={isProfilePublic}
                  onValueChange={setIsProfilePublic}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
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
                <AppText weight="semibold" color={colors.textPrimary}>
                  Allow location access
                </AppText>
                <Switch
                  value={allowLocation}
                  onValueChange={setAllowLocation}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
                />
              </View>

              <View style={styles.listCard}>
                <AppText weight="semibold" color={colors.textPrimary}>
                  Show approximate distance
                </AppText>
                <Switch
                  value={showApproximateDistance}
                  onValueChange={setShowApproximateDistance}
                  trackColor={{
                    false: colors.borderMedium,
                    true: colors.primary,
                  }}
                  thumbColor={colors.white}
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
});
