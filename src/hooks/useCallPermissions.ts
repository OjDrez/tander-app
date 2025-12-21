/**
 * Call Permissions Hook
 * Handles camera and microphone permissions for calls
 * Works in both Expo Go and development builds
 */

import { useCallback, useState, useEffect } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export interface CallPermissions {
  camera: PermissionStatus;
  microphone: PermissionStatus;
  canMakeAudioCall: boolean;
  canMakeVideoCall: boolean;
}

export interface UseCallPermissionsReturn {
  permissions: CallPermissions;
  isLoading: boolean;
  requestAudioPermissions: () => Promise<boolean>;
  requestVideoPermissions: () => Promise<boolean>;
  requestAllPermissions: () => Promise<{ audio: boolean; video: boolean }>;
  openSettings: () => void;
}

/**
 * Hook to manage call permissions
 * Uses expo-camera and expo-av for Expo Go compatibility
 */
export function useCallPermissions(): UseCallPermissionsReturn {
  const [permissions, setPermissions] = useState<CallPermissions>({
    camera: 'undetermined',
    microphone: 'undetermined',
    canMakeAudioCall: false,
    canMakeVideoCall: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Check current permission status
  const checkPermissions = useCallback(async () => {
    try {
      const [cameraStatus, audioStatus] = await Promise.all([
        Camera.getCameraPermissionsAsync(),
        Audio.getPermissionsAsync(),
      ]);

      const cameraGranted = cameraStatus.status === 'granted';
      const audioGranted = audioStatus.status === 'granted';

      setPermissions({
        camera: cameraStatus.status as PermissionStatus,
        microphone: audioStatus.status as PermissionStatus,
        canMakeAudioCall: audioGranted,
        canMakeVideoCall: cameraGranted && audioGranted,
      });
    } catch (error) {
      console.error('[Permissions] Error checking permissions:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  /**
   * Request microphone permission for audio calls
   */
  const requestAudioPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      const granted = status === 'granted';

      setPermissions((prev) => ({
        ...prev,
        microphone: status as PermissionStatus,
        canMakeAudioCall: granted,
        canMakeVideoCall: prev.camera === 'granted' && granted,
      }));

      if (!granted) {
        showPermissionDeniedAlert('Microphone', 'audio calls');
      }

      return granted;
    } catch (error) {
      console.error('[Permissions] Error requesting audio permission:', error);
      return false;
    }
  }, []);

  /**
   * Request camera and microphone permissions for video calls
   */
  const requestVideoPermissions = useCallback(async (): Promise<boolean> => {
    try {
      const [cameraResult, audioResult] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        Audio.requestPermissionsAsync(),
      ]);

      const cameraGranted = cameraResult.status === 'granted';
      const audioGranted = audioResult.status === 'granted';
      const allGranted = cameraGranted && audioGranted;

      setPermissions({
        camera: cameraResult.status as PermissionStatus,
        microphone: audioResult.status as PermissionStatus,
        canMakeAudioCall: audioGranted,
        canMakeVideoCall: allGranted,
      });

      if (!allGranted) {
        const missing: string[] = [];
        if (!cameraGranted) missing.push('camera');
        if (!audioGranted) missing.push('microphone');
        showPermissionDeniedAlert(missing.join(' and '), 'video calls');
      }

      return allGranted;
    } catch (error) {
      console.error('[Permissions] Error requesting video permissions:', error);
      return false;
    }
  }, []);

  /**
   * Request all permissions at once
   */
  const requestAllPermissions = useCallback(async (): Promise<{ audio: boolean; video: boolean }> => {
    try {
      const [cameraResult, audioResult] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        Audio.requestPermissionsAsync(),
      ]);

      const cameraGranted = cameraResult.status === 'granted';
      const audioGranted = audioResult.status === 'granted';

      setPermissions({
        camera: cameraResult.status as PermissionStatus,
        microphone: audioResult.status as PermissionStatus,
        canMakeAudioCall: audioGranted,
        canMakeVideoCall: cameraGranted && audioGranted,
      });

      return {
        audio: audioGranted,
        video: cameraGranted && audioGranted,
      };
    } catch (error) {
      console.error('[Permissions] Error requesting all permissions:', error);
      return { audio: false, video: false };
    }
  }, []);

  /**
   * Open app settings to manually enable permissions
   */
  const openSettings = useCallback(() => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }, []);

  return {
    permissions,
    isLoading,
    requestAudioPermissions,
    requestVideoPermissions,
    requestAllPermissions,
    openSettings,
  };
}

/**
 * Show alert when permission is denied
 */
function showPermissionDeniedAlert(permission: string, feature: string) {
  Alert.alert(
    `${permission.charAt(0).toUpperCase() + permission.slice(1)} Access Required`,
    `To make ${feature}, please allow ${permission} access in your device settings.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Settings',
        onPress: () => {
          if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
          } else {
            Linking.openSettings();
          }
        },
      },
    ]
  );
}

/**
 * Utility function to check if permissions are granted before starting a call
 * Can be used as a pre-check before navigation to call screen
 */
export async function ensureCallPermissions(
  callType: 'audio' | 'video'
): Promise<{ granted: boolean; message?: string }> {
  try {
    if (callType === 'audio') {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        return {
          granted: false,
          message: 'Microphone permission is required for audio calls.',
        };
      }
      return { granted: true };
    } else {
      const [cameraResult, audioResult] = await Promise.all([
        Camera.requestCameraPermissionsAsync(),
        Audio.requestPermissionsAsync(),
      ]);

      if (cameraResult.status !== 'granted' && audioResult.status !== 'granted') {
        return {
          granted: false,
          message: 'Camera and microphone permissions are required for video calls.',
        };
      } else if (cameraResult.status !== 'granted') {
        return {
          granted: false,
          message: 'Camera permission is required for video calls. You can continue with audio only.',
        };
      } else if (audioResult.status !== 'granted') {
        return {
          granted: false,
          message: 'Microphone permission is required for calls.',
        };
      }
      return { granted: true };
    }
  } catch (error) {
    console.error('[Permissions] Error checking call permissions:', error);
    return {
      granted: false,
      message: 'Unable to check permissions. Please try again.',
    };
  }
}

export default useCallPermissions;
