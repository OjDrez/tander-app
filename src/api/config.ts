import AsyncStorage from '@react-native-async-storage/async-storage';
import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';

// Auth error codes from backend
export type AuthErrorCode = 'TOKEN_EXPIRED' | 'INVALID_TOKEN' | 'AUTH_ERROR';

// Event emitter for auth state changes
type AuthEventListener = (errorCode: AuthErrorCode, message: string) => void;
const authEventListeners: AuthEventListener[] = [];

/**
 * Subscribe to authentication error events
 * Use this to handle token expiration, invalid tokens, etc. at the app level
 */
export const onAuthError = (listener: AuthEventListener): (() => void) => {
  authEventListeners.push(listener);
  return () => {
    const index = authEventListeners.indexOf(listener);
    if (index > -1) {
      authEventListeners.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners of an auth error
 */
const notifyAuthError = (errorCode: AuthErrorCode, message: string) => {
  authEventListeners.forEach(listener => {
    try {
      listener(errorCode, message);
    } catch (e) {
      console.error('[API Config] Auth event listener error:', e);
    }
  });
};

// Platform-specific API URL configuration
// - iOS Simulator: http://localhost:8080
// - Android Emulator: http://10.0.2.2:8080
// - Physical Device: Replace with your computer's IP address (e.g., http://192.168.1.100:8080)
const getApiBaseUrl = () => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'https://invitation-pod-lender-issn.trycloudflare.com'; // Android emulator
    }
    return 'https://invitation-pod-lender-issn.trycloudflare.com'; // iOS simulator or web
  }
  // Production URL - update this for production deployment
  return 'https://invitation-pod-lender-issn.trycloudflare.com';
};

export const API_BASE_URL = getApiBaseUrl();

export const TOKEN_KEY = '@tander_jwt_token';

/**
 * Decode JWT token payload (without verification)
 * This is safe because we trust the token came from our server
 */
export const decodeJwtPayload = (token: string): { sub?: string; iss?: string; exp?: number; iat?: number; authorities?: string[] } | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    // Decode base64
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (e) {
    console.error('[API Config] Failed to decode JWT:', e);
    return null;
  }
};

/**
 * Get the current username from stored JWT token
 */
export const getCurrentUsernameFromToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    return payload?.sub || null;
  } catch (e) {
    console.error('[API Config] Failed to get username from token:', e);
    return null;
  }
};

// Log API configuration on startup
console.log('⚙️  [API Config] Platform:', Platform.OS);
console.log('⚙️  [API Config] Base URL:', API_BASE_URL);
console.log('⚙️  [API Config] Dev mode:', __DEV__);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('🌐 [API Request] Headers:', config.headers);
    if (config.data) {
      console.log('🌐 [API Request] Body:', JSON.stringify(config.data, null, 2));
    }

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Jwt-Token'] = token;
      console.log('🔑 [API Request] Token added to headers:', token.substring(0, 50) + '...');
    } else {
      console.log('⚠️ [API Request] No token found in storage');
    }
    return config;
  },
  (error) => {
    console.error('❌ [API Request Error]:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
    console.log('✅ [API Response] Data:', JSON.stringify(response.data, null, 2));
    console.log('✅ [API Response] All Headers:', JSON.stringify(response.headers, null, 2));

    // Try both lowercase and original case header names
    const token = response.headers['jwt-token'] || response.headers['Jwt-Token'];
    if (token) {
      AsyncStorage.setItem(TOKEN_KEY, token);
      console.log('🔑 [API Response] JWT token saved:', token.substring(0, 50) + '...');
    } else {
      console.log('⚠️ [API Response] No JWT token found in response headers');
    }
    return response;
  },
  async (error: AxiosError<{ error?: boolean; errorCode?: AuthErrorCode; message?: string }>) => {
    console.error(`❌ [API Response Error] ${error.config?.url}`);
    console.error(`❌ [API Response Error] Status: ${error.response?.status}`);
    console.error(`❌ [API Response Error] Data:`, JSON.stringify(error.response?.data, null, 2));
    console.error(`❌ [API Response Error] Message:`, error.message);

    if (error.response?.status === 401) {
      // Clear the invalid token
      await AsyncStorage.removeItem(TOKEN_KEY);
      console.log('🔑 [API Response] Token removed due to 401');

      // Check for specific error codes from backend
      const data = error.response?.data;
      if (data?.errorCode) {
        const errorCode = data.errorCode as AuthErrorCode;
        const message = data.message || 'Authentication failed';

        console.log(`🔐 [API Auth Error] Code: ${errorCode}, Message: ${message}`);

        // Notify listeners about the auth error
        notifyAuthError(errorCode, message);

        // Enhance error with structured data for easier handling
        const enhancedError = error as AxiosError & {
          authErrorCode?: AuthErrorCode;
          authMessage?: string;
        };
        enhancedError.authErrorCode = errorCode;
        enhancedError.authMessage = message;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
