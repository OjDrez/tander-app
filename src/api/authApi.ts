import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, { TOKEN_KEY } from './config';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CompleteProfileRequest {
  firstName: string;
  lastName: string;
  middleName?: string;
  nickName: string;
  address?: string;
  phone?: string;
  email: string;
  birthDate: string;
  age: number;
  country: string;
  city: string;
  civilStatus: string;
  hobby?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
}

export interface ProfileIncompleteError {
  message: string;
  profileCompleted: boolean;
  username: string;
}

export interface IdVerificationIncompleteError {
  message: string;
  idVerified: boolean;
  idVerificationStatus: string;
  username: string;
}

export interface VerifyIdRequest {
  username: string;
  idPhotoFront: FormData;
  idPhotoBack?: FormData;
  verificationToken?: string;
}

export interface VerifyIdResponse {
  status: 'success' | 'error';
  message: string;
}

export interface UploadPhotosResponse {
  status: 'success' | 'error';
  message: string;
  profilePhotoUrl?: string;
  additionalPhotoUrls?: string[];
}

export interface UpdateAboutYouRequest {
  username: string;
  bio?: string;
  interests: string[];
  lookingFor: string[];
}

export interface UpdateAboutYouResponse {
  status: 'success' | 'error';
  message: string;
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<string> => {
    try {
      console.log('🔵 [authApi.register] Starting registration...');
      console.log('🔵 [authApi.register] Data:', JSON.stringify(data, null, 2));
      console.log('🔵 [authApi.register] Endpoint: POST /user/register');

      const response = await apiClient.post('/user/register', data);

      console.log('✅ [authApi.register] Success! Response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [authApi.register] Error occurred:');
      console.error('   Status:', error.response?.status);
      console.error('   Message:', error.response?.data?.message || error.message);
      console.error('   Full error:', JSON.stringify(error.response?.data, null, 2));
      console.error('   Network error:', error.message);

      throw new Error(error.response?.data?.message || error.message || 'Registration failed');
    }
  },

  login: async (data: LoginRequest): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post('/user/login', data);
      const token = response.headers['jwt-token'];
      if (token) {
        await AsyncStorage.setItem(TOKEN_KEY, token);
      }
      return {
        message: response.data,
        token: token || '',
      };
    } catch (error: any) {
      // Handle profile incomplete error (403 with profileCompleted: false)
      if (error.response?.status === 403 && error.response?.data) {
        const errorData = error.response.data;

        // Check if profile is incomplete
        if (errorData.profileCompleted === false) {
          const profileError: any = new Error(errorData.message);
          profileError.profileIncomplete = true;
          profileError.username = errorData.username;
          throw profileError;
        }

        // Check if ID verification is incomplete
        if (errorData.idVerified === false) {
          const idError: any = new Error(errorData.message);
          idError.idVerificationIncomplete = true;
          idError.idVerificationStatus = errorData.idVerificationStatus || 'PENDING';
          idError.username = errorData.username;
          throw idError;
        }
      }

      // Handle authentication failure (401 - invalid credentials)
      if (error.response?.status === 401) {
        const authError: any = new Error('Incorrect username or password');
        authError.code = 'INVALID_CREDENTIALS';
        throw authError;
      }

      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  completeProfile: async (username: string, data: CompleteProfileRequest): Promise<{ message: string; verificationToken?: string }> => {
    try {
      const response = await apiClient.post(`/user/complete-profile?username=${username}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Profile completion failed');
    }
  },

  verifyId: async (
    username: string,
    idPhotoFront: { uri: string; type: string; name: string },
    idPhotoBack?: { uri: string; type: string; name: string },
    verificationToken?: string
  ): Promise<VerifyIdResponse> => {
    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('idPhotoFront', idPhotoFront as any);

      if (idPhotoBack) {
        formData.append('idPhotoBack', idPhotoBack as any);
      }

      if (verificationToken) {
        formData.append('verificationToken', verificationToken);
      }

      const response = await apiClient.post('/user/verify-id', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file upload
      });

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'ID verification failed';
      throw new Error(errorMessage);
    }
  },

  uploadPhotos: async (
    username: string,
    profilePhoto?: { uri: string; type: string; name: string },
    additionalPhotos?: { uri: string; type: string; name: string }[]
  ): Promise<UploadPhotosResponse> => {
    try {
      console.log('🔵 [authApi.uploadPhotos] Starting photo upload...');
      console.log('🔵 [authApi.uploadPhotos] Username:', username);
      console.log('🔵 [authApi.uploadPhotos] Profile photo:', profilePhoto ? 'Yes' : 'No');
      console.log('🔵 [authApi.uploadPhotos] Additional photos:', additionalPhotos?.length || 0);

      const formData = new FormData();
      formData.append('username', username);

      // Add profile photo if provided
      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto as any);
      }

      // Add additional photos if provided
      if (additionalPhotos && additionalPhotos.length > 0) {
        additionalPhotos.forEach((photo) => {
          formData.append('additionalPhotos', photo as any);
        });
      }

      const response = await apiClient.post('/user/upload-photos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 120000, // 2 minute timeout for multiple file uploads
      });

      console.log('✅ [authApi.uploadPhotos] Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [authApi.uploadPhotos] Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Photo upload failed';
      throw new Error(errorMessage);
    }
  },

  updateAboutYou: async (
    username: string,
    bio: string | undefined,
    interests: string[],
    lookingFor: string[]
  ): Promise<UpdateAboutYouResponse> => {
    try {
      console.log('🔵 [authApi.updateAboutYou] Starting About You update...');
      console.log('🔵 [authApi.updateAboutYou] Username:', username);
      console.log('🔵 [authApi.updateAboutYou] Bio:', bio ? 'Yes' : 'No');
      console.log('🔵 [authApi.updateAboutYou] Interests:', interests);
      console.log('🔵 [authApi.updateAboutYou] Looking for:', lookingFor);

      // Build query params
      const params = new URLSearchParams();
      params.append('username', username);
      if (bio) {
        params.append('bio', bio);
      }
      interests.forEach(interest => params.append('interests', interest));
      lookingFor.forEach(item => params.append('lookingFor', item));

      const response = await apiClient.post(`/user/update-about-you?${params.toString()}`);

      console.log('✅ [authApi.updateAboutYou] Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [authApi.updateAboutYou] Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'About You update failed';
      throw new Error(errorMessage);
    }
  },

  logout: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    const token = await authApi.getToken();
    return !!token;
  },
};

export default authApi;
