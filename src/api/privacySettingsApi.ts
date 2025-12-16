import apiClient from './config';

/**
 * Privacy Settings Response
 */
export interface PrivacySettingsResponse {
  profileVisible: boolean;
  locationEnabled: boolean;
  showApproximateDistance: boolean;
  showOnlineStatus: boolean;
  showReadReceipts: boolean;
  showInSearch: boolean;
  allowDirectMessages: boolean;
}

/**
 * Update Privacy Settings Request
 */
export interface UpdatePrivacySettingsRequest {
  profileVisible?: boolean;
  locationEnabled?: boolean;
  showApproximateDistance?: boolean;
  showOnlineStatus?: boolean;
  showReadReceipts?: boolean;
  showInSearch?: boolean;
  allowDirectMessages?: boolean;
}

/**
 * Privacy Settings API
 * Handles privacy settings operations
 */
export const privacySettingsApi = {
  /**
   * Get privacy settings for the current user
   */
  getPrivacySettings: async (): Promise<PrivacySettingsResponse> => {
    try {
      console.log('[privacySettingsApi.getPrivacySettings] Fetching privacy settings...');

      const response = await apiClient.get<{
        success: boolean;
        settings: PrivacySettingsResponse;
      }>('/settings/privacy');

      console.log('[privacySettingsApi.getPrivacySettings] Got settings');
      return response.data.settings;
    } catch (error: any) {
      console.error('[privacySettingsApi.getPrivacySettings] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch privacy settings');
    }
  },

  /**
   * Update all privacy settings at once
   */
  updatePrivacySettings: async (data: UpdatePrivacySettingsRequest): Promise<PrivacySettingsResponse> => {
    try {
      console.log('[privacySettingsApi.updatePrivacySettings] Updating privacy settings...');

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: PrivacySettingsResponse;
      }>('/settings/privacy', data);

      console.log('[privacySettingsApi.updatePrivacySettings] Settings updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('[privacySettingsApi.updatePrivacySettings] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update privacy settings');
    }
  },

  /**
   * Update profile visibility
   */
  setProfileVisible: async (enabled: boolean): Promise<PrivacySettingsResponse> => {
    try {
      console.log('[privacySettingsApi.setProfileVisible] Setting profile visible:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: PrivacySettingsResponse;
      }>('/settings/privacy/profile-visible', { enabled });

      console.log('[privacySettingsApi.setProfileVisible] Updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('[privacySettingsApi.setProfileVisible] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update profile visibility');
    }
  },

  /**
   * Update location enabled
   */
  setLocationEnabled: async (enabled: boolean): Promise<PrivacySettingsResponse> => {
    try {
      console.log('[privacySettingsApi.setLocationEnabled] Setting location:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: PrivacySettingsResponse;
      }>('/settings/privacy/location', { enabled });

      console.log('[privacySettingsApi.setLocationEnabled] Updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('[privacySettingsApi.setLocationEnabled] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update location setting');
    }
  },

  /**
   * Update show approximate distance
   */
  setShowApproximateDistance: async (enabled: boolean): Promise<PrivacySettingsResponse> => {
    try {
      console.log('[privacySettingsApi.setShowApproximateDistance] Setting:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: PrivacySettingsResponse;
      }>('/settings/privacy/approximate-distance', { enabled });

      console.log('[privacySettingsApi.setShowApproximateDistance] Updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('[privacySettingsApi.setShowApproximateDistance] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update distance setting');
    }
  },
};

export default privacySettingsApi;
