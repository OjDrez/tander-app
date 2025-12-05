import React, { createContext, useContext } from 'react';
import { LoginRequest, RegisterRequest, CompleteProfileRequest, VerifyIdResponse } from '../api/authApi';

export interface Phase1RegistrationData {
  username: string;
  email: string;
  password: string;
}

export interface RegistrationFlowState {
  username: string;
  verificationToken?: string;
  profileCompleted: boolean;
  idVerified: boolean;
  idVerificationStatus?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  phase1Data: Phase1RegistrationData | null;
  registrationFlow: RegistrationFlowState | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  completeProfile: (username: string, data: CompleteProfileRequest) => Promise<{ message: string; verificationToken?: string }>;
  verifyId: (
    username: string,
    idPhotoFront: { uri: string; type: string; name: string },
    idPhotoBack?: { uri: string; type: string; name: string },
    verificationToken?: string
  ) => Promise<VerifyIdResponse>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setPhase1Data: (data: Phase1RegistrationData | null) => void;
  setRegistrationFlow: (data: RegistrationFlowState | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
