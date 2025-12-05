import React, { useState, useEffect, ReactNode } from 'react';
import { AuthContext, Phase1RegistrationData, RegistrationFlowState } from './AuthContext';
import authApi, { LoginRequest, RegisterRequest, CompleteProfileRequest, VerifyIdResponse } from '../api/authApi';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [phase1Data, setPhase1Data] = useState<Phase1RegistrationData | null>(null);
  const [registrationFlow, setRegistrationFlow] = useState<RegistrationFlowState | null>(null);

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
      await authApi.logout();
      setToken(null);
      setIsAuthenticated(false);
      setPhase1Data(null);
      setRegistrationFlow(null);
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
