import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useCallback } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";

import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { discoveryApi } from "@/src/api/discoveryApi";
import { photoApi } from "@/src/api/photoApi";
import { DiscoveryProfile } from "@/src/types/matching";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - 18 * 2 - 14) / 2;

interface ViewerState {
  data: DiscoveryProfile[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
}

export default function PeopleViewedMeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [viewers, setViewers] = useState<ViewerState>({
    data: [],
    isLoading: true,
    error: null,
    totalCount: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadViewers = useCallback(async () => {
    try {
      setViewers((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch profiles who liked the current user
      const response = await discoveryApi.getProfilesWhoLikedMe(0, 20);

      setViewers({
        data: response.content || [],
        isLoading: false,
        error: null,
        totalCount: response.totalElements || 0,
      });
    } catch (error: any) {
      console.error("Failed to load viewers:", error);
      setViewers({
        data: [],
        isLoading: false,
        error: error.message || "Failed to load viewers",
        totalCount: 0,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadViewers();
    }, [loadViewers])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadViewers();
    setRefreshing(false);
  }, [loadViewers]);

  const getPhotoUrl = (photoPath?: string | null, name?: string): string => {
    if (photoPath) {
      const url = photoApi.getPhotoUrl(photoPath);
      if (url) return url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&size=400&background=F5A14B&color=fff`;
  };

  const handleCardPress = (userId: number) => {
    navigation.navigate("ViewProfileScreen", { userId: userId.toString() });
  };

  const handleTabPress = (tab: MainNavigationTab) => {
    if (tab === "Home") {
      navigation.navigate("HomeScreen");
    } else if (tab === "Inbox") {
      navigation.navigate("InboxScreen");
    } else if (tab === "Matches") {
      navigation.navigate("MyMatchesScreen");
    } else if (tab === "Profile") {
      navigation.navigate("SettingsScreen");
    }
  };

  // Loading state
  if (viewers.isLoading && viewers.data.length === 0) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary} style={styles.loadingText}>
              Finding people who viewed you...
            </AppText>
          </View>
        </SafeAreaView>
        <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
      </FullScreen>
    );
  }

  // Error state
  if (viewers.error && viewers.data.length === 0) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="eye-off-outline" size={64} color={colors.textMuted} />
            </View>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.errorTitle}>
              Something went wrong
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.errorMessage}>
              {viewers.error}
            </AppText>
            <TouchableOpacity style={styles.retryButton} onPress={loadViewers}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <AppText size="body" weight="semibold" color={colors.white}>
                Try Again
              </AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
      </FullScreen>
    );
  }

  // Empty state
  if (!viewers.isLoading && viewers.data.length === 0) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Ionicons name="eye" size={16} color={colors.primary} />
              </View>
              <AppText size="h3" weight="bold" style={styles.titleText}>
                Who Viewed Me
              </AppText>
            </View>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="eye-outline" size={80} color={colors.textMuted} />
            </View>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
              No viewers yet
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.emptyMessage}>
              When someone views your profile, they'll appear here. Complete your profile to attract more visitors!
            </AppText>
            <TouchableOpacity
              style={styles.completeProfileButton}
              onPress={() => navigation.navigate("EditBasicInfoScreen")}
            >
              <Ionicons name="person-add" size={20} color={colors.white} />
              <AppText size="body" weight="semibold" color={colors.white}>
                Complete My Profile
              </AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
      </FullScreen>
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Ionicons name="eye" size={16} color={colors.primary} />
              </View>
              <AppText size="h3" weight="bold" style={styles.titleText}>
                Who Viewed Me
              </AppText>
            </View>
            <View style={styles.placeholder} />
          </View>

          {/* Stats banner */}
          <View style={styles.statsBanner}>
            <LinearGradient
              colors={[colors.primary, colors.accentTeal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.statsBannerGradient}
            >
              <View style={styles.statsIconContainer}>
                <Ionicons name="eye" size={24} color={colors.white} />
              </View>
              <View style={styles.statsTextContainer}>
                <AppText size="h2" weight="bold" color={colors.white}>
                  {viewers.totalCount}
                </AppText>
                <AppText size="small" color="rgba(255,255,255,0.9)">
                  {viewers.totalCount === 1 ? "person viewed" : "people viewed"} your profile
                </AppText>
              </View>
            </LinearGradient>
          </View>

          {/* Subtitle */}
          <View style={styles.subtitleRow}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Recent Viewers
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Tap to view profile
            </AppText>
          </View>

          {/* Grid of viewers */}
          <View style={styles.grid}>
            {viewers.data.map((viewer) => (
              <TouchableOpacity
                key={viewer.userId}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => handleCardPress(viewer.userId)}
                accessibilityRole="button"
                accessibilityLabel={`View ${viewer.displayName}'s profile`}
              >
                <View style={styles.imageWrapper}>
                  <Image
                    source={{ uri: getPhotoUrl(viewer.profilePhotoUrl, viewer.displayName) }}
                    style={styles.image}
                  />

                  {/* Gradient overlay */}
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.6)"]}
                    style={styles.imageGradient}
                  />

                  {/* Verified badge */}
                  {viewer.verified && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                    </View>
                  )}

                  {/* Online indicator */}
                  {viewer.online && (
                    <View style={styles.onlineIndicator} />
                  )}

                  {/* Liked you badge */}
                  {viewer.hasLikedMe && (
                    <View style={styles.likedBadge}>
                      <Ionicons name="heart" size={14} color={colors.white} />
                    </View>
                  )}

                  {/* Name overlay on image */}
                  <View style={styles.nameOverlay}>
                    <AppText size="body" weight="bold" color={colors.white} numberOfLines={1}>
                      {viewer.displayName}
                    </AppText>
                    {viewer.age && (
                      <AppText size="small" weight="medium" color={colors.white}>
                        , {viewer.age}
                      </AppText>
                    )}
                  </View>
                </View>

                <View style={styles.cardBody}>
                  {/* Location */}
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.accentTeal} />
                    <AppText
                      size="small"
                      weight="medium"
                      color={colors.textSecondary}
                      style={styles.locationText}
                      numberOfLines={1}
                    >
                      {viewer.city || viewer.country || "Location not set"}
                    </AppText>
                  </View>

                  {/* Tags */}
                  {viewer.lookingFor && viewer.lookingFor.length > 0 && (
                    <View style={styles.tagRow}>
                      {viewer.lookingFor.slice(0, 2).map((tag) => (
                        <View key={tag} style={styles.tagBadge}>
                          <AppText size="tiny" weight="semibold" color={colors.primary}>
                            {tag}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
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
    paddingBottom: 20,
  },
  // Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.accentMint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  emptyMessage: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  completeProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  titleIcon: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: colors.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  // Stats banner
  statsBanner: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statsBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  statsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  statsTextContainer: {
    flex: 1,
  },
  // Subtitle
  subtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  // Grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  // Card
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  verifiedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: colors.white,
  },
  likedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  nameOverlay: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "baseline",
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 4,
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.accentMint,
    borderRadius: 10,
  },
  bottomSpacing: {
    height: 100,
  },
});
