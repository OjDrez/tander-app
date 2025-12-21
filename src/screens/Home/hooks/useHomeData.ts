import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { userApi, UserProfile } from '@/src/api/userApi';
import { discoveryApi } from '@/src/api/discoveryApi';
import { matchingApi } from '@/src/api/matchingApi';
import { dashboardApi, DashboardData } from '@/src/api/dashboardApi';
import { DiscoveryProfile, MatchStats } from '@/src/types/matching';

/**
 * Number of profile suggestions to fetch for the home screen
 */
const SUGGESTIONS_COUNT = 4;

/**
 * Cache duration in milliseconds (30 seconds)
 */
const CACHE_DURATION_MS = 30000;

/**
 * Whether to use the consolidated dashboard endpoint (recommended)
 * Set to true to use single API call, false to use individual calls
 */
const USE_CONSOLIDATED_ENDPOINT = true;

export interface HomeData {
  currentUser: UserProfile | null;
  suggestions: DiscoveryProfile[];
  stats: MatchStats | null;
}

export interface UseHomeDataReturn {
  data: HomeData;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: (showRefreshIndicator?: boolean) => Promise<void>;
}

/**
 * Convert dashboard profile to UserProfile format
 */
function convertDashboardProfileToUserProfile(
  dashboardProfile: DashboardData['profile']
): UserProfile {
  return {
    id: dashboardProfile.id,
    username: dashboardProfile.username,
    email: dashboardProfile.email,
    displayName: dashboardProfile.displayName,
    firstName: dashboardProfile.firstName,
    lastName: dashboardProfile.lastName,
    nickName: dashboardProfile.nickName,
    age: dashboardProfile.age,
    city: dashboardProfile.city,
    country: dashboardProfile.country,
    bio: dashboardProfile.bio,
    profilePhotoUrl: dashboardProfile.profilePhotoUrl,
    additionalPhotos: dashboardProfile.additionalPhotos,
    interests: dashboardProfile.interests,
    lookingFor: dashboardProfile.lookingFor,
    verified: dashboardProfile.verified,
    profileCompleted: dashboardProfile.profileCompleted,
  };
}

/**
 * Convert dashboard stats to MatchStats format
 */
function convertDashboardStatsToMatchStats(
  dashboardStats: DashboardData['stats']
): MatchStats {
  return {
    activeMatches: dashboardStats.activeMatches,
    dailySwipesUsed: dashboardStats.dailySwipesUsed,
    dailySwipesRemaining: dashboardStats.dailySwipesRemaining,
    dailySwipeLimit: dashboardStats.dailySwipeLimit,
  };
}

/**
 * Custom hook for managing HomeScreen data fetching with:
 * - Consolidated API endpoint (single request) or individual calls (fallback)
 * - Request cancellation on unmount/navigation
 * - Pull-to-refresh support
 * - Error handling with retry capability
 * - Basic caching to prevent redundant fetches
 */
export function useHomeData(): UseHomeDataReturn {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [suggestions, setSuggestions] = useState<DiscoveryProfile[]>([]);
  const [stats, setStats] = useState<MatchStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  // Track last fetch time for basic caching
  const lastFetchTimeRef = useRef<number>(0);
  // Track if a fetch is in progress to prevent duplicate requests
  const isFetchingRef = useRef(false);

  /**
   * Load data using the consolidated dashboard endpoint
   */
  const loadDataConsolidated = useCallback(async (showRefreshIndicator = false) => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      return;
    }

    // Skip if data was recently fetched (unless forcing refresh)
    const now = Date.now();
    if (
      !showRefreshIndicator &&
      currentUser !== null &&
      now - lastFetchTimeRef.current < CACHE_DURATION_MS
    ) {
      setIsLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (currentUser === null) {
        setIsLoading(true);
      }
      setError(null);

      // Single API call for all dashboard data
      const dashboardData = await dashboardApi.getDashboard(SUGGESTIONS_COUNT);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Convert and set all data
      setCurrentUser(convertDashboardProfileToUserProfile(dashboardData.profile));
      setSuggestions(dashboardData.suggestions);
      setStats(convertDashboardStatsToMatchStats(dashboardData.stats));

      lastFetchTimeRef.current = Date.now();
      console.log('HomeScreen data loaded successfully (consolidated endpoint)');
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }
      console.error('HomeScreen failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, [currentUser]);

  /**
   * Load data using individual API endpoints (fallback)
   */
  const loadDataIndividual = useCallback(async (showRefreshIndicator = false) => {
    // Prevent duplicate concurrent requests
    if (isFetchingRef.current) {
      return;
    }

    // Skip if data was recently fetched (unless forcing refresh)
    const now = Date.now();
    if (
      !showRefreshIndicator &&
      currentUser !== null &&
      now - lastFetchTimeRef.current < CACHE_DURATION_MS
    ) {
      setIsLoading(false);
      return;
    }

    try {
      isFetchingRef.current = true;

      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else if (currentUser === null) {
        setIsLoading(true);
      }
      setError(null);

      // Fetch all data in parallel with individual error handling
      const [userResult, suggestionsResult, statsResult] = await Promise.allSettled([
        userApi.getCurrentUser(),
        discoveryApi.getProfileBatch(SUGGESTIONS_COUNT),
        matchingApi.getStats(),
      ]);

      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        return;
      }

      // Process results individually to allow partial success
      if (userResult.status === 'fulfilled') {
        setCurrentUser(userResult.value);
      } else {
        console.error('Failed to fetch user profile:', userResult.reason);
        if (!currentUser) {
          setError('Failed to load your profile. Please try again.');
        }
      }

      if (suggestionsResult.status === 'fulfilled') {
        setSuggestions(suggestionsResult.value);
      } else {
        console.error('Failed to fetch suggestions:', suggestionsResult.reason);
        setSuggestions([]);
      }

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Failed to fetch stats:', statsResult.reason);
      }

      // Check if all requests failed
      if (
        userResult.status === 'rejected' &&
        suggestionsResult.status === 'rejected' &&
        statsResult.status === 'rejected'
      ) {
        const errorMessage =
          userResult.reason?.message || 'Failed to load data. Please check your connection.';
        setError(errorMessage);
      }

      lastFetchTimeRef.current = Date.now();
      console.log('HomeScreen data loaded successfully (individual endpoints)');
    } catch (err: any) {
      if (!isMountedRef.current) {
        return;
      }
      console.error('HomeScreen failed to load data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
      isFetchingRef.current = false;
    }
  }, [currentUser]);

  // Choose which loading strategy to use
  const loadData = USE_CONSOLIDATED_ENDPOINT ? loadDataConsolidated : loadDataIndividual;

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      loadData();

      // Cleanup function - mark as unmounted to prevent state updates
      return () => {
        isMountedRef.current = false;
      };
    }, [loadData])
  );

  return {
    data: {
      currentUser,
      suggestions,
      stats,
    },
    isLoading,
    isRefreshing,
    error,
    refresh: loadData,
  };
}

export default useHomeData;
