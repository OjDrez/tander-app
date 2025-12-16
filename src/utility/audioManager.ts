/**
 * Audio Manager for Voice/Video Calls
 * Handles speaker/earpiece switching and audio routing
 *
 * Uses react-native-incall-manager for actual audio control.
 * Falls back to UI-only state in Expo Go where native modules aren't available.
 */

import { Platform } from 'react-native';

export type AudioOutputRoute = 'speaker' | 'earpiece';

interface AudioManagerState {
  isInitialized: boolean;
  currentRoute: AudioOutputRoute;
  isInCall: boolean;
  nativeAvailable: boolean;
}

const state: AudioManagerState = {
  isInitialized: false,
  currentRoute: 'speaker',
  isInCall: false,
  nativeAvailable: false,
};

// Lazy load InCallManager to avoid crashes in Expo Go
let InCallManager: any = null;

/**
 * Try to load the native InCallManager module
 */
const loadInCallManager = async (): Promise<boolean> => {
  if (InCallManager !== null) {
    return state.nativeAvailable;
  }

  try {
    // Dynamic import to avoid crashes when module isn't available
    const module = await import('react-native-incall-manager');
    InCallManager = module.default;
    state.nativeAvailable = true;
    console.log('[AudioManager] InCallManager loaded successfully');
    return true;
  } catch (error) {
    console.log('[AudioManager] InCallManager not available (Expo Go mode):', error);
    InCallManager = null;
    state.nativeAvailable = false;
    return false;
  }
};

/**
 * Initialize audio mode for calls
 * Sets up proper audio routing for voice/video calls
 */
export const initializeCallAudio = async (isVideoCall: boolean = false): Promise<boolean> => {
  console.log('[AudioManager] Initializing call audio, isVideoCall:', isVideoCall);

  // Try to load native module
  await loadInCallManager();

  state.isInitialized = true;
  state.isInCall = true;

  if (state.nativeAvailable && InCallManager) {
    try {
      // Start InCallManager - this sets up the audio session
      // media: 'audio' for voice calls, 'video' for video calls
      // auto: true to automatically manage audio routing
      // ringback: '_BUNDLE_' to use default ringback tone
      InCallManager.start({
        media: isVideoCall ? 'video' : 'audio',
        auto: true,
        ringback: '',
      });

      // Set initial speaker state based on call type
      // Video calls default to speaker, voice calls can start with earpiece
      const defaultToSpeaker = isVideoCall;
      InCallManager.setSpeakerphoneOn(defaultToSpeaker);
      state.currentRoute = defaultToSpeaker ? 'speaker' : 'earpiece';

      // Enable proximity sensor for voice calls (dims screen when near ear)
      if (!isVideoCall) {
        InCallManager.setKeepScreenOn(true);
      }

      console.log('[AudioManager] Native audio initialized, route:', state.currentRoute);
      return true;
    } catch (error) {
      console.error('[AudioManager] Failed to initialize native audio:', error);
      state.currentRoute = 'speaker';
      return false;
    }
  }

  // Fallback for Expo Go - just track state
  state.currentRoute = 'speaker';
  console.log('[AudioManager] Running in fallback mode (Expo Go)');
  console.log('[AudioManager] Call audio initialized, route:', state.currentRoute);
  return true;
};

/**
 * Set audio output to speaker
 */
export const setAudioToSpeaker = async (): Promise<boolean> => {
  console.log('[AudioManager] Setting audio to speaker');

  if (state.nativeAvailable && InCallManager) {
    try {
      InCallManager.setSpeakerphoneOn(true);
      console.log('[AudioManager] Native speaker mode enabled');
    } catch (error) {
      console.error('[AudioManager] Failed to set speaker:', error);
    }
  }

  state.currentRoute = 'speaker';
  return true;
};

/**
 * Set audio output to earpiece
 */
export const setAudioToEarpiece = async (): Promise<boolean> => {
  console.log('[AudioManager] Setting audio to earpiece');

  if (state.nativeAvailable && InCallManager) {
    try {
      InCallManager.setSpeakerphoneOn(false);
      console.log('[AudioManager] Native earpiece mode enabled');
    } catch (error) {
      console.error('[AudioManager] Failed to set earpiece:', error);
    }
  }

  state.currentRoute = 'earpiece';
  return true;
};

/**
 * Toggle between speaker and earpiece
 */
export const toggleAudioRoute = async (): Promise<AudioOutputRoute> => {
  const newRoute = state.currentRoute === 'speaker' ? 'earpiece' : 'speaker';

  if (newRoute === 'speaker') {
    await setAudioToSpeaker();
  } else {
    await setAudioToEarpiece();
  }

  return state.currentRoute;
};

/**
 * Get current audio route
 */
export const getCurrentAudioRoute = (): AudioOutputRoute => {
  return state.currentRoute;
};

/**
 * Check if speaker is enabled
 */
export const isSpeakerEnabled = (): boolean => {
  return state.currentRoute === 'speaker';
};

/**
 * Check if native audio routing is available
 */
export const isNativeAudioAvailable = (): boolean => {
  return state.nativeAvailable;
};

/**
 * Cleanup audio mode when call ends
 */
export const cleanupCallAudio = async (): Promise<void> => {
  console.log('[AudioManager] Cleaning up call audio');

  if (state.nativeAvailable && InCallManager) {
    try {
      InCallManager.stop();
      console.log('[AudioManager] Native audio stopped');
    } catch (error) {
      console.error('[AudioManager] Failed to stop InCallManager:', error);
    }
  }

  state.isInitialized = false;
  state.isInCall = false;
  state.currentRoute = 'speaker';
  console.log('[AudioManager] Call audio cleaned up');
};

/**
 * Set microphone mute state
 */
export const setMicrophoneMute = async (muted: boolean): Promise<void> => {
  if (state.nativeAvailable && InCallManager) {
    try {
      InCallManager.setMicrophoneMute(muted);
      console.log('[AudioManager] Microphone mute:', muted);
    } catch (error) {
      console.error('[AudioManager] Failed to set mic mute:', error);
    }
  }
};

/**
 * Turn on/off flashlight (for video calls if needed)
 */
export const setFlashOn = async (enabled: boolean): Promise<void> => {
  if (state.nativeAvailable && InCallManager && Platform.OS === 'android') {
    try {
      InCallManager.setFlashOn(enabled);
    } catch (error) {
      console.error('[AudioManager] Failed to set flash:', error);
    }
  }
};

/**
 * Enhanced audio constraints for WebRTC
 * These provide better audio quality during calls
 */
export const getEnhancedAudioConstraints = () => {
  return {
    echoCancellation: true,
    autoGainControl: true,
    noiseSuppression: true,
    sampleRate: 48000,
    sampleSize: 16,
    channelCount: 1,
    latency: 0.01,
    volume: 1.0,
  };
};

/**
 * Enhanced video constraints for WebRTC video calls
 */
export const getEnhancedVideoConstraints = (quality: 'low' | 'medium' | 'high' = 'medium') => {
  const constraints = {
    low: {
      width: { ideal: 320, max: 480 },
      height: { ideal: 240, max: 360 },
      frameRate: { ideal: 15, max: 24 },
    },
    medium: {
      width: { ideal: 640, max: 1280 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 30 },
    },
    high: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 60 },
    },
  };

  return {
    ...constraints[quality],
    facingMode: 'user',
  };
};

export default {
  initializeCallAudio,
  setAudioToSpeaker,
  setAudioToEarpiece,
  toggleAudioRoute,
  getCurrentAudioRoute,
  isSpeakerEnabled,
  isNativeAudioAvailable,
  cleanupCallAudio,
  setMicrophoneMute,
  setFlashOn,
  getEnhancedAudioConstraints,
  getEnhancedVideoConstraints,
};
