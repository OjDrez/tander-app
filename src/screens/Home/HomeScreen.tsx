import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import colors from '@/src/config/colors';
import { useToast } from '@/src/context/ToastContext';

// Local components
import {
  HomeHeader,
  HeroCard,
  ProfileCard,
  StatsCard,
  SuggestionsCarousel,
  CompleteProfileCard,
  ErrorCard,
  LoadingScreen,
} from './components';

// Custom hook for data fetching
import { useHomeData } from './hooks/useHomeData';

/**
 * HomeScreen
 *
 * The main home/dashboard screen for the dating app.
 * Optimized for seniors (60+) with:
 * - Large, clear UI elements
 * - Easy navigation to key features
 * - Clear call-to-action buttons
 *
 * Architecture:
 * - Data fetching extracted to useHomeData hook
 * - UI split into focused sub-components
 * - Proper request cancellation on unmount
 * - Memoized derived values
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { info } = useToast();

  // Fetch all home screen data using custom hook
  const { data, isLoading, isRefreshing, error, refresh } = useHomeData();
  const { currentUser, suggestions, stats } = data;

  // Memoize the first name extraction
  const firstName = useMemo(() => {
    const displayName = currentUser?.displayName || currentUser?.username || 'User';
    return displayName.split(' ')[0];
  }, [currentUser?.displayName, currentUser?.username]);

  // Handle filter button press - Fixed: Added missing onPress handler
  const handleFilterPress = useCallback(() => {
    // TODO: Navigate to filter screen or show filter modal
    info('Profile filters will be available in an upcoming update!');
  }, [info]);

  // Show loading screen during initial load
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <FullScreen
      statusBarStyle="dark"
      style={[styles.container, { paddingBottom: insets.bottom || 12 }]}
    >
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
          {/* HEADER - Fixed: Badge now shows "99+" for large counts */}
          <HomeHeader activeMatchesCount={stats?.activeMatches || 0} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : 0 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => refresh(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Error State - Fixed: Better error handling with partial success */}
            {error && <ErrorCard message={error} onRetry={() => refresh()} />}

            {/* GREETING */}
            <View style={styles.greetingBlock}>
              <AppText weight="semibold" size="h3" style={styles.greetingTitle}>
                Hello, {firstName}!
              </AppText>
              <AppText color={colors.textSecondary}>
                Here are new people to discover and ways to keep your profile fresh.
              </AppText>
            </View>

            {/* HERO CARD - Start Discovery */}
            <HeroCard stats={stats} />

            {/* PROFILE CARD - Fixed: Safe null handling for photo URL */}
            <ProfileCard currentUser={currentUser} />

            {/* COMPLETE PROFILE CARD - Show only if profile incomplete */}
            {currentUser && !currentUser.profileCompleted && (
              <CompleteProfileCard userId={currentUser.id} />
            )}

            {/* STATS CARD */}
            {stats && <StatsCard stats={stats} />}

            {/* SUGGESTIONS SECTION - Fixed: Filter button now has onPress handler */}
            <SuggestionsCarousel
              suggestions={suggestions}
              onFilterPress={handleFilterPress}
            />
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 20,
  },
  greetingBlock: {
    gap: 6,
  },
  greetingTitle: {
    color: colors.textPrimary,
  },
});
