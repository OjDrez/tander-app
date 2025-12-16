import apiClient from './config';

/**
 * ============================================================================
 * BACKEND ENDPOINTS IMPLEMENTED
 * ============================================================================
 *
 * Backend endpoints for block/report functionality:
 * - POST /user/block      - Block a user by userId
 * - POST /user/unblock    - Unblock a user by userId
 * - POST /user/report     - Report a user with reason and details
 * - GET  /user/blocked    - Get list of blocked users for current user
 *
 * NOTE: Run migration_add_block_report.sql to create the required tables.
 * ============================================================================
 */

// Set to false to use real backend API (endpoints now implemented)
// Set to true for development/testing without backend
const USE_MOCK_API = false;

/**
 * Report Reason Options
 */
export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'fake_profile'
  | 'scam'
  | 'underage'
  | 'other';

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'inappropriate_content', label: 'Inappropriate Content' },
  { value: 'harassment', label: 'Harassment or Bullying' },
  { value: 'fake_profile', label: 'Fake Profile' },
  { value: 'scam', label: 'Scam or Fraud' },
  { value: 'underage', label: 'Appears Underage' },
  { value: 'other', label: 'Other' },
];

/**
 * Block/Report API Response
 */
export interface BlockReportResponse {
  success: boolean;
  message: string;
}

/**
 * Blocked User Info
 */
export interface BlockedUser {
  id: number;
  name: string;
  photoUrl: string | null;
  blockedAt: string;
}

/**
 * Block & Report API
 * Handles blocking and reporting users for safety
 */
export const blockReportApi = {
  /**
   * Block a user
   * @param userId - ID of user to block
   */
  blockUser: async (userId: number): Promise<BlockReportResponse> => {
    try {
      console.log('[blockReportApi.blockUser] Blocking user:', userId);

      if (USE_MOCK_API) {
        // MOCK: Remove when backend is ready
        console.warn('[blockReportApi.blockUser] Using MOCK - Backend endpoint required: POST /user/block');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          message: 'User has been blocked',
        };
      }

      // Real API call - uncomment when backend is ready
      const response = await apiClient.post('/user/block', { userId });
      return response.data;
    } catch (error: any) {
      console.error('[blockReportApi.blockUser] Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to block user');
    }
  },

  /**
   * Unblock a user
   * @param userId - ID of user to unblock
   */
  unblockUser: async (userId: number): Promise<BlockReportResponse> => {
    try {
      console.log('[blockReportApi.unblockUser] Unblocking user:', userId);

      if (USE_MOCK_API) {
        // MOCK: Remove when backend is ready
        console.warn('[blockReportApi.unblockUser] Using MOCK - Backend endpoint required: POST /user/unblock');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          message: 'User has been unblocked',
        };
      }

      // Real API call - uncomment when backend is ready
      const response = await apiClient.post('/user/unblock', { userId });
      return response.data;
    } catch (error: any) {
      console.error('[blockReportApi.unblockUser] Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to unblock user');
    }
  },

  /**
   * Report a user
   * @param userId - ID of user to report
   * @param reason - Reason for the report
   * @param details - Additional details (optional)
   */
  reportUser: async (
    userId: number,
    reason: ReportReason,
    details?: string
  ): Promise<BlockReportResponse> => {
    try {
      console.log('[blockReportApi.reportUser] Reporting user:', userId, reason);

      if (USE_MOCK_API) {
        // MOCK: Remove when backend is ready
        console.warn('[blockReportApi.reportUser] Using MOCK - Backend endpoint required: POST /user/report');
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          message: 'Report submitted successfully. Our team will review it.',
        };
      }

      // Real API call - uncomment when backend is ready
      const response = await apiClient.post('/user/report', {
        userId,
        reason,
        details,
      });
      return response.data;
    } catch (error: any) {
      console.error('[blockReportApi.reportUser] Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to submit report');
    }
  },

  /**
   * Get list of blocked users
   */
  getBlockedUsers: async (): Promise<BlockedUser[]> => {
    try {
      console.log('[blockReportApi.getBlockedUsers] Fetching blocked users');

      if (USE_MOCK_API) {
        // MOCK: Remove when backend is ready
        console.warn('[blockReportApi.getBlockedUsers] Using MOCK - Backend endpoint required: GET /user/blocked');
        await new Promise((resolve) => setTimeout(resolve, 500));
        // Return empty array in mock mode to avoid confusion with fake data
        return [];
      }

      // Real API call - uncomment when backend is ready
      const response = await apiClient.get('/user/blocked');
      return response.data;
    } catch (error: any) {
      console.error('[blockReportApi.getBlockedUsers] Error:', error);
      throw new Error(error.response?.data?.message || 'Failed to get blocked users');
    }
  },
};

export default blockReportApi;
