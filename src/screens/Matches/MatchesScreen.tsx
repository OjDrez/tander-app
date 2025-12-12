import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import MatchListItem from '@/src/components/matches/MatchListItem';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { matchingApi } from '@/src/api/matchingApi';
import { Match, MatchStats } from '@/src/types/matching';

/**
 * MatchesScreen
 *
 * Displays all active matches for the user.
 * Optimized for seniors with:
 * - Large, clear list items
 * - Easy-to-understand expiration warnings
 * - Simple navigation to chat
 * - Pull-to-refresh functionality
 */
export default function MatchesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load matches
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

      console.log(' Loaded', matchesData.length, 'matches');
    } catch (err: any) {
      console.error('L Failed to load matches:', err);
      setError(err.message || 'Failed to load matches');
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

  // Handle view profile
  const handleViewProfile = (match: Match) => {
    navigation.navigate('ViewProfileScreen', { userId: match.matchedUserId.toString() });
  };

  // Handle start/continue chat
  const handleStartChat = (match: Match) => {
    if (match.status === 'EXPIRED') {
      Alert.alert(
        'Match Expired',
        'This match has expired because no conversation was started. Keep swiping to find new matches!',
        [{ text: 'OK' }]
      );
      return;
    }

    navigation.navigate('ConversationScreen', {
      conversationId: match.conversationId || 0,
      otherUserId: match.matchedUserId,
      otherUserName: match.matchedUserDisplayName,
      avatarUrl: match.matchedUserProfilePhotoUrl,
    });
  };

  // Handle unmatch
  const handleUnmatch = async (matchId: number, userName: string) => {
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${userName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
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
              Alert.alert('Error', err.message || 'Failed to unmatch');
            }
          },
        },
      ]
    );
  };

  // Render match item
  const renderMatch = ({ item }: { item: Match }) => (
    <MatchListItem
      match={item}
      onPress={() => handleViewProfile(item)}
      onStartChat={() => handleStartChat(item)}
    />
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <AppText size="h2" weight="bold" color={colors.textPrimary}>
          Your Matches
        </AppText>
        {stats && stats.activeMatches > 0 && (
          <View style={styles.countBadge}>
            <AppText size="body" weight="bold" color={colors.white}>
              {stats.activeMatches}
            </AppText>
          </View>
        )}
      </View>

      <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
        Start a conversation with your matches before they expire!
      </AppText>

      {/* Expiring Soon Section */}
      {matches.some((m) => m.hoursUntilExpiration !== undefined && m.hoursUntilExpiration <= 24 && !m.chatStarted) && (
        <View style={styles.warningCard}>
          <Ionicons name="time-outline" size={24} color={colors.warning} />
          <View style={styles.warningText}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Matches expiring soon!
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Start chatting to keep your matches active
            </AppText>
          </View>
        </View>
      )}
    </View>
  );

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
            Loading your matches...
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
          <AppText size="h4" weight="semibold" color={colors.textPrimary} style={styles.emptyTitle}>
            Something went wrong
          </AppText>
          <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
            {error}
          </AppText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadMatches()}
          >
            <AppText size="body" weight="semibold" color={colors.primary}>
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={80} color={colors.textMuted} />
        <AppText size="h3" weight="semibold" color={colors.textPrimary} style={styles.emptyTitle}>
          No matches yet
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
          Keep swiping to find people who share your interests!
        </AppText>
        <TouchableOpacity
          style={styles.discoverButton}
          onPress={() => navigation.navigate('HomeScreen')}
          accessibilityRole="button"
          accessibilityLabel="Go to discover screen"
        >
          <Ionicons name="search" size={20} color={colors.white} />
          <AppText size="body" weight="semibold" color={colors.white}>
            Discover People
          </AppText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradient}
      >
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          {/* Back Button */}
          <View style={styles.navHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.discoverHeaderButton}
              onPress={() => navigation.navigate('HomeScreen')}
              accessibilityRole="button"
              accessibilityLabel="Discover more people"
            >
              <Ionicons name="search" size={20} color={colors.primary} />
              <AppText size="small" weight="semibold" color={colors.primary}>
                Discover
              </AppText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={matches}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMatch}
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadMatches(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        </SafeAreaView>
      </LinearGradient>
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
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
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
  discoverHeaderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  subtitle: {
    lineHeight: 24,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.warningLight,
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  warningText: {
    flex: 1,
    gap: 2,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 52,
    justifyContent: 'center',
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 56,
  },
});
