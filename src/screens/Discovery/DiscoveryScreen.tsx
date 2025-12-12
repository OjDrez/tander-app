import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import SwipeCard from '@/src/components/discovery/SwipeCard';
import MatchCelebrationModal from '@/src/components/modals/MatchCelebrationModal';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { discoveryApi } from '@/src/api/discoveryApi';
import { matchingApi } from '@/src/api/matchingApi';
import { DiscoveryProfile, SwipeResponse, MatchStats } from '@/src/types/matching';

/**
 * DiscoveryScreen
 *
 * The main swipe screen for discovering potential matches.
 * Optimized for seniors (60+) with:
 * - Large, clear UI elements
 * - Both gesture and button-based swiping
 * - Clear feedback on actions
 * - Accessible labels
 */
export default function DiscoveryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [profiles, setProfiles] = useState<DiscoveryProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<MatchStats | null>(null);

  // Match celebration modal
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchData, setMatchData] = useState<SwipeResponse | null>(null);

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

      console.log('✅ Loaded', profilesData.length, 'profiles');
    } catch (err: any) {
      console.error('❌ Failed to load profiles:', err);
      setError(err.message || 'Failed to load profiles');
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
    console.log('👈 Swiped LEFT on:', profile.displayName);

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
      console.error('Failed to record swipe:', err);
      // Still move to next profile even if API fails
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle swipe right (like)
  const handleSwipeRight = async (profile: DiscoveryProfile) => {
    console.log('👉 Swiped RIGHT on:', profile.displayName);

    try {
      const response = await matchingApi.like(profile.userId);

      // Check if it's a match!
      if (response.isMatch) {
        console.log('🎉 IT\'S A MATCH!');
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
          activeMatches: response.isMatch ? stats.activeMatches + 1 : stats.activeMatches,
        });
      }
    } catch (err: any) {
      console.error('Failed to record swipe:', err);
      // Still move to next profile even if API fails
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Handle view profile
  const handleViewProfile = (profile: DiscoveryProfile) => {
    navigation.navigate('ViewProfileScreen', { userId: profile.userId.toString() });
  };

  // Handle match modal actions
  const handleSendMessage = () => {
    setShowMatchModal(false);
    if (matchData?.matchedUserId) {
      navigation.navigate('ConversationScreen', {
        conversationId: 0, // Will be created on first message
        otherUserId: matchData.matchedUserId,
        otherUserName: matchData.matchedUserDisplayName || 'Match',
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
      <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary} style={styles.loadingText}>
              Finding people near you...
            </AppText>
          </View>
        </LinearGradient>
      </FullScreen>
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
            <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
            <AppText size="h3" weight="semibold" color={colors.textPrimary} style={styles.emptyTitle}>
              Something went wrong
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.emptySubtitle}>
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
              <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
              <AppText size="h3" weight="semibold" color={colors.textPrimary} style={styles.emptyTitle}>
                That's everyone for now!
              </AppText>
              <AppText size="body" color={colors.textSecondary} style={styles.emptySubtitle}>
                You've seen all available profiles. Check back later for new people to meet!
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
                  <AppText size="h4" weight="semibold" color={colors.textPrimary}>
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
                      <AppText size="h2" weight="bold" color={colors.accentTeal}>
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
        <SafeAreaView edges={['top']} style={styles.safeArea}>
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
                onPress={() => navigation.navigate('MyMatchesScreen')}
                accessibilityRole="button"
                accessibilityLabel={`View matches. You have ${stats?.activeMatches || 0} matches`}
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
                onPress={() => {/* Open filters */}}
                accessibilityRole="button"
                accessibilityLabel="Filter profiles"
              >
                <Ionicons name="options-outline" size={24} color={colors.textPrimary} />
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
              />
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <AppText size="small" color={colors.textSecondary} style={styles.instructionText}>
              Swipe right to like, left to pass, or use the buttons below
            </AppText>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Match Celebration Modal */}
      <MatchCelebrationModal
        visible={showMatchModal}
        matchData={matchData}
        onSendMessage={handleSendMessage}
        onKeepBrowsing={handleKeepBrowsing}
      />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
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
    justifyContent: 'center',
  },
  statsCard: {
    marginTop: 32,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
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
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerLeft: {
    gap: 4,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructions: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  instructionText: {
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});
