/**
 * Call Sounds Manager
 * Handles ringtones and call sounds using expo-av
 * Works in both Expo Go and development builds
 */

import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Sound types
export type CallSoundType =
  | 'incoming_ring'
  | 'outgoing_ring'
  | 'call_connected'
  | 'call_ended'
  | 'call_busy'
  | 'call_failed';

// Sound state
interface SoundState {
  sound: Audio.Sound | null;
  isLoaded: boolean;
  isPlaying: boolean;
}

// Current playing sound
let currentSound: SoundState = {
  sound: null,
  isLoaded: false,
  isPlaying: false,
};

// Vibration interval for incoming calls
let vibrationInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize audio mode for calls
 * Sets up audio session for voice/video calls
 */
export async function initializeCallAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    console.log('[CallSounds] Audio mode initialized');
  } catch (error) {
    console.error('[CallSounds] Error initializing audio mode:', error);
  }
}

/**
 * Play a call sound
 * Uses system sounds or bundled audio files
 */
export async function playCallSound(type: CallSoundType): Promise<void> {
  try {
    // Stop any currently playing sound
    await stopCallSound();

    // Get sound source
    const soundSource = getSoundSource(type);
    if (!soundSource) {
      console.log('[CallSounds] No sound source for type:', type);
      return;
    }

    // Create and load the sound
    const { sound } = await Audio.Sound.createAsync(
      soundSource,
      {
        isLooping: type === 'incoming_ring' || type === 'outgoing_ring',
        volume: 1.0,
      }
    );

    currentSound = {
      sound,
      isLoaded: true,
      isPlaying: true,
    };

    // Play the sound
    await sound.playAsync();

    // For incoming ring, also start haptic feedback
    if (type === 'incoming_ring') {
      startVibrationPattern();
    }

    // Set up playback status listener
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (status.isLoaded && status.didJustFinish) {
        currentSound.isPlaying = false;
        // Non-looping sounds auto-cleanup
        if (type !== 'incoming_ring' && type !== 'outgoing_ring') {
          cleanupSound();
        }
      }
    });

    console.log('[CallSounds] Playing sound:', type);
  } catch (error) {
    console.error('[CallSounds] Error playing sound:', error);
  }
}

/**
 * Stop any currently playing call sound
 */
export async function stopCallSound(): Promise<void> {
  try {
    stopVibrationPattern();

    if (currentSound.sound && currentSound.isLoaded) {
      await currentSound.sound.stopAsync();
      await currentSound.sound.unloadAsync();
      console.log('[CallSounds] Sound stopped');
    }

    currentSound = {
      sound: null,
      isLoaded: false,
      isPlaying: false,
    };
  } catch (error) {
    console.error('[CallSounds] Error stopping sound:', error);
    // Reset state anyway
    currentSound = {
      sound: null,
      isLoaded: false,
      isPlaying: false,
    };
  }
}

/**
 * Play a short haptic feedback
 */
export async function playHapticFeedback(
  type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'medium'
): Promise<void> {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
    }
  } catch (error) {
    // Haptics may not be available on all devices
    console.log('[CallSounds] Haptics not available:', error);
  }
}

/**
 * Start vibration pattern for incoming calls
 */
function startVibrationPattern(): void {
  stopVibrationPattern();

  // Vibrate immediately
  playHapticFeedback('heavy');

  // Then vibrate every 2 seconds
  vibrationInterval = setInterval(() => {
    playHapticFeedback('heavy');
  }, 2000);
}

/**
 * Stop vibration pattern
 */
function stopVibrationPattern(): void {
  if (vibrationInterval) {
    clearInterval(vibrationInterval);
    vibrationInterval = null;
  }
}

/**
 * Cleanup sound resources
 */
async function cleanupSound(): Promise<void> {
  try {
    if (currentSound.sound) {
      await currentSound.sound.unloadAsync();
    }
  } catch (error) {
    console.error('[CallSounds] Error cleaning up sound:', error);
  }
  currentSound = {
    sound: null,
    isLoaded: false,
    isPlaying: false,
  };
}

/**
 * Get sound source for a given type
 * Returns require() for bundled sounds or null if not available
 *
 * Note: In a real app, you would bundle actual audio files.
 * For now, we'll use placeholder/system sounds when available.
 */
function getSoundSource(type: CallSoundType): any {
  // For Expo Go compatibility, we can't easily bundle custom sounds
  // Instead, we'll use haptic feedback as the primary notification
  // In a production app with dev client, you would add actual sound files

  // Return null - sounds will be simulated with haptics
  // In production, you would return:
  // switch (type) {
  //   case 'incoming_ring':
  //     return require('../assets/sounds/incoming_ring.mp3');
  //   case 'outgoing_ring':
  //     return require('../assets/sounds/outgoing_ring.mp3');
  //   // etc.
  // }
  return null;
}

/**
 * Check if sounds are currently playing
 */
export function isSoundPlaying(): boolean {
  return currentSound.isPlaying;
}

/**
 * Reset audio mode when call ends
 */
export async function resetAudioMode(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
    console.log('[CallSounds] Audio mode reset');
  } catch (error) {
    console.error('[CallSounds] Error resetting audio mode:', error);
  }
}

export default {
  initializeCallAudioMode,
  playCallSound,
  stopCallSound,
  playHapticFeedback,
  isSoundPlaying,
  resetAudioMode,
};
