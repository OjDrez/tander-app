import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";

type ViewProfileDetailsRouteProp =
  RouteProp<AppStackParamList, "ViewProfileDetailsScreen">;

type ViewProfileDetailsNav = NativeStackNavigationProp<AppStackParamList>;

const MOCK_PROFILE = {
  id: "1",
  name: "Felix Cruz",
  email: "felix.cruz@hotmail.com",
  avatar:
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
  basicInfo: [
    { label: "First Name", value: "Felix" },
    { label: "Last Name", value: "Cruz" },
    { label: "Nick Name", value: "Tayix" },
    { label: "Birthday", value: "02/28/1957" },
    { label: "Age", value: "65" },
    { label: "Country", value: "Phil" },
    { label: "Civil Status", value: "Widowed" },
    { label: "City/Province", value: "Taytay" },
    { label: "Hobby", value: "Cooking" },
  ],
  about: {
    bio: "If you enjoy good food, we'll get along. I love trying new recipes and sharing them with someone. Let's cook, laugh, and enjoy life together.",
    interests: ["Music", "Cooking", "Movies"],
    lookingFor: ["Connect", "Companionship"],
  },
};

export default function ViewProfileDetailsScreen() {
  const navigation = useNavigation<ViewProfileDetailsNav>();
  const route = useRoute<ViewProfileDetailsRouteProp>();
  const { userId } = route.params;

  const profile = useMemo(() => ({ ...MOCK_PROFILE, id: userId }), [userId]);

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
              onPress={() => navigation.goBack()}
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

          <View style={styles.summaryCard}>
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
            <View style={styles.summaryTextBlock}>
              <AppText size="h3" weight="bold" color={colors.textPrimary}>
                {profile.name}
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                {profile.email}
              </AppText>
            </View>
          </View>

          <View style={styles.card}>
            <AppText size="h4" weight="bold" style={styles.cardTitle}>
              Basic Info
            </AppText>

            <View style={styles.infoGrid}>
              {profile.basicInfo.map((item) => (
                <View key={item.label} style={styles.infoItem}>
                  <AppText
                    size="tiny"
                    weight="semibold"
                    color={colors.textMuted}
                  >
                    {item.label}
                  </AppText>
                  <View style={styles.infoValueBox}>
                    <AppText weight="semibold" color={colors.textPrimary}>
                      {item.value}
                    </AppText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <AppText size="h4" weight="bold" style={styles.cardTitle}>
              About You
            </AppText>

            <AppText
              size="body"
              color={colors.textPrimary}
              style={styles.bioText}
            >
              {profile.about.bio}
            </AppText>

            <View style={styles.tagSection}>
              <AppText
                size="tiny"
                weight="semibold"
                color={colors.textMuted}
              >
                Interests
              </AppText>
              <View style={styles.tagRow}>
                {profile.about.interests.map((tag) => (
                  <View key={tag} style={styles.tagBadge}>
                    <AppText
                      size="tiny"
                      weight="semibold"
                      color={colors.textPrimary}
                    >
                      {tag}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.tagSection}>
              <AppText
                size="tiny"
                weight="semibold"
                color={colors.textMuted}
              >
                Looking For
              </AppText>
              <View style={styles.tagRow}>
                {profile.about.lookingFor.map((tag) => (
                  <View key={tag} style={styles.tagBadgeSecondary}>
                    <AppText
                      size="tiny"
                      weight="semibold"
                      color={colors.primary}
                    >
                      {tag}
                    </AppText>
                  </View>
                ))}
              </View>
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
    paddingBottom: 24,
    gap: 16,
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
  summaryCard: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  avatar: {
    height: 90,
    width: 90,
    borderRadius: 45,
    marginBottom: 12,
    backgroundColor: colors.borderLight,
  },
  summaryTextBlock: {
    alignItems: "center",
    gap: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  infoItem: {
    width: "48%",
    gap: 6,
  },
  infoValueBox: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  bioText: {
    lineHeight: 22,
  },
  tagSection: {
    gap: 8,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.accentMint,
    borderRadius: 12,
  },
  tagBadgeSecondary: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFF3E4",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
  },
});
