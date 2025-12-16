import apiClient from './config';
import {
  DiscoveryProfile,
  DiscoveryFilters,
  DiscoveryStats,
  LikesReceivedCount,
  PaginatedResponse,
} from '../types/matching';

/**
 * Discovery API
 * Handles fetching profiles for the swipe/discovery feature
 */
export const discoveryApi = {
  /**
   * Get profiles for swiping (paginated with filters)
   */
  getProfiles: async (
    page = 0,
    size = 10,
    filters?: DiscoveryFilters
  ): Promise<PaginatedResponse<DiscoveryProfile>> => {
    try {
      console.log('🔵 [discoveryApi.getProfiles] Fetching profiles, page:', page);

      const params: Record<string, any> = { page, size };

      if (filters) {
        if (filters.minAge) params.minAge = filters.minAge;
        if (filters.maxAge) params.maxAge = filters.maxAge;
        if (filters.city) params.city = filters.city;
        if (filters.country) params.country = filters.country;
        if (filters.interests) params.interests = filters.interests;
        if (filters.verifiedOnly !== undefined) params.verifiedOnly = filters.verifiedOnly;
      }

      const response = await apiClient.get<PaginatedResponse<DiscoveryProfile>>(
        '/api/discovery/profiles',
        { params }
      );

      console.log('✅ [discoveryApi.getProfiles] Found:', response.data.content?.length || 0, 'profiles');
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getProfiles] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch profiles');
    }
  },

  /**
   * Get a batch of profiles for swiping (simpler method)
   * Returns a shuffled list of profiles
   */
  getProfileBatch: async (count = 10): Promise<DiscoveryProfile[]> => {
    try {
      console.log('🔵 [discoveryApi.getProfileBatch] Fetching batch of', count, 'profiles');

      const response = await apiClient.get<DiscoveryProfile[]>('/api/discovery/batch', {
        params: { count },
      });

      console.log('✅ [discoveryApi.getProfileBatch] Got:', response.data.length, 'profiles');
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getProfileBatch] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile batch');
    }
  },

  /**
   * Get profiles of users who have liked (swiped RIGHT on) the current user
   * Premium feature - "See who likes you"
   */
  getProfilesWhoLikedMe: async (
    page = 0,
    size = 20
  ): Promise<PaginatedResponse<DiscoveryProfile>> => {
    try {
      console.log('🔵 [discoveryApi.getProfilesWhoLikedMe] Fetching likes, page:', page);

      const response = await apiClient.get<PaginatedResponse<DiscoveryProfile>>(
        '/api/discovery/likes-me',
        { params: { page, size } }
      );

      console.log('✅ [discoveryApi.getProfilesWhoLikedMe] Found:', response.data.content?.length || 0, 'profiles');
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getProfilesWhoLikedMe] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch profiles who liked you');
    }
  },

  /**
   * Get count of users who have liked the current user
   */
  getLikesReceivedCount: async (): Promise<LikesReceivedCount> => {
    try {
      console.log('🔵 [discoveryApi.getLikesReceivedCount] Fetching likes count');

      const response = await apiClient.get<LikesReceivedCount>('/api/discovery/likes-me/count');

      console.log('✅ [discoveryApi.getLikesReceivedCount] Count:', response.data.count);
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getLikesReceivedCount] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch likes count');
    }
  },

  /**
   * Get a specific profile by user ID
   */
  getProfile: async (userId: number): Promise<DiscoveryProfile> => {
    try {
      console.log('🔵 [discoveryApi.getProfile] Fetching profile:', userId);

      const response = await apiClient.get<DiscoveryProfile>(`/api/discovery/profile/${userId}`);

      console.log('✅ [discoveryApi.getProfile] Found profile:', response.data.displayName);
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getProfile] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch profile');
    }
  },

  /**
   * Get discovery statistics
   */
  getStats: async (): Promise<DiscoveryStats> => {
    try {
      console.log('🔵 [discoveryApi.getStats] Fetching discovery stats');

      const response = await apiClient.get<DiscoveryStats>('/api/discovery/stats');

      console.log('✅ [discoveryApi.getStats] Stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [discoveryApi.getStats] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },
};

export default discoveryApi;
