import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Secure storage keys
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const STORED_USERNAME_KEY = 'biometric_username';
const STORED_PASSWORD_KEY = 'biometric_password';

// Track if SecureStore is available (will be checked on first use)
let secureStoreAvailable: boolean | null = null;

// Check if SecureStore is actually available
async function checkSecureStoreAvailable(): Promise<boolean> {
  if (secureStoreAvailable !== null) {
    return secureStoreAvailable;
  }

  try {
    // Try a simple operation to verify SecureStore works
    const testKey = '__securestore_test__';
    await SecureStore.setItemAsync(testKey, 'test');
    await SecureStore.deleteItemAsync(testKey);
    secureStoreAvailable = true;
  } catch (error) {
    secureStoreAvailable = false;
  }

  return secureStoreAvailable;
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
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return false;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return false;
      }

      // SecureStore check - needed for storing credentials
      await checkSecureStoreAvailable();

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
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
        return false;
      }
      await SecureStore.setItemAsync(STORED_USERNAME_KEY, username);
      await SecureStore.setItemAsync(STORED_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
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
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
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
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
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
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
        return;
      }
      await SecureStore.deleteItemAsync(STORED_USERNAME_KEY);
      await SecureStore.deleteItemAsync(STORED_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('[BiometricService] Error clearing credentials:', error);
    }
  },

  /**
   * Disable biometric login but keep other data
   */
  async disableBiometricLogin(): Promise<void> {
    try {
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
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
      const storeAvailable = await checkSecureStoreAvailable();
      if (!storeAvailable) {
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
        return null;
      }

      // Check if enabled and has credentials
      const enabled = await this.isBiometricLoginEnabled();
      if (!enabled) {
        return null;
      }

      const hasCredentials = await this.hasStoredCredentials();
      if (!hasCredentials) {
        return null;
      }

      // Perform biometric authentication
      const authenticated = await this.authenticate('Sign in to Tander');
      if (!authenticated) {
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
