import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { discoveryApi } from "@/src/api/discoveryApi";
import { matchingApi } from "@/src/api/matchingApi";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import MatchingTutorial from "@/src/components/discovery/MatchingTutorial";
import SwipeCard from "@/src/components/discovery/SwipeCard";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MatchCelebrationModal from "@/src/components/modals/MatchCelebrationModal";
import colors from "@/src/config/colors";
import { useRealtimeMatching } from "@/src/hooks/useRealtimeMatching";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { notificationService } from "@/src/services/notificationService";
import {
  DiscoveryProfile,
  MatchStats,
  SwipeResponse,
} from "@/src/types/matching";
import crashlytics from "@react-native-firebase/crashlytics";

/**
 * DiscoveryScreen - Senior Friendly Edition
 *
 * The main swipe screen for discovering potential matches.
 * Optimized for seniors (60+) with:
 * - Large, clear UI elements (minimum 56px touch targets)
 * - Both gesture and button-based swiping
 * - Clear feedback on actions with haptic
 * - Accessible labels for screen readers
 * - Real-time match notifications
 * - Tutorial for first-time users
 * - Encouraging messages
 */
export default function DiscoveryScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [isFirstProfile, setIsFirstProfile] = useState(true);

  // Match celebration modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState<SwipeResponse | null>(null);

  // Real-time matching hook for instant notifications
  const {
    isConnected: isRealtimeConnected,
    newMatchAlert,
    clearNewMatchAlert,
    expiringMatches,
  } = useRealtimeMatching({
    onNewMatch: (match) => {
      // Handle real-time match notification (from other user's swipe)
      console.log("[Discovery] Real-time match received:", match);
      setMatchData(match);
      setShowMatchModal(true);
    },
  });

  // Request notification permissions on mount
  useEffect(() => {
    notificationService.requestPermissions();
  }, []);

  // Load profiles
  const loadProfiles = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch profiles and stats in parallel
      const [profilesData, statsData] = await Promise.all([
        discoveryApi.getProfileBatch(20),
        matchingApi.getStats(),
      ]);

      setProfiles(profilesData);
      setStats(statsData);
      setCurrentIndex(0);

      console.log("✅ Loaded", profilesData.length, "profiles");
    } catch (err: any) {
      console.error("❌ Failed to load profiles:", err);
      setError(err.message || "Failed to load profiles");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load profiles when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  // Handle swipe left (pass)
  const handleSwipeLeft = async (profile: DiscoveryProfile) => {
    console.log("👈 Swiped LEFT on:", profile.displayName);

    try {
      await matchingApi.pass(profile.userId);

      // Move to next profile
      setCurrentIndex((prev) => prev + 1);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          dailySwipesUsed: stats.dailySwipesUsed + 1,
          dailySwipesRemaining: stats.dailySwipesRemaining - 1,
        });
      }
    } catch (err: any) {
      console.error("Failed to record swipe:", err);
      // Still move to next profile even if API fails
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle swipe right (like)
  const handleSwipeRight = async (profile: DiscoveryProfile) => {
    console.log("👉 Swiped RIGHT on:", profile.displayName);

    try {
      const response = await matchingApi.like(profile.userId);

      // Check if it's a match!
      if (response.isMatch) {
        console.log("🎉 IT'S A MATCH!");
        setMatchData(response);
        setShowMatchModal(true);
      }

      // Move to next profile
      setCurrentIndex((prev) => prev + 1);

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          dailySwipesUsed: stats.dailySwipesUsed + 1,
          dailySwipesRemaining: stats.dailySwipesRemaining - 1,
          activeMatches: response.isMatch
            ? stats.activeMatches + 1
            : stats.activeMatches,
        });
      }
    } catch (err: any) {
      console.error("Failed to record swipe:", err);
      crashlytics().recordError(err);
      crashlytics().log("Failed to record swipe in DiscoveryScreen");
      // Still move to next profile even if API fails
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle view profile
  const handleViewProfile = (profile: DiscoveryProfile) => {
    navigation.navigate("ViewProfileScreen", {
      userId: profile.userId.toString(),
    });
  };

  // Handle match modal actions
  const handleSendMessage = () => {
    setShowMatchModal(false);
    if (matchData?.matchedUserId) {
      navigation.navigate("ConversationScreen", {
        conversationId: 0, // Will be created on first message
        otherUserId: matchData.matchedUserId,
        otherUserName: matchData.matchedUserDisplayName || "Match",
        avatarUrl: matchData.matchedUserProfilePhotoUrl,
      });
    }
  };

  const handleKeepBrowsing = () => {
    setShowMatchModal(false);
    setMatchData(null);
  };

  // Get current and next profile
  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  // Check if out of profiles
  const isOutOfProfiles = currentIndex >= profiles.length;

  // Render loading state
  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Finding people near you..."
      />
    );
  }

  // Render error state
  if (error) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          style={styles.gradient}
        >
          <View style={styles.emptyContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={colors.textMuted}
            />
            <AppText
              size="h3"
              weight="semibold"
              color={colors.textPrimary}
              style={styles.emptyTitle}
            >
              Something went wrong
            </AppText>
            <AppText
              size="body"
              color={colors.textSecondary}
              style={styles.emptySubtitle}
            >
              {error}
            </AppText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => loadProfiles()}
              accessibilityRole="button"
              accessibilityLabel="Try again"
            >
              <AppText size="body" weight="semibold" color={colors.primary}>
                Try Again
              </AppText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </FullScreen>
    );
  }

  // Render out of profiles state
  if (isOutOfProfiles) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          style={styles.gradient}
        >
          <ScrollView
            contentContainerStyle={styles.emptyScrollContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadProfiles(true)}
                tintColor={colors.primary}
              />
            }
          >
            <View style={styles.emptyContainer}>
              <Ionicons
                name="heart-outline"
                size={80}
                color={colors.textMuted}
              />
              <AppText
                size="h3"
                weight="semibold"
                color={colors.textPrimary}
                style={styles.emptyTitle}
              >
                That's everyone for now!
              </AppText>
              <AppText
                size="body"
                color={colors.textSecondary}
                style={styles.emptySubtitle}
              >
                You've seen all available profiles. Check back later for new
                people to meet!
              </AppText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => loadProfiles(true)}
                accessibilityRole="button"
                accessibilityLabel="Refresh profiles"
              >
                <AppText size="body" weight="semibold" color={colors.primary}>
                  Refresh
                </AppText>
              </TouchableOpacity>

              {stats && (
                <View style={styles.statsCard}>
                  <AppText
                    size="h4"
                    weight="semibold"
                    color={colors.textPrimary}
                  >
                    Your Activity Today
                  </AppText>
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <AppText size="h2" weight="bold" color={colors.primary}>
                        {stats.dailySwipesUsed}
                      </AppText>
                      <AppText size="small" color={colors.textSecondary}>
                        Profiles Viewed
                      </AppText>
                    </View>
                    <View style={styles.statItem}>
                      <AppText
                        size="h2"
                        weight="bold"
                        color={colors.accentTeal}
                      >
                        {stats.activeMatches}
                      </AppText>
                      <AppText size="small" color={colors.textSecondary}>
                        Matches
                      </AppText>
                    </View>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </LinearGradient>
      </FullScreen>
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradient}
      >
        <SafeAreaView edges={["top"]} style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <AppText size="h3" weight="bold" color={colors.textPrimary}>
                Discover
              </AppText>
              {stats && (
                <View style={styles.swipeCounter}>
                  <AppText size="small" color={colors.textSecondary}>
                    {stats.dailySwipesRemaining} swipes left today
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate("MyMatchesScreen")}
                accessibilityRole="button"
                accessibilityLabel={`View matches. You have ${
                  stats?.activeMatches || 0
                } matches`}
              >
                <Ionicons name="heart" size={24} color={colors.primary} />
                {stats && stats.activeMatches > 0 && (
                  <View style={styles.badge}>
                    <AppText size="small" weight="bold" color={colors.white}>
                      {stats.activeMatches}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  /* Open filters */
                }}
                accessibilityRole="button"
                accessibilityLabel="Filter profiles"
              >
                <Ionicons
                  name="options-outline"
                  size={24}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Card Stack */}
          <View style={styles.cardContainer}>
            {/* Render next card (behind) */}
            {nextProfile && (
              <SwipeCard
                key={nextProfile.userId}
                profile={nextProfile}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onViewProfile={handleViewProfile}
                isFirst={false}
              />
            )}

            {/* Render current card (front) */}
            {currentProfile && (
              <SwipeCard
                key={currentProfile.userId}
                profile={currentProfile}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onViewProfile={handleViewProfile}
                isFirst={true}
                showTutorial={isFirstProfile && currentIndex === 0}
              />
            )}
          </View>

          {/* Instructions - Senior Friendly */}
          <View style={styles.instructions}>
            <AppText
              size="body"
              color={colors.textSecondary}
              style={styles.instructionText}
            >
              Tap the buttons below, or swipe the card left or right
            </AppText>
          </View>

          {/* Real-time connection indicator */}
          {!isRealtimeConnected && (
            <View style={styles.connectionBanner}>
              <Ionicons name="wifi-outline" size={16} color={colors.warning} />
              <AppText size="small" color={colors.warning}>
                Connecting...
              </AppText>
            </View>
          )}

          {/* Expiring matches warning */}
          {expiringMatches.length > 0 && (
            <TouchableOpacity
              style={styles.expiringBanner}
              onPress={() => navigation.navigate("MyMatchesScreen")}
              accessibilityRole="button"
              accessibilityLabel={`You have ${expiringMatches.length} match${
                expiringMatches.length > 1 ? "es" : ""
              } expiring soon. Tap to view.`}
            >
              <Ionicons name="time" size={20} color={colors.white} />
              <AppText size="body" weight="semibold" color={colors.white}>
                {expiringMatches.length} match
                {expiringMatches.length > 1 ? "es" : ""} expiring soon!
              </AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        visible={showMatchModal}
        matchData={matchData}
        onSendMessage={handleSendMessage}
        onKeepBrowsing={handleKeepBrowsing}
      />

      {/* Tutorial for first-time users */}
      <MatchingTutorial onComplete={() => setIsFirstProfile(false)} />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 56,
    justifyContent: "center",
  },
  statsCard: {
    marginTop: 32,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    gap: 4,
  },
  headerRight: {
    flexDirection: "row",
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  swipeCounter: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  instructions: {
    paddingVertical: 16,
    alignItems: "center",
  },
  instructionText: {
    textAlign: "center",
    paddingHorizontal: 40,
    fontSize: 16, // Larger text for seniors
    lineHeight: 24,
  },
  connectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 12,
  },
  expiringBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.warning,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: colors.warning,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
