import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, TOKEN_KEY, getCurrentUsernameFromToken } from './config';

/**
 * Photo Upload Response
 */
export interface PhotoUploadResponse {
  status: 'success' | 'error';
  message: string;
  profilePhotoUrl?: string;
  additionalPhotoUrls?: string[];
  totalPhotos?: number;
  remainingPhotos?: number;
}

/**
 * Photo API
 * Handles profile photo upload operations
 *
 * Folder structure on server:
 *   username/
 *     profile/         - Main profile picture (1)
 *     additional/      - Additional photos (up to 6)
 *
 * Senior-friendly considerations:
 * - Clear error messages
 * - Progress callbacks for feedback
 * - Simple interface
 */
export const photoApi = {
  /**
   * Upload profile photo (main photo) - FOR AUTHENTICATED USERS
   * Uses the new /upload-profile-photo endpoint that authenticates via JWT
   *
   * @param photoUri - Local URI of the photo to upload
   * @param onProgress - Optional progress callback (0-100)
   */
  uploadProfilePhoto: async (
    photoUri: string,
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('Please log in to upload photos');
      }

      console.log('[photoApi.uploadProfilePhoto] Starting upload');

      // Create form data
      const formData = new FormData();

      // Get file extension and mime type
      const fileExtension = photoUri.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = getMimeType(fileExtension);

      // Append the photo file
      formData.append('profilePhoto', {
        uri: photoUri,
        type: mimeType,
        name: `profile_photo.${fileExtension}`,
      } as any);

      // Make the request with XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('[photoApi.uploadProfilePhoto] Success:', response);
              resolve(response);
            } catch (e) {
              resolve({
                status: 'success',
                message: 'Photo uploaded successfully',
              });
            }
          } else {
            console.error('[photoApi.uploadProfilePhoto] Error status:', xhr.status);
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Failed to upload photo'));
            } catch (e) {
              reject(new Error('Failed to upload photo'));
            }
          }
        };

        xhr.onerror = () => {
          console.error('[photoApi.uploadProfilePhoto] Network error');
          reject(new Error('Network error. Please check your connection.'));
        };

        // Use new authenticated endpoint
        xhr.open('POST', `${API_BASE_URL}/user/upload-profile-photo`);
        xhr.setRequestHeader('Jwt-Token', token);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[photoApi.uploadProfilePhoto] Error:', error);
      throw new Error(error.message || 'Failed to upload photo');
    }
  },

  /**
   * Upload multiple additional photos - FOR AUTHENTICATED USERS
   * Uses the new /upload-additional-photos endpoint that authenticates via JWT
   * Appends to existing additional photos
   *
   * @param photoUris - Array of local URIs to upload
   * @param onProgress - Optional progress callback (0-100)
   */
  uploadAdditionalPhotos: async (
    photoUris: string[],
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('Please log in to upload photos');
      }

      console.log('[photoApi.uploadAdditionalPhotos] Starting upload for', photoUris.length, 'photos');

      // Create form data
      const formData = new FormData();

      // Append all photos
      photoUris.forEach((uri, index) => {
        const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = getMimeType(fileExtension);

        formData.append('additionalPhotos', {
          uri: uri,
          type: mimeType,
          name: `additional_photo_${index}.${fileExtension}`,
        } as any);
      });

      // Make the request
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('[photoApi.uploadAdditionalPhotos] Success:', response);
              resolve(response);
            } catch (e) {
              resolve({
                status: 'success',
                message: 'Photos uploaded successfully',
              });
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Failed to upload photos'));
            } catch (e) {
              reject(new Error('Failed to upload photos'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error. Please check your connection.'));
        };

        // Use new authenticated endpoint
        xhr.open('POST', `${API_BASE_URL}/user/upload-additional-photos`);
        xhr.setRequestHeader('Jwt-Token', token);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[photoApi.uploadAdditionalPhotos] Error:', error);
      throw new Error(error.message || 'Failed to upload photos');
    }
  },

  /**
   * Upload both profile and additional photos in one request
   * Used during REGISTRATION (requires username parameter)
   */
  uploadAllPhotos: async (
    profilePhotoUri: string | null,
    additionalPhotoUris: string[],
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> => {
    try {
      const username = await getCurrentUsernameFromToken();
      if (!username) {
        throw new Error('Please log in to upload photos');
      }

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('Please log in to upload photos');
      }

      const formData = new FormData();
      formData.append('username', username);

      // Add profile photo if provided
      if (profilePhotoUri) {
        const fileExtension = profilePhotoUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = getMimeType(fileExtension);
        formData.append('profilePhoto', {
          uri: profilePhotoUri,
          type: mimeType,
          name: `profile_photo.${fileExtension}`,
        } as any);
      }

      // Add additional photos
      additionalPhotoUris.forEach((uri, index) => {
        const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = getMimeType(fileExtension);
        formData.append('additionalPhotos', {
          uri: uri,
          type: mimeType,
          name: `additional_photo_${index}.${fileExtension}`,
        } as any);
      });

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              resolve({ status: 'success', message: 'Photos uploaded successfully' });
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Failed to upload photos'));
            } catch (e) {
              reject(new Error('Failed to upload photos'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error. Please check your connection.'));
        };

        // Use registration endpoint (requires username)
        xhr.open('POST', `${API_BASE_URL}/user/upload-photos`);
        xhr.setRequestHeader('Jwt-Token', token);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[photoApi.uploadAllPhotos] Error:', error);
      throw new Error(error.message || 'Failed to upload photos');
    }
  },

  /**
   * Upload photos during registration (non-authenticated, uses username param)
   * This is for Step3Upload during registration flow
   */
  uploadRegistrationPhotos: async (
    username: string,
    profilePhotoUri: string | null,
    additionalPhotoUris: string[],
    onProgress?: (progress: number) => void
  ): Promise<PhotoUploadResponse> => {
    try {
      console.log('[photoApi.uploadRegistrationPhotos] Starting upload for user:', username);

      const formData = new FormData();
      formData.append('username', username);

      // Add profile photo if provided
      if (profilePhotoUri) {
        const fileExtension = profilePhotoUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = getMimeType(fileExtension);
        formData.append('profilePhoto', {
          uri: profilePhotoUri,
          type: mimeType,
          name: `profile_photo.${fileExtension}`,
        } as any);
      }

      // Add additional photos
      additionalPhotoUris.forEach((uri, index) => {
        const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = getMimeType(fileExtension);
        formData.append('additionalPhotos', {
          uri: uri,
          type: mimeType,
          name: `additional_photo_${index}.${fileExtension}`,
        } as any);
      });

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              console.log('[photoApi.uploadRegistrationPhotos] Success:', response);
              resolve(response);
            } catch (e) {
              resolve({ status: 'success', message: 'Photos uploaded successfully' });
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.message || 'Failed to upload photos'));
            } catch (e) {
              reject(new Error('Failed to upload photos'));
            }
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error. Please check your connection.'));
        };

        // Registration endpoint doesn't require auth token
        xhr.open('POST', `${API_BASE_URL}/user/upload-photos`);
        xhr.send(formData);
      });
    } catch (error: any) {
      console.error('[photoApi.uploadRegistrationPhotos] Error:', error);
      throw new Error(error.message || 'Failed to upload photos');
    }
  },

  /**
   * Get full URL for a photo path
   */
  getPhotoUrl: (path: string | null | undefined): string | null => {
    if (!path) return null;

    // If it's already a full URL, return as-is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    // Otherwise, prepend the API base URL
    return `${API_BASE_URL}${path}`;
  },

  /**
   * Delete an additional photo by index
   *
   * @param photoIndex - Index of the photo to delete (0-based)
   */
  deleteAdditionalPhoto: async (photoIndex: number): Promise<PhotoUploadResponse> => {
    try {
      const username = await getCurrentUsernameFromToken();
      if (!username) {
        throw new Error('Please log in to delete photos');
      }

      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        throw new Error('Please log in to delete photos');
      }

      console.log('[photoApi.deleteAdditionalPhoto] Deleting photo at index:', photoIndex);

      const response = await fetch(`${API_BASE_URL}/user/delete-photo?photoIndex=${photoIndex}`, {
        method: 'DELETE',
        headers: {
          'Jwt-Token': token,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete photo');
      }

      const data = await response.json().catch(() => ({
        status: 'success',
        message: 'Photo deleted successfully',
      }));

      console.log('[photoApi.deleteAdditionalPhoto] Success:', data);
      return data;
    } catch (error: any) {
      console.error('[photoApi.deleteAdditionalPhoto] Error:', error);
      throw new Error(error.message || 'Failed to delete photo');
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
    gif: 'image/gif',
  };
  return mimeTypes[extension.toLowerCase()] || 'image/jpeg';
}

export default photoApi;
