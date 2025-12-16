import apiClient from './config';

/**
 * User Profile Response from GET /user/me
 */
export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  nickName?: string;
  displayName: string;
  age?: number;
  birthDate?: string;
  city?: string;
  country?: string;
  civilStatus?: string;
  hobby?: string;
  bio?: string;
  interests?: string;
  lookingFor?: string;
  profilePhotoUrl?: string;
  additionalPhotos?: string;
  verified: boolean;
  profileCompleted: boolean;
}

/**
 * Update Profile Request
 */
export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  nickName?: string;
  age?: number;
  birthDate?: string;
  city?: string;
  country?: string;
  civilStatus?: string;
  hobby?: string;
  bio?: string;
  interests?: string[];
  lookingFor?: string[];
}

/**
 * Password Change Request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * User API
 * Handles user profile operations
 */
export const userApi = {
  /**
   * Get current authenticated user's profile
   */
  getCurrentUser: async (): Promise<UserProfile> => {
    try {
      console.log('🔵 [userApi.getCurrentUser] Fetching current user profile...');

      const response = await apiClient.get<UserProfile>('/user/me');

      console.log('✅ [userApi.getCurrentUser] Got profile:', response.data.displayName);
      return response.data;
    } catch (error: any) {
      console.error('❌ [userApi.getCurrentUser] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },

  /**
   * Parse interests from JSON string
   */
  parseInterests: (interestsJson?: string): string[] => {
    if (!interestsJson) return [];
    try {
      return JSON.parse(interestsJson);
    } catch {
      return [];
    }
  },

  /**
   * Parse looking for from JSON string
   */
  parseLookingFor: (lookingForJson?: string): string[] => {
    if (!lookingForJson) return [];
    try {
      return JSON.parse(lookingForJson);
    } catch {
      return [];
    }
  },

  /**
   * Parse additional photos from JSON string
   */
  parseAdditionalPhotos: (additionalPhotosJson?: string): string[] => {
    if (!additionalPhotosJson) return [];
    try {
      return JSON.parse(additionalPhotosJson);
    } catch {
      return [];
    }
  },

  /**
   * Get display location string
   */
  getLocationDisplay: (profile: UserProfile): string => {
    const parts: string[] = [];
    if (profile.city) parts.push(profile.city);
    if (profile.country) parts.push(profile.country);
    return parts.join(', ') || 'Location not set';
  },

  /**
   * Update current user's profile
   */
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    try {
      console.log('🔵 [userApi.updateProfile] Updating profile...');

      // Convert arrays to JSON strings if backend expects JSON
      const requestData = {
        ...data,
        interests: data.interests ? JSON.stringify(data.interests) : undefined,
        lookingFor: data.lookingFor ? JSON.stringify(data.lookingFor) : undefined,
      };

      const response = await apiClient.put<UserProfile>('/user/profile', requestData);

      console.log('✅ [userApi.updateProfile] Profile updated:', response.data.displayName);
      return response.data;
    } catch (error: any) {
      console.error('❌ [userApi.updateProfile] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  },

  /**
   * Change user password
   */
  changePassword: async (data: ChangePasswordRequest): Promise<{ success: boolean; message: string }> => {
    try {
      console.log('🔵 [userApi.changePassword] Changing password...');

      const response = await apiClient.post<{ success: boolean; message: string }>('/user/change-password', data);

      console.log('✅ [userApi.changePassword] Password changed successfully');
      return response.data;
    } catch (error: any) {
      console.error('❌ [userApi.changePassword] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  },

  /**
   * Get user by ID (for viewing other profiles)
   */
  getUserById: async (userId: number): Promise<UserProfile> => {
    try {
      console.log('🔵 [userApi.getUserById] Fetching user:', userId);

      const response = await apiClient.get<UserProfile>(`/user/${userId}`);

      console.log('✅ [userApi.getUserById] Got user:', response.data.displayName);
      return response.data;
    } catch (error: any) {
      console.error('❌ [userApi.getUserById] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch user profile');
    }
  },
};

export default userApi;
