import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
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

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi, UserProfile } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";

type ViewProfileDetailsRouteProp =
  RouteProp<AppStackParamList, "ViewProfileDetailsScreen">;

type ViewProfileDetailsNav = NativeStackNavigationProp<AppStackParamList>;

interface ProfileDisplay {
  name: string;
  email: string;
  avatar: string | null;
  basicInfo: { label: string; value: string }[];
  about: {
    bio: string;
    interests: string[];
    lookingFor: string[];
  };
}

export default function ViewProfileDetailsScreen() {
  const navigation = useNavigation<ViewProfileDetailsNav>();
  const route = useRoute<ViewProfileDetailsRouteProp>();
  const userId = route.params?.userId;

  const [profile, setProfile] = useState<ProfileDisplay | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [userId])
  );

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // Load current user profile (for settings view)
      const userData = await userApi.getCurrentUser();

      const displayProfile: ProfileDisplay = {
        name: userData.displayName || "User",
        email: userData.email,
        avatar: userData.profilePhotoUrl || null,
        basicInfo: [
          { label: "First Name", value: userData.firstName || "-" },
          { label: "Last Name", value: userData.lastName || "-" },
          { label: "Nick Name", value: userData.nickName || "-" },
          { label: "Age", value: userData.age?.toString() || "-" },
          { label: "Country", value: userData.country || "-" },
          { label: "City/Province", value: userData.city || "-" },
          { label: "Civil Status", value: userData.civilStatus || "-" },
          { label: "Hobby", value: userData.hobby || "-" },
        ],
        about: {
          bio: userData.bio || "No bio yet",
          interests: userApi.parseInterests(userData.interests),
          lookingFor: userApi.parseLookingFor(userData.lookingFor),
        },
      };

      setProfile(displayProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPhotoUrl = () => {
    if (profile?.avatar) {
      return photoApi.getPhotoUrl(profile.avatar);
    }
    return "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80";
  };

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="body" color={colors.textSecondary} style={{ marginTop: 16 }}>
            Loading profile...
          </AppText>
        </View>
      </FullScreen>
    );
  }

  if (!profile) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <AppText size="body" color={colors.textSecondary}>
            Failed to load profile
          </AppText>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <AppText size="body" color={colors.primary}>Go Back</AppText>
          </TouchableOpacity>
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
              My Profile
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
            <Image source={{ uri: getPhotoUrl() || undefined }} style={styles.avatar} />
            <View style={styles.summaryTextBlock}>
              <AppText size="h3" weight="bold" color={colors.textPrimary}>
                {profile.name}
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                {profile.email}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate("EditBasicInfoScreen")}
            >
              <Ionicons name="pencil" size={16} color={colors.primary} />
              <AppText size="small" weight="semibold" color={colors.primary}>
                Edit Profile
              </AppText>
            </TouchableOpacity>
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

            {profile.about.interests.length > 0 && (
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
            )}

            {profile.about.lookingFor.length > 0 && (
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
            )}
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
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.accentMint,
    borderRadius: 12,
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
