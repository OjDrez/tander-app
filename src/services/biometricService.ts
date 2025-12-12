import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

// Secure storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const STORED_USERNAME_KEY = 'biometric_username';
const STORED_PASSWORD_KEY = 'biometric_password';

// Dynamically import SecureStore to handle Expo Go gracefully
let SecureStore: typeof import('expo-secure-store') | null = null;
let secureStoreAvailable = false;

// Try to load SecureStore - will fail in Expo Go
try {
  SecureStore = require('expo-secure-store');
  secureStoreAvailable = true;
} catch (error) {
  console.log('[BiometricService] expo-secure-store not available (Expo Go mode)');
  secureStoreAvailable = false;
}

export type BiometricType = 'face' | 'finger' | null;

/**
 * Biometric Authentication Service
 * Handles Face ID, Touch ID, and fingerprint authentication
 * with secure credential storage for auto-login
 */
export const biometricService = {
  /**
   * Check if biometrics are available on the device
   */
  async isAvailable(): Promise<boolean> {
    try {
      // SecureStore must be available for biometric login to work
      if (!secureStoreAvailable || !SecureStore) {
        console.log('[BiometricService] SecureStore not available - biometrics disabled');
        return false;
      }
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('[BiometricService] Error checking availability:', error);
      return false;
    }
  },

  /**
   * Get the type of biometric authentication available
   */
  async getBiometricType(): Promise<BiometricType> {
    try {
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();

      const hasFace = supported.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
      );
      const hasFinger = supported.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT
      );

      // Platform-specific logic for best biometric method
      if (Platform.OS === 'ios') {
        if (hasFace) return 'face';
        if (hasFinger) return 'finger';
      } else {
        // Android: prefer fingerprint, face only if fingerprint not available
        if (hasFinger) return 'finger';
        if (hasFace && !hasFinger) return 'face';
      }

      return null;
    } catch (error) {
      console.error('[BiometricService] Error getting biometric type:', error);
      return null;
    }
  },

  /**
   * Get human-readable label for the biometric type
   */
  getBiometricLabel(type: BiometricType): string {
    if (!type) return 'Biometric Login';

    const labels = {
      face: Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock',
      finger: Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint',
    };

    return labels[type];
  },

  /**
   * Authenticate using biometrics
   */
  async authenticate(promptMessage?: string): Promise<boolean> {
    try {
      const biometricType = await this.getBiometricType();
      const defaultPrompt = `Sign in with ${this.getBiometricLabel(biometricType)}`;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || defaultPrompt,
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      return result.success;
    } catch (error) {
      console.error('[BiometricService] Authentication error:', error);
      return false;
    }
  },

  /**
   * Save credentials securely for biometric login
   */
  async saveCredentials(username: string, password: string): Promise<boolean> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        console.log('[BiometricService] SecureStore not available - cannot save credentials');
        return false;
      }
      await SecureStore.setItemAsync(STORED_USERNAME_KEY, username);
      await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      console.log('[BiometricService] Credentials saved successfully');
      return true;
    } catch (error) {
      console.error('[BiometricService] Error saving credentials:', error);
      return false;
    }
  },

  /**
   * Get stored credentials (after biometric authentication)
   */
  async getCredentials(): Promise<{ username: string; password: string } | null> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        return null;
      }
      const username = await SecureStore.getItemAsync(STORED_USERNAME_KEY);
      const password = await SecureStore.getItemAsync(STORED_PASSWORD_KEY);

      if (username && password) {
        return { username, password };
      }
      return null;
    } catch (error) {
      console.error('[BiometricService] Error getting credentials:', error);
      return null;
    }
  },

  /**
   * Check if biometric login is enabled (credentials are stored)
   */
  async isBiometricLoginEnabled(): Promise<boolean> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        return false;
      }
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('[BiometricService] Error checking biometric status:', error);
      return false;
    }
  },

  /**
   * Check if credentials are stored for biometric login
   */
  async hasStoredCredentials(): Promise<boolean> {
    try {
      const credentials = await this.getCredentials();
      return credentials !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Clear stored credentials (on logout or user request)
   */
  async clearCredentials(): Promise<void> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        return;
      }
      await SecureStore.deleteItemAsync(STORED_USERNAME_KEY);
      await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      console.log('[BiometricService] Credentials cleared');
    } catch (error) {
      console.error('[BiometricService] Error clearing credentials:', error);
    }
  },

  /**
   * Disable biometric login but keep other data
   */
  async disableBiometricLogin(): Promise<void> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        return;
      }
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    } catch (error) {
      console.error('[BiometricService] Error disabling biometric login:', error);
    }
  },

  /**
   * Enable biometric login (if credentials are already stored)
   */
  async enableBiometricLogin(): Promise<boolean> {
    try {
      if (!secureStoreAvailable || !SecureStore) {
        return false;
      }
      const hasCredentials = await this.hasStoredCredentials();
      if (hasCredentials) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[BiometricService] Error enabling biometric login:', error);
      return false;
    }
  },

  /**
   * Full biometric login flow:
   * 1. Check if biometric is available
   * 2. Check if credentials are stored
   * 3. Authenticate with biometrics
   * 4. Return credentials if successful
   */
  async performBiometricLogin(): Promise<{ username: string; password: string } | null> {
    try {
      // Check availability
      const available = await this.isAvailable();
      if (!available) {
        console.log('[BiometricService] Biometrics not available');
        return null;
      }

      // Check if enabled and has credentials
      const enabled = await this.isBiometricLoginEnabled();
      if (!enabled) {
        console.log('[BiometricService] Biometric login not enabled');
        return null;
      }

      const hasCredentials = await this.hasStoredCredentials();
      if (!hasCredentials) {
        console.log('[BiometricService] No stored credentials');
        return null;
      }

      // Perform biometric authentication
      const authenticated = await this.authenticate('Sign in to Tander');
      if (!authenticated) {
        console.log('[BiometricService] Biometric authentication failed');
        return null;
      }

      // Return credentials
      return await this.getCredentials();
    } catch (error) {
      console.error('[BiometricService] Error in biometric login flow:', error);
      return null;
    }
  },
};

export default biometricService;
