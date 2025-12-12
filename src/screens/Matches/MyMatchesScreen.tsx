import React, { useState, useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  View,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { matchingApi } from "@/src/api/matchingApi";
import { getFullPhotoUrl } from "@/src/api/chatApi";
import { Match, MatchStats } from "@/src/types/matching";

import MatchCard, { MatchItem } from "./MatchCard";

// Transform API Match to MatchItem for MatchCard component
const transformMatchToMatchItem = (match: Match): MatchItem => {
  const matchDate = new Date(match.matchedAt);
  const formattedDate = matchDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Convert relative photo URL to full URL (backend returns /uploads/... paths)
  const fullPhotoUrl = getFullPhotoUrl(match.matchedUserProfilePhotoUrl);

  return {
    id: match.id.toString(),
    name: match.matchedUserDisplayName,
    age: match.matchedUserAge || 0,
    city: match.matchedUserLocation || "",
    avatar:
      fullPhotoUrl ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        match.matchedUserDisplayName
      )}&size=200&background=33A9A2&color=ffffff`,
    matchedOn: formattedDate,
    action: match.chatStarted ? "chat" : "chat",
    // Store original match data for navigation
    matchedUserId: match.matchedUserId,
    conversationId: match.conversationId,
    status: match.status,
    hoursUntilExpiration: match.hoursUntilExpiration,
    chatStarted: match.chatStarted,
  };
};

export default function MyMatchesScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load matches from API
  const loadMatches = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch matches and stats in parallel
      const [matchesData, statsData] = await Promise.all([
        matchingApi.getMatchesList(),
        matchingApi.getStats(),
      ]);

      setMatches(matchesData);
      setStats(statsData);

      console.log("Loaded", matchesData.length, "matches");
    } catch (err: any) {
      console.error("Failed to load matches:", err);
      setError(err.message || "Failed to load matches");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load matches when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadMatches();
    }, [loadMatches])
  );

  const handleCardPress = useCallback((userId: string) => {
    NavigationService.navigate("ViewProfileScreen", { userId });
  }, []);

  const handleActionPress = useCallback((item: MatchItem) => {
    // Check if match is expired
    if (item.status === "EXPIRED") {
      Alert.alert(
        "Match Expired",
        "This match has expired because no conversation was started. Keep swiping to find new matches!",
        [{ text: "OK" }]
      );
      return;
    }

    if (item.action === "chat") {
      NavigationService.navigate("ConversationScreen", {
        conversationId: item.conversationId || 0,
        otherUserId: item.matchedUserId,
        otherUserName: item.name,
        avatarUrl: item.avatar,
      });
      return;
    }

    NavigationService.navigate("VideoCallScreen", {
      userId: item.matchedUserId,
      username: item.name,
      callType: "video",
    });
  }, []);

  // Handle unmatch
  const handleUnmatch = useCallback(
    async (matchId: number, userName: string) => {
      Alert.alert(
        "Unmatch",
        `Are you sure you want to unmatch with ${userName}? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Unmatch",
            style: "destructive",
            onPress: async () => {
              try {
                await matchingApi.unmatch(matchId);
                // Remove from local state
                setMatches((prev) => prev.filter((m) => m.id !== matchId));
                // Update stats
                if (stats) {
                  setStats({ ...stats, activeMatches: stats.activeMatches - 1 });
                }
              } catch (err: any) {
                Alert.alert("Error", err.message || "Failed to unmatch");
              }
            },
          },
        ]
      );
    },
    [stats]
  );

  // Count matches expiring soon (within 24 hours) - only those without chat started
  const expiringCount = matches.filter(
    (m) => !m.chatStarted &&
           m.hoursUntilExpiration !== undefined &&
           m.hoursUntilExpiration <= 24 &&
           m.status !== "EXPIRED"
  ).length;

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="h4" color={colors.textSecondary} style={styles.emptyText}>
            Loading your matches...
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="alert-circle-outline" size={80} color={colors.warning} />
          </View>
          <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
            Something went wrong
          </AppText>
          <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
            {error}
          </AppText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMatches()}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color={colors.white} />
            <AppText size="body" weight="bold" color={colors.white}>
              Tap to Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="heart" size={80} color={colors.accentTeal} />
        </View>
        <AppText size="h2" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
          No Matches Yet
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
          Start browsing to find people who share your interests!
        </AppText>
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => NavigationService.navigate("DiscoveryScreen")}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={26} color={colors.white} />
          <AppText size="h4" weight="bold" color={colors.white}>
            Find People
          </AppText>
        </TouchableOpacity>
      </View>
    );
  };

  // Render header with helpful info
  const renderHeader = () => {
    if (matches.length === 0) return null;

    return (
      <View style={styles.listHeader}>
        {/* Helpful instruction for seniors */}
        <View style={styles.instructionCard}>
          <Ionicons name="information-circle" size={24} color={colors.accentTeal} />
          <AppText size="body" color={colors.textSecondary} style={styles.instructionText}>
            Tap on a card to view their profile. Tap the button to start chatting.
          </AppText>
        </View>

        {/* Warning for expiring matches */}
        {expiringCount > 0 && (
          <View style={styles.warningCard}>
            <Ionicons name="time" size={28} color={colors.warning} />
            <View style={styles.warningTextContainer}>
              <AppText size="body" weight="bold" color={colors.textPrimary}>
                {expiringCount} {expiringCount === 1 ? "match needs" : "matches need"} attention!
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                Start a conversation before they expire
              </AppText>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Transform matches to MatchItem format
  // Filter out matches where chat has already started (they're now in Inbox)
  const matchItems = matches
    .filter((match) => !match.chatStarted)
    .map(transformMatchToMatchItem);

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradientBackground}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="heart-circle" size={40} color={colors.accentTeal} />
            <AppText size="h2" weight="bold" style={styles.title}>
              My Matches
            </AppText>
            {matchItems.length > 0 && (
              <View style={styles.countBadge}>
                <AppText size="body" weight="bold" color={colors.white}>
                  {matchItems.length}
                </AppText>
              </View>
            )}
          </View>
          <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
            People who want to connect with you
          </AppText>
        </View>

        <FlatList
          data={matchItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MatchCard
              item={item}
              onPress={handleCardPress}
              onActionPress={handleActionPress}
              onLongPress={() => handleUnmatch(parseInt(item.id, 10), item.name)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            matchItems.length === 0 && styles.emptyListContent,
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadMatches(true)}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressViewOffset={10}
            />
          }
        />
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
  },
  gradientBackground: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 16,
    paddingTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    color: colors.textPrimary,
    flex: 1,
  },
  subtitle: {
    marginTop: 4,
    marginLeft: 52, // Align with title after icon
  },
  countBadge: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  listHeader: {
    marginBottom: 16,
    gap: 12,
  },
  instructionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.accentMint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
  },
  instructionText: {
    flex: 1,
    lineHeight: 24,
  },
  warningCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  warningTextContainer: {
    flex: 1,
    gap: 2,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyListContent: {
    flex: 1,
  },
  separator: {
    height: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    marginTop: 8,
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 28,
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 24,
    paddingHorizontal: 36,
    paddingVertical: 18,
    backgroundColor: colors.warning,
    borderRadius: 20,
    minHeight: 60,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  discoverButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 32,
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: colors.accentTeal,
    borderRadius: 20,
    minHeight: 64,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
});

