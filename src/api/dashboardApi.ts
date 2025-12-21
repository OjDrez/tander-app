import api from './config';
import { DiscoveryProfile } from '@/src/types/matching';

/**
 * User profile information for the dashboard
 */
export interface DashboardUserProfile {
  id: number;
  username: string;
  email: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  nickName: string | null;
  age: number | null;
  city: string | null;
  country: string | null;
  location: string | null;
  bio: string | null;
  profilePhotoUrl: string | null;
  additionalPhotos: string[];
  interests: string[];
  lookingFor: string[];
  verified: boolean;
  profileCompleted: boolean;
}

/**
 * Match and swipe statistics
 */
export interface DashboardStats {
  activeMatches: number;
  dailySwipesUsed: number;
  dailySwipesRemaining: number;
  dailySwipeLimit: number;
  availableProfiles: number;
  likesReceived: number;
}

/**
 * Complete dashboard data returned by the consolidated endpoint
 */
export interface DashboardData {
  profile: DashboardUserProfile;
  suggestions: DiscoveryProfile[];
  stats: DashboardStats;
}

/**
 * Dashboard API
 *
 * Provides a single consolidated endpoint for the home screen
 * to reduce the number of API calls and improve performance.
 */
export const dashboardApi = {
  /**
   * Get all dashboard data in a single request.
   * This consolidates:
   * - User profile
   * - Profile suggestions
   * - Match statistics
   *
   * @param suggestionsCount Number of suggestions to fetch (default 4, max 10)
   * @returns Promise<DashboardData>
   */
  async getDashboard(suggestionsCount: number = 4): Promise<DashboardData> {
    const response = await api.get<DashboardData>('/api/home/dashboard', {
      params: {
        suggestionsCount: Math.min(Math.max(suggestionsCount, 1), 10),
      },
    });
    return response.data;
  },
};

export default dashboardApi;
