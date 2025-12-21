import apiClient from './config';
import {
  SwipeRequest,
  SwipeResponse,
  Match,
  MatchStats,
  MatchCheckResponse,
  PaginatedResponse,
  CategorizedMatches,
} from '../types/matching';

/**
 * Matching API
 * Handles swipes, matches, and match management
 */
export const matchingApi = {
  /**
   * Record a swipe action (LEFT = pass, RIGHT = like)
   * If both users have swiped RIGHT, returns match info
   */
  swipe: async (request: SwipeRequest): Promise<SwipeResponse> => {
    try {
      console.log('=5 [matchingApi.swipe] Swiping:', request);
      const response = await apiClient.post<SwipeResponse>('/api/matches/swipe', request);
      console.log(' [matchingApi.swipe] Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.swipe] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Swipe failed');
    }
  },

  /**
   * Swipe RIGHT (like) on a user - convenience method
   */
  like: async (targetUserId: number): Promise<SwipeResponse> => {
    return matchingApi.swipe({ targetUserId, direction: 'RIGHT' });
  },

  /**
   * Swipe LEFT (pass) on a user - convenience method
   */
  pass: async (targetUserId: number): Promise<SwipeResponse> => {
    return matchingApi.swipe({ targetUserId, direction: 'LEFT' });
  },

  /**
   * Get all active matches (paginated)
   */
  getMatches: async (page = 0, size = 20): Promise<PaginatedResponse<Match>> => {
    try {
      console.log('=5 [matchingApi.getMatches] Fetching matches, page:', page);
      const response = await apiClient.get<PaginatedResponse<Match>>('/api/matches', {
        params: { page, size },
      });
      console.log(' [matchingApi.getMatches] Found:', response.data.content?.length || 0, 'matches');
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.getMatches] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  },

  /**
   * Get all active matches as a simple list
   */
  getMatchesList: async (): Promise<Match[]> => {
    try {
      console.log('=5 [matchingApi.getMatchesList] Fetching all matches');
      const response = await apiClient.get<Match[]>('/api/matches/list');
      console.log(' [matchingApi.getMatchesList] Found:', response.data.length, 'matches');
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.getMatchesList] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch matches');
    }
  },

  /**
   * Get a specific match by ID
   */
  getMatch: async (matchId: number): Promise<Match> => {
    try {
      console.log('=5 [matchingApi.getMatch] Fetching match:', matchId);
      const response = await apiClient.get<Match>(`/api/matches/${matchId}`);
      console.log(' [matchingApi.getMatch] Found match');
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.getMatch] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch match');
    }
  },

  /**
   * Unmatch from a user
   */
  unmatch: async (matchId: number): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('=5 [matchingApi.unmatch] Unmatching from match:', matchId);
      const response = await apiClient.delete<{ success: boolean; message: string }>(
        `/api/matches/${matchId}`
      );
      console.log(' [matchingApi.unmatch] Success');
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.unmatch] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to unmatch');
    }
  },

  /**
   * Check if current user is matched with another user
   */
  checkMatch: async (userId: number): Promise<MatchCheckResponse> => {
    try {
      console.log('=5 [matchingApi.checkMatch] Checking match with user:', userId);
      const response = await apiClient.get<MatchCheckResponse>(`/api/matches/check/${userId}`);
      console.log(' [matchingApi.checkMatch] Is matched:', response.data.isMatched);
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.checkMatch] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to check match');
    }
  },

  /**
   * Get match statistics (count, swipes remaining, etc.)
   */
  getStats: async (): Promise<MatchStats> => {
    try {
      console.log('=5 [matchingApi.getStats] Fetching match stats');
      const response = await apiClient.get<MatchStats>('/api/matches/stats');
      console.log(' [matchingApi.getStats] Stats:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.getStats] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch stats');
    }
  },

  /**
   * Get IDs of all matched users
   */
  getMatchedUserIds: async (): Promise<number[]> => {
    try {
      console.log('=5 [matchingApi.getMatchedUserIds] Fetching matched user IDs');
      const response = await apiClient.get<number[]>('/api/matches/user-ids');
      console.log(' [matchingApi.getMatchedUserIds] Found:', response.data.length, 'matched users');
      return response.data;
    } catch (error: any) {
      console.error('L [matchingApi.getMatchedUserIds] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch matched user IDs');
    }
  },
  // ==================== BUMBLE-STYLE CATEGORIZED MATCHES ====================

  /**
   * Get all matches categorized by status (Bumble-style)
   * Returns matches in 4 categories:
   * - chatStarted: Both users have messaged (shows in INBOX)
   * - waitingForUserReply: Other user sent first, waiting for user's reply
   * - waitingForOtherReply: User sent first, waiting for other's reply
   * - newMatches: No messages sent yet
   */
  getCategorizedMatches: async (): Promise<CategorizedMatches> => {
    try {
      console.log('[matchingApi.getCategorizedMatches] Fetching categorized matches');
      const response = await apiClient.get<CategorizedMatches>('/api/matches/categorized');
      console.log('[matchingApi.getCategorizedMatches] Categories:',
        'chatStarted:', response.data.chatStarted?.length || 0,
        'waitingForUserReply:', response.data.waitingForUserReply?.length || 0,
        'waitingForOtherReply:', response.data.waitingForOtherReply?.length || 0,
        'newMatches:', response.data.newMatches?.length || 0
      );
      return response.data;
    } catch (error: any) {
      console.error('[matchingApi.getCategorizedMatches] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch categorized matches');
    }
  },

  /**
   * Get matches where chat has fully started (INBOX)
   * Both users have exchanged messages - these never expire
   */
  getInboxMatches: async (): Promise<Match[]> => {
    try {
      console.log('[matchingApi.getInboxMatches] Fetching inbox matches');
      const response = await apiClient.get<Match[]>('/api/matches/inbox');
      console.log('[matchingApi.getInboxMatches] Found:', response.data.length, 'conversations');
      return response.data;
    } catch (error: any) {
      console.error('[matchingApi.getInboxMatches] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch inbox matches');
    }
  },

  /**
   * Get matches waiting for current user to reply
   * Other user sent first message, user needs to respond
   */
  getMatchesWaitingForMe: async (): Promise<Match[]> => {
    try {
      console.log('[matchingApi.getMatchesWaitingForMe] Fetching matches waiting for my reply');
      const response = await apiClient.get<Match[]>('/api/matches/waiting-for-me');
      console.log('[matchingApi.getMatchesWaitingForMe] Found:', response.data.length, 'waiting');
      return response.data;
    } catch (error: any) {
      console.error('[matchingApi.getMatchesWaitingForMe] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch matches waiting for reply');
    }
  },

  /**
   * Get matches where user is waiting for other's reply
   * User sent first message, waiting for other to respond
   */
  getMatchesWaitingForThem: async (): Promise<Match[]> => {
    try {
      console.log('[matchingApi.getMatchesWaitingForThem] Fetching matches waiting for their reply');
      const response = await apiClient.get<Match[]>('/api/matches/waiting-for-them');
      console.log('[matchingApi.getMatchesWaitingForThem] Found:', response.data.length, 'waiting');
      return response.data;
    } catch (error: any) {
      console.error('[matchingApi.getMatchesWaitingForThem] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch matches waiting for reply');
    }
  },

  /**
   * Get completely new matches with no messages yet
   */
  getNewMatches: async (): Promise<Match[]> => {
    try {
      console.log('[matchingApi.getNewMatches] Fetching new matches');
      const response = await apiClient.get<Match[]>('/api/matches/new');
      console.log('[matchingApi.getNewMatches] Found:', response.data.length, 'new matches');
      return response.data;
    } catch (error: any) {
      console.error('[matchingApi.getNewMatches] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch new matches');
    }
  },
};

export default matchingApi;
