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

// Production API URL
const AZURE_API_URL = 'https://api.tanderconnect.com';

// Platform-specific API URL configuration
// - Production: Azure App Service
// - Development: Can use localhost or Azure
const getApiBaseUrl = () => {
  // Always use Azure backend (production-ready)
  return AZURE_API_URL;
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

// Log API configuration on startup (only in dev mode)
if (__DEV__) {
  console.log('⚙️  [API Config] Platform:', Platform.OS);
  console.log('⚙️  [API Config] Base URL:', API_BASE_URL);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  async (config) => {
    // Only log in development mode - never log sensitive data in production
    if (__DEV__) {
      console.log(`🌐 [API Request] ${config.method?.toUpperCase()} ${config.url}`);
      // NOTE: Never log request body or full headers - may contain sensitive data
    }

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers['Jwt-Token'] = token;
    }
    return config;
  },
  (error) => {
    if (__DEV__) {
      console.error('❌ [API Request Error]:', error.message);
    }
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    // Only log in development mode - never log response data in production
    if (__DEV__) {
      console.log(`✅ [API Response] ${response.status} ${response.config.url}`);
      // NOTE: Never log response body - may contain sensitive user data
    }

    // Try both lowercase and original case header names
    const token = response.headers['jwt-token'] || response.headers['Jwt-Token'];
    if (token) {
      AsyncStorage.setItem(TOKEN_KEY, token);
    }
    return response;
  },
  async (error: AxiosError<{ error?: boolean; errorCode?: AuthErrorCode; message?: string }>) => {
    // Only log in development mode
    if (__DEV__) {
      console.error(`❌ [API Response Error] ${error.config?.url} - Status: ${error.response?.status}`);
      // NOTE: Never log error response data - may contain sensitive info
    }

    if (error.response?.status === 401) {
      // Clear the invalid token
      await AsyncStorage.removeItem(TOKEN_KEY);

      // Check for specific error codes from backend
      const data = error.response?.data;
      if (data?.errorCode) {
        const errorCode = data.errorCode as AuthErrorCode;
        const message = data.message || 'Authentication failed';

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
