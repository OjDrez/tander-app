import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY, getCurrentUsernameFromToken } from './config';

/**
 * ID Verification Response
 */
export interface VerificationResponse {
  status: 'success' | 'error';
  message: string;
}

/**
 * Verification Status
 */
export type VerificationStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'FAILED';

export interface VerificationInfo {
  idVerified: boolean;
  idVerificationStatus: VerificationStatus;
  extractedAge?: number;
  verifiedAt?: string;
  failureReason?: string;
}

/**
 * Verification API
 * Handles ID verification for age (60+) validation
 *
 * Senior-friendly considerations:
 * - Clear error messages
 * - Simple interface
 * - Progress tracking
 */
export const verificationApi = {
  /**
   * Submit ID photos for verification
   *
   * @param frontPhotoUri - URI of the front of the ID
   * @param backPhotoUri - URI of the back of the ID (optional)
   * @param verificationToken - Token from profile completion
   * @param onProgress - Progress callback
   */
  submitIdVerification: async (
    frontPhotoUri: string,
    backPhotoUri: string | null,
    verificationToken: string | null,
    onProgress?: (progress: number) => void
  ): Promise<VerificationResponse> => {
    try {
      const username = await getCurrentUsernameFromToken();
      if (!username) {
        throw new Error('Please log in to verify your ID');
      }

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('Please log in to verify your ID');
      }

      console.log('[verificationApi.submitIdVerification] Starting verification for user:', username);

      // Create form data
      const formData = new FormData();
      formData.append('username', username);

      if (verificationToken) {
        formData.append('verificationToken', verificationToken);
      }

      // Add front photo (required)
      const frontExtension = frontPhotoUri.split('.').pop()?.toLowerCase() || 'jpg';
      formData.append('idPhotoFront', {
        uri: frontPhotoUri,
        type: getMimeType(frontExtension),
        name: `id_front.${frontExtension}`,
      } as any);

      // Add back photo (optional)
      if (backPhotoUri) {
        const backExtension = backPhotoUri.split('.').pop()?.toLowerCase() || 'jpg';
        formData.append('idPhotoBack', {
          uri: backPhotoUri,
          type: getMimeType(backExtension),
          name: `id_back.${backExtension}`,
        } as any);
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          try {
            const response = JSON.parse(xhr.responseText);
            console.log('[verificationApi.submitIdVerification] Response:', response);

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({
                status: 'success',
                message: response.message || 'ID verification submitted successfully',
              });
            } else {
              reject(new Error(response.message || 'Verification failed'));
            }
          } catch (e) {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve({ status: 'success', message: 'ID submitted for verification' });
            } else {
              reject(new Error('Failed to process verification'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error. Please check your connection.'));
        };

        xhr.open('POST', `${API_BASE_URL}/user/verify-id`);
        xhr.setRequestHeader('Jwt-Token', token);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[verificationApi.submitIdVerification] Error:', error);
      throw new Error(error.message || 'Failed to submit verification');
    }
  },

  /**
   * Get current verification status
   */
  getVerificationStatus: async (): Promise<VerificationInfo> => {
    try {
      // This would call an endpoint to get verification status
      // For now, we'll extract it from the user profile
      const { userApi } = await import('./userApi');
      const profile = await userApi.getCurrentUser();

      return {
        idVerified: profile.verified,
        idVerificationStatus: 'PENDING' as VerificationStatus, // Would need backend support
        extractedAge: profile.age,
      };
    } catch (error: any) {
      console.error('[verificationApi.getVerificationStatus] Error:', error);
      throw new Error(error.message || 'Failed to get verification status');
    }
  },
};

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
  };
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

export default verificationApi;
