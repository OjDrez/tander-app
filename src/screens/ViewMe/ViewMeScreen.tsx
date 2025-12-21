import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { matchingApi } from "@/src/api/matchingApi";
import { photoApi } from "@/src/api/photoApi";
import { DiscoveryProfile, MatchStats, DiscoveryStats } from "@/src/types/matching";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DashboardState {
  likesCount: number;
  matchesCount: number;
  swipesRemaining: number;
  recentLikes: DiscoveryProfile[];
  isLoading: boolean;
  error: string | null;
}

export default function ViewMeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [dashboard, setDashboard] = useState<DashboardState>({
    likesCount: 0,
    matchesCount: 0,
    swipesRemaining: 0,
    recentLikes: [],
    isLoading: true,
    error: null,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setDashboard((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch all data in parallel
      const [likesResponse, matchStats, likesCount] = await Promise.all([
        discoveryApi.getProfilesWhoLikedMe(0, 4),
        matchingApi.getStats().catch(() => ({
          activeMatches: 0,
          dailySwipesRemaining: 0,
          dailySwipesUsed: 0,
          dailySwipeLimit: 50,
        })),
        discoveryApi.getLikesReceivedCount().catch(() => ({ count: 0, message: "" })),
      ]);

      setDashboard({
        likesCount: likesCount.count || likesResponse.totalElements || 0,
        matchesCount: matchStats.activeMatches || 0,
        swipesRemaining: matchStats.dailySwipesRemaining || 0,
        recentLikes: likesResponse.content || [],
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load dashboard:", error);
      setDashboard((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to load data",
      }));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, [loadDashboardData]);

  const getPhotoUrl = (photoPath?: string | null, name?: string): string => {
    if (photoPath) {
      const url = photoApi.getPhotoUrl(photoPath);
      if (url) return url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&size=200&background=F5A14B&color=fff`;
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

  const handleViewerPress = (userId: number) => {
    navigation.navigate("ViewProfileScreen", { userId: userId.toString() });
  };

  // Loading state
  if (dashboard.isLoading && dashboard.recentLikes.length === 0) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <LoadingIndicator
            variant="inline"
            message="Loading your activity..."
          />
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
            <AppText size="h3" weight="bold" color={colors.textPrimary}>
              Activity
            </AppText>
            <View style={styles.placeholder} />
          </View>

          {/* Stats cards */}
          <View style={styles.statsRow}>
            {/* Likes received */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate("PeopleViewedMeScreen")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.primary, "#FF8A4C"]}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIconContainer}>
                  <Ionicons name="heart" size={24} color={colors.white} />
                </View>
                <AppText size="h1" weight="bold" color={colors.white}>
                  {dashboard.likesCount}
                </AppText>
                <AppText size="small" color="rgba(255,255,255,0.9)">
                  Likes Received
                </AppText>
              </LinearGradient>
            </TouchableOpacity>

            {/* Active matches */}
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate("MyMatchesScreen")}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.accentTeal, "#2DD4BF"]}
                style={styles.statCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.statIconContainer}>
                  <MaterialCommunityIcons name="heart-multiple" size={24} color={colors.white} />
                </View>
                <AppText size="h1" weight="bold" color={colors.white}>
                  {dashboard.matchesCount}
                </AppText>
                <AppText size="small" color="rgba(255,255,255,0.9)">
                  Active Matches
                </AppText>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Swipes remaining banner */}
          <View style={styles.swipesBanner}>
            <View style={styles.swipesIconContainer}>
              <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
            </View>
            <View style={styles.swipesTextContainer}>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                {dashboard.swipesRemaining} swipes remaining today
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                Keep swiping to find your perfect match
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.swipeButton}
              onPress={() => navigation.navigate("HomeScreen")}
            >
              <AppText size="small" weight="bold" color={colors.white}>
                Swipe
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Recent likes section */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="eye" size={20} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                People Who Like You
              </AppText>
            </View>
            {dashboard.likesCount > 0 && (
              <TouchableOpacity onPress={() => navigation.navigate("PeopleViewedMeScreen")}>
                <AppText size="small" weight="semibold" color={colors.primary}>
                  See All
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {dashboard.recentLikes.length === 0 ? (
            <View style={styles.emptyLikesContainer}>
              <View style={styles.emptyLikesIcon}>
                <Ionicons name="heart-outline" size={48} color={colors.textMuted} />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                No likes yet
              </AppText>
              <AppText size="small" color={colors.textSecondary} style={styles.emptyLikesText}>
                When someone likes your profile, they'll appear here
              </AppText>
              <TouchableOpacity
                style={styles.discoverButton}
                onPress={() => navigation.navigate("HomeScreen")}
              >
                <Ionicons name="compass" size={18} color={colors.white} />
                <AppText size="body" weight="semibold" color={colors.white}>
                  Start Discovering
                </AppText>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.likesScrollContent}
            >
              {dashboard.recentLikes.map((profile) => (
                <TouchableOpacity
                  key={profile.userId}
                  style={styles.likeCard}
                  onPress={() => handleViewerPress(profile.userId)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: getPhotoUrl(profile.profilePhotoUrl, profile.displayName) }}
                    style={styles.likeCardImage}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={styles.likeCardGradient}
                  />
                  {profile.verified && (
                    <View style={styles.likeCardVerified}>
                      <Ionicons name="shield-checkmark" size={12} color={colors.white} />
                    </View>
                  )}
                  {profile.online && <View style={styles.likeCardOnline} />}
                  <View style={styles.likeCardInfo}>
                    <AppText size="body" weight="bold" color={colors.white} numberOfLines={1}>
                      {profile.displayName}
                    </AppText>
                    {profile.age && (
                      <AppText size="small" color="rgba(255,255,255,0.9)">
                        {profile.age} years old
                      </AppText>
                    )}
                  </View>
                  <View style={styles.likeCardHeart}>
                    <Ionicons name="heart" size={16} color={colors.white} />
                  </View>
                </TouchableOpacity>
              ))}

              {/* See more card */}
              {dashboard.likesCount > 4 && (
                <TouchableOpacity
                  style={styles.seeMoreCard}
                  onPress={() => navigation.navigate("PeopleViewedMeScreen")}
                  activeOpacity={0.9}
                >
                  <View style={styles.seeMoreContent}>
                    <View style={styles.seeMoreIcon}>
                      <Ionicons name="arrow-forward" size={24} color={colors.primary} />
                    </View>
                    <AppText size="body" weight="semibold" color={colors.primary}>
                      +{dashboard.likesCount - 4} more
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      View all
                    </AppText>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Quick actions */}
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="flash" size={20} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Quick Actions
              </AppText>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("HomeScreen")}
              activeOpacity={0.9}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentPeach }]}>
                <Ionicons name="compass" size={24} color={colors.primary} />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Discover
              </AppText>
              <AppText size="tiny" color={colors.textSecondary}>
                Find new people
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("MyMatchesScreen")}
              activeOpacity={0.9}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: colors.accentMint }]}>
                <MaterialCommunityIcons name="heart-multiple" size={24} color={colors.accentTeal} />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Matches
              </AppText>
              <AppText size="tiny" color={colors.textSecondary}>
                View your matches
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate("InboxScreen")}
              activeOpacity={0.9}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="chatbubbles" size={24} color="#6366F1" />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Messages
              </AppText>
              <AppText size="tiny" color={colors.textSecondary}>
                Chat with matches
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>

      <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
    </FullScreen>
  );
}

const STAT_CARD_WIDTH = (SCREEN_WIDTH - 18 * 2 - 14) / 2;

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
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
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
  placeholder: {
    width: 44,
  },
  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  statCardGradient: {
    padding: 20,
    alignItems: "center",
    gap: 8,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  // Swipes banner
  swipesBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  swipesIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentPeach,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  swipesTextContainer: {
    flex: 1,
  },
  swipeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  // Section header
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  // Empty likes
  emptyLikesContainer: {
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
  },
  emptyLikesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyLikesText: {
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  discoverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
  },
  // Likes scroll
  likesScrollContent: {
    paddingBottom: 8,
    gap: 12,
    marginBottom: 24,
  },
  likeCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  likeCardImage: {
    width: "100%",
    height: "100%",
  },
  likeCardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  likeCardVerified: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
  },
  likeCardOnline: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: colors.white,
  },
  likeCardInfo: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
  },
  likeCardHeart: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  seeMoreCard: {
    width: 140,
    height: 180,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  seeMoreContent: {
    alignItems: "center",
    gap: 8,
  },
  seeMoreIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  // Quick actions
  quickActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  quickActionCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 100,
  },
});
