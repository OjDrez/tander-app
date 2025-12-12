import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientButton from '@/src/components/buttons/GradientButton';
import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { userApi, UserProfile } from '@/src/api/userApi';
import { discoveryApi } from '@/src/api/discoveryApi';
import { matchingApi } from '@/src/api/matchingApi';
import { photoApi } from '@/src/api/photoApi';
import { DiscoveryProfile, MatchStats } from '@/src/types/matching';

/**
 * HomeScreen
 *
 * The main home/dashboard screen for the dating app.
 * Optimized for seniors (60+) with:
 * - Large, clear UI elements
 * - Easy navigation to key features
 * - Clear call-to-action buttons
 */
export default function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  // State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<DiscoveryProfile[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all data in parallel
      const [userProfile, profileBatch, matchStats] = await Promise.all([
        userApi.getCurrentUser(),
        discoveryApi.getProfileBatch(4), // Get 4 suggestions for horizontal scroll
        matchingApi.getStats(),
      ]);

      setCurrentUser(userProfile);
      setSuggestions(profileBatch);
      setStats(matchStats);

      console.log('✅ HomeScreen loaded data successfully');
    } catch (err: any) {
      console.error('❌ HomeScreen failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Get display values
  const displayName = currentUser?.displayName || currentUser?.username || 'User';
  const firstName = displayName.split(' ')[0];
  const location = currentUser ? userApi.getLocationDisplay(currentUser) : 'Location not set';
  const profilePhotoUrl = photoApi.getPhotoUrl(currentUser?.profilePhotoUrl);
  const hasProfilePhoto = !!profilePhotoUrl;
  const bio = currentUser?.bio || 'Tell others about yourself by completing your profile.';

  // Loading state
  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.container}>
        <LinearGradient colors={colors.gradients.softAqua.array} style={styles.gradient}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary} style={styles.loadingText}>
              Loading your dashboard...
            </AppText>
          </View>
        </LinearGradient>
      </FullScreen>
    );
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
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Image
                  source={require('../../assets/icons/tander-logo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <AppText weight="semibold" size="body">
                TANDER
              </AppText>
            </View>

            <View style={styles.headerButtons}>
              {/* Matches Button */}
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('MyMatchesScreen')}
                accessibilityRole="button"
                accessibilityLabel={`View matches. You have ${stats?.activeMatches || 0} matches`}
              >
                <Ionicons name="heart" size={18} color={colors.primary} />
                {stats && stats.activeMatches > 0 && (
                  <View style={styles.badge}>
                    <AppText size="small" weight="bold" color={colors.white}>
                      {stats.activeMatches}
                    </AppText>
                  </View>
                )}
              </TouchableOpacity>

              {/* Messages Button */}
              <TouchableOpacity
                style={styles.iconButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('InboxScreen')}
                accessibilityRole="button"
                accessibilityLabel="View messages"
              >
                <Ionicons name="chatbubbles-outline" size={18} color={colors.accentBlue} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Platform.OS === 'android' ? insets.bottom + 10 : 0 },
            ]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => loadData(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {/* Error State */}
            {error && (
              <View style={styles.errorCard}>
                <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
                <AppText size="body" color={colors.textSecondary}>
                  {error}
                </AppText>
                <TouchableOpacity onPress={() => loadData()}>
                  <AppText size="body" weight="semibold" color={colors.primary}>
                    Retry
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

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
            <LinearGradient
              colors={colors.gradients.registration.array}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroContent}>
                <AppText weight="semibold" size="h4" style={styles.heroTitle}>
                  Ready to meet someone special?
                </AppText>
                <AppText color={colors.textSecondary} style={styles.heroSubtitle}>
                  {stats && stats.dailySwipesRemaining > 0
                    ? `You have ${stats.dailySwipesRemaining} swipes left today!`
                    : 'We found people who share your interests and values.'}
                </AppText>
              </View>

              <GradientButton
                title="Start Discovering"
                onPress={() => navigation.navigate('DiscoveryScreen')}
                style={styles.primaryButton}
                textStyle={styles.primaryButtonText}
              />
            </LinearGradient>

            {/* PROFILE CARD */}
            <View style={styles.card}>
              <View style={styles.profileRow}>
                {hasProfilePhoto ? (
                  <Image source={{ uri: profilePhotoUrl! }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Ionicons name="person" size={36} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.profileTextGroup}>
                  <View style={styles.nameRow}>
                    <AppText weight="semibold" size="h4" style={styles.name}>
                      {displayName}
                      {currentUser?.age ? `, ${currentUser.age}` : ''}
                    </AppText>
                    {currentUser?.verified && (
                      <MaterialCommunityIcons
                        name="shield-check"
                        size={18}
                        color={colors.accentTeal}
                        style={styles.verifiedIcon}
                      />
                    )}
                  </View>

                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <AppText size="caption" color={colors.textSecondary}>
                      {location}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={styles.aboutBox}>
                <AppText size="small" color={colors.textSecondary} weight="semibold">
                  About Me
                </AppText>
                <AppText style={styles.aboutText} numberOfLines={3}>
                  {bio}
                </AppText>
              </View>
            </View>

            {/* COMPLETE PROFILE CARD - Show only if profile incomplete */}
            {currentUser && !currentUser.profileCompleted && (
              <View style={styles.card}>
                <View style={styles.badgeRow}>
                  <View style={styles.badge2}>
                    <AppText size="small" color={colors.textSecondary} weight="semibold">
                      New to our community
                    </AppText>
                  </View>
                </View>

                <AppText weight="semibold" size="h4" style={styles.cardTitle}>
                  Complete your Profile
                </AppText>
                <AppText color={colors.textSecondary} style={styles.cardSubtitle}>
                  Add your photos and details to get better matches.
                </AppText>

                <GradientButton
                  title="Complete Profile"
                  onPress={() =>
                    navigation.navigate('ProfileViewScreen', {
                      userId: currentUser.id.toString(),
                    })
                  }
                  style={styles.secondaryButton}
                />
              </View>
            )}

            {/* STATS CARD */}
            {stats && (
              <View style={styles.statsCard}>
                <AppText weight="semibold" size="h4" style={styles.cardTitle}>
                  Your Activity
                </AppText>
                <View style={styles.statsRow}>
                  <TouchableOpacity
                    style={styles.statItem}
                    onPress={() => navigation.navigate('MyMatchesScreen')}
                    accessibilityRole="button"
                    accessibilityLabel={`${stats.activeMatches} active matches`}
                  >
                    <AppText size="h2" weight="bold" color={colors.primary}>
                      {stats.activeMatches}
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Matches
                    </AppText>
                  </TouchableOpacity>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <AppText size="h2" weight="bold" color={colors.accentTeal}>
                      {stats.dailySwipesUsed}
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Views Today
                    </AppText>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <AppText size="h2" weight="bold" color={colors.accentBlue}>
                      {stats.dailySwipesRemaining}
                    </AppText>
                    <AppText size="small" color={colors.textSecondary}>
                      Swipes Left
                    </AppText>
                  </View>
                </View>
              </View>
            )}

            {/* SECTION HEADER */}
            <View style={styles.sectionHeader}>
              <View>
                <AppText weight="semibold" size="h4" style={styles.sectionTitle}>
                  People You May Know!
                </AppText>
                <AppText size="caption" color={colors.textSecondary}>
                  Fresh picks curated for you
                </AppText>
              </View>

              <TouchableOpacity
                style={styles.filterPill}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Filter profiles"
              >
                <Ionicons name="options-outline" size={16} color={colors.accentBlue} />
                <AppText weight="semibold" color={colors.accentBlue} size="caption">
                  Filters
                </AppText>
              </TouchableOpacity>
            </View>

            {/* SUGGESTIONS */}
            {suggestions.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestionsRow}
              >
                {suggestions.map((person) => (
                  <TouchableOpacity
                    key={person.userId}
                    style={styles.suggestionCard}
                    onPress={() =>
                      navigation.navigate('ViewProfileScreen', {
                        userId: person.userId.toString(),
                      })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`View ${person.displayName}'s profile`}
                  >
                    {photoApi.getPhotoUrl(person.profilePhotoUrl) ? (
                      <Image
                        source={{ uri: photoApi.getPhotoUrl(person.profilePhotoUrl)! }}
                        style={styles.suggestionAvatar}
                      />
                    ) : (
                      <View style={[styles.suggestionAvatar, styles.suggestionAvatarPlaceholder]}>
                        <Ionicons name="person" size={32} color={colors.textMuted} />
                      </View>
                    )}
                    <AppText weight="semibold" style={styles.suggestionName} numberOfLines={1}>
                      {person.displayName}
                    </AppText>
                    <AppText
                      size="caption"
                      color={colors.textSecondary}
                      style={styles.suggestionMeta}
                    >
                      {person.age ? `${person.age}, ` : ''}
                      {person.location || 'Nearby'}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noSuggestionsCard}>
                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                <AppText size="body" color={colors.textSecondary} style={styles.noSuggestionsText}>
                  No suggestions available right now. Check back later!
                </AppText>
              </View>
            )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    gap: 20,
  },
  headerRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowMedium,
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {},
    }),
  },
  logoImage: {
    height: 36,
    width: 36,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dangerLight,
    padding: 16,
    borderRadius: 16,
  },
  greetingBlock: {
    gap: 6,
  },
  greetingTitle: {
    color: colors.textPrimary,
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
  },
  heroContent: {
    gap: 8,
    marginBottom: 12,
  },
  heroTitle: {
    color: colors.textPrimary,
  },
  heroSubtitle: {
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileTextGroup: {
    flex: 1,
    gap: 6,
  },
  avatar: {
    height: 78,
    width: 78,
    borderRadius: 20,
    backgroundColor: colors.borderMedium,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.textPrimary,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutBox: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  aboutText: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge2: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardSubtitle: {
    lineHeight: 20,
  },
  secondaryButton: {
    width: '100%',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  suggestionsRow: {
    gap: 14,
    paddingRight: 8,
  },
  suggestionCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
  },
  suggestionAvatar: {
    height: 84,
    width: 84,
    borderRadius: 14,
    backgroundColor: colors.borderMedium,
  },
  suggestionAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  suggestionName: {
    textAlign: 'center',
    color: colors.textPrimary,
  },
  suggestionMeta: {
    textAlign: 'center',
  },
  noSuggestionsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  noSuggestionsText: {
    textAlign: 'center',
  },
});
