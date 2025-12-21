import React, { useState, useEffect, ReactNode, useCallback } from 'react';
import { Alert } from 'react-native';
import { AuthContext, Phase1RegistrationData, RegistrationFlowState } from './AuthContext';
import authApi, { LoginRequest, RegisterRequest, CompleteProfileRequest, VerifyIdResponse } from '../api/authApi';
import { onAuthError, AuthErrorCode } from '../api/config';
import { disconnect as disconnectSocket } from '../services/chatService';
import biometricService from '../services/biometricService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [phase1Data, setPhase1Data] = useState<Phase1RegistrationData | null>(null);
  const [registrationFlow, setRegistrationFlow] = useState<RegistrationFlowState | null>(null);

  /**
   * Handle authentication errors from API interceptor
   * This handles token expiration, invalid tokens, etc.
   */
  const handleAuthError = useCallback((errorCode: AuthErrorCode, message: string) => {
    console.log('[AuthProvider] Auth error received:', errorCode, message);

    // Disconnect socket when auth fails
    disconnectSocket();

    // Clear auth state
    setToken(null);
    setIsAuthenticated(false);

    // Show appropriate message based on error code
    let alertTitle = 'Session Expired';
    let alertMessage = message;

    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        alertTitle = 'Session Expired';
        alertMessage = 'Your session has expired. Please log in again to continue.';
        break;
      case 'INVALID_TOKEN':
        alertTitle = 'Authentication Error';
        alertMessage = 'Your authentication is invalid. Please log in again.';
        break;
      case 'AUTH_ERROR':
        alertTitle = 'Authentication Failed';
        alertMessage = 'There was an authentication problem. Please log in again.';
        break;
    }

    // Show alert to user
    Alert.alert(alertTitle, alertMessage, [
      { text: 'OK', style: 'default' }
    ]);
  }, []);

  // Subscribe to auth errors on mount
  useEffect(() => {
    const unsubscribe = onAuthError(handleAuthError);
    return () => {
      unsubscribe();
    };
  }, [handleAuthError]);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const storedToken = await authApi.getToken();
      if (storedToken) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Check auth error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    try {
      const response = await authApi.login(credentials);
      setToken(response.token);
      setIsAuthenticated(true);
      // Clear registration flow state on successful login
      setRegistrationFlow(null);
      setPhase1Data(null);

      // Save credentials for biometric login (if biometrics available)
      const biometricAvailable = await biometricService.isAvailable();
      if (biometricAvailable) {
        await biometricService.saveCredentials(credentials.username, credentials.password);
        console.log('[AuthProvider] Credentials saved for biometric login');

        // Sync biometric enabled status with backend
        try {
          const { userApi } = await import('../api/userApi');
          await userApi.enableBiometric();
          console.log('[AuthProvider] Biometric status synced with backend');
        } catch (apiError) {
          console.warn('[AuthProvider] Failed to sync biometric with backend:', apiError);
          // Continue even if backend sync fails - local storage is primary
        }
      }
    } catch (error: any) {
      // If profile is incomplete, store credentials and flow state
      if (error.profileIncomplete && error.username) {
        setPhase1Data({
          username: error.username,
          email: credentials.username,
          password: credentials.password,
        });
        setRegistrationFlow({
          username: error.username,
          profileCompleted: false,
          idVerified: false,
        });
      }

      // If ID verification is incomplete, store flow state
      if (error.idVerificationIncomplete && error.username) {
        setPhase1Data({
          username: error.username,
          email: credentials.username,
          password: credentials.password,
        });
        setRegistrationFlow({
          username: error.username,
          profileCompleted: true,
          idVerified: false,
          idVerificationStatus: error.idVerificationStatus || 'PENDING',
        });
      }

      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      console.log('🟢 [AuthProvider.register] Called with data:', data);
      const result = await authApi.register(data);
      console.log('🟢 [AuthProvider.register] Success! Result:', result);

      // Initialize registration flow state
      setRegistrationFlow({
        username: data.username,
        profileCompleted: false,
        idVerified: false,
      });

      return result;
    } catch (error) {
      console.error('🔴 [AuthProvider.register] Error:', error);
      throw error;
    }
  };

  const completeProfile = async (username: string, data: CompleteProfileRequest): Promise<{ message: string; verificationToken?: string }> => {
    try {
      const result = await authApi.completeProfile(username, data);

      // Update registration flow state
      setRegistrationFlow(prev => ({
        ...prev!,
        username,
        profileCompleted: true,
        verificationToken: result.verificationToken,
      }));

      return result;
    } catch (error) {
      console.error('Complete profile error:', error);
      throw error;
    }
  };

  const verifyId = async (
    username: string,
    idPhotoFront: { uri: string; type: string; name: string },
    idPhotoBack?: { uri: string; type: string; name: string },
    verificationToken?: string
  ): Promise<VerifyIdResponse> => {
    try {
      const result = await authApi.verifyId(username, idPhotoFront, idPhotoBack, verificationToken);

      // Update registration flow state on success
      if (result.status === 'success') {
        setRegistrationFlow(prev => ({
          ...prev!,
          idVerified: true,
          idVerificationStatus: 'APPROVED',
        }));
      }

      return result;
    } catch (error) {
      console.error('ID verification error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Disconnect socket first
      disconnectSocket();

      // Clear API token and local storage
      await authApi.logout();

      // Clear auth state
      setToken(null);
      setIsAuthenticated(false);
      setPhase1Data(null);
      setRegistrationFlow(null);

      // NOTE: Biometric credentials are NOT cleared on logout
      // This allows users to use biometric login after logging out
      // Credentials are only cleared when user disables biometrics in Settings
      console.log('[AuthProvider] Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        token,
        phase1Data,
        registrationFlow,
        login,
        register,
        completeProfile,
        verifyId,
        logout,
        checkAuth,
        setPhase1Data,
        setRegistrationFlow,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
