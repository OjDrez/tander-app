import apiClient from './config';

/**
 * Two-Factor Method Type
 */
export type TwoFactorMethod = 'SMS' | 'EMAIL' | 'AUTHENTICATOR_APP';

/**
 * Notification Method Type
 */
export type NotificationMethod = 'EMAIL' | 'PUSH' | 'BOTH';

/**
 * Security Settings Response
 */
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: TwoFactorMethod | null;
  twoFactorPhone: string | null;
  loginNotificationsEnabled: boolean;
  loginNotificationMethod: NotificationMethod;
  newDeviceVerification: boolean;
  showActiveSessions: boolean;
  sessionTimeoutMinutes: number;
  idVerified: boolean;
  idVerificationStatus: string;
}

/**
 * Security Settings API
 * Handles security settings operations
 */
export const securitySettingsApi = {
  /**
   * Get security settings for the current user
   */
  getSettings: async (): Promise<SecuritySettings> => {
    try {
      console.log('🔵 [securitySettingsApi.getSettings] Fetching security settings...');

      const response = await apiClient.get<{
        success: boolean;
        settings: SecuritySettings;
      }>('/settings/security');

      console.log('✅ [securitySettingsApi.getSettings] Got settings');
      return response.data.settings;
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.getSettings] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch security settings');
    }
  },

  /**
   * Enable or disable two-factor authentication
   */
  setTwoFactor: async (
    enabled: boolean,
    method?: TwoFactorMethod,
    phone?: string
  ): Promise<SecuritySettings> => {
    try {
      console.log('🔵 [securitySettingsApi.setTwoFactor] Setting 2FA:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: SecuritySettings;
      }>('/settings/security/two-factor', { enabled, method, phone });

      console.log('✅ [securitySettingsApi.setTwoFactor] 2FA updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.setTwoFactor] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update 2FA settings');
    }
  },

  /**
   * Enable or disable login notifications
   */
  setLoginNotifications: async (
    enabled: boolean,
    method?: NotificationMethod
  ): Promise<SecuritySettings> => {
    try {
      console.log('🔵 [securitySettingsApi.setLoginNotifications] Setting notifications:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: SecuritySettings;
      }>('/settings/security/login-notifications', { enabled, method });

      console.log('✅ [securitySettingsApi.setLoginNotifications] Notifications updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.setLoginNotifications] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update login notifications');
    }
  },

  /**
   * Enable or disable new device verification
   */
  setNewDeviceVerification: async (enabled: boolean): Promise<SecuritySettings> => {
    try {
      console.log('🔵 [securitySettingsApi.setNewDeviceVerification] Setting:', enabled);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        settings: SecuritySettings;
      }>('/settings/security/new-device-verification', { enabled });

      console.log('✅ [securitySettingsApi.setNewDeviceVerification] Updated');
      return response.data.settings;
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.setNewDeviceVerification] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update device verification');
    }
  },

  /**
   * Setup authenticator app for 2FA
   */
  setupAuthenticator: async (): Promise<{ secret: string; otpAuthUrl: string }> => {
    try {
      console.log('🔵 [securitySettingsApi.setupAuthenticator] Setting up authenticator...');

      const response = await apiClient.post<{
        success: boolean;
        secret: string;
        otpAuthUrl: string;
        message: string;
      }>('/settings/security/authenticator/setup');

      console.log('✅ [securitySettingsApi.setupAuthenticator] Authenticator setup complete');
      return {
        secret: response.data.secret,
        otpAuthUrl: response.data.otpAuthUrl,
      };
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.setupAuthenticator] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to setup authenticator');
    }
  },

  /**
   * Verify authenticator code
   */
  verifyAuthenticatorCode: async (code: string): Promise<boolean> => {
    try {
      console.log('🔵 [securitySettingsApi.verifyAuthenticatorCode] Verifying code...');

      const response = await apiClient.post<{
        success: boolean;
        verified: boolean;
        message: string;
      }>('/settings/security/authenticator/verify', { code });

      console.log('✅ [securitySettingsApi.verifyAuthenticatorCode] Verification result:', response.data.verified);
      return response.data.verified;
    } catch (error: any) {
      console.error('❌ [securitySettingsApi.verifyAuthenticatorCode] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify code');
    }
  },
};

export default securitySettingsApi;
