/**
 * Call Ended Overlay Component
 * Shows call summary and optional rating prompt after call ends
 * Works with Expo Go
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import * as Haptics from 'expo-haptics';

interface CallEndedOverlayProps {
  visible: boolean;
  callDuration: number; // in seconds
  callType: 'audio' | 'video';
  userName: string;
  endReason: 'completed' | 'declined' | 'missed' | 'failed' | 'network_error';
  onDismiss: () => void;
  onRateCall?: (rating: number) => void;
  onReportIssue?: () => void;
}

/**
 * Format call duration as MM:SS or HH:MM:SS
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get message based on end reason
 */
const getEndMessage = (reason: CallEndedOverlayProps['endReason'], duration: number): string => {
  switch (reason) {
    case 'completed':
      return duration > 0 ? `Call ended • ${formatDuration(duration)}` : 'Call ended';
    case 'declined':
      return 'Call declined';
    case 'missed':
      return 'Call not answered';
    case 'failed':
      return 'Call failed';
    case 'network_error':
      return 'Call ended due to network issues';
    default:
      return 'Call ended';
  }
};

export default function CallEndedOverlay({
  visible,
  callDuration,
  callType,
  userName,
  endReason,
  onDismiss,
  onRateCall,
  onReportIssue,
}: CallEndedOverlayProps) {
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [showThankYou, setShowThankYou] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
      setSelectedRating(0);
      setShowThankYou(false);
    }
  }, [visible, fadeAnim]);

  const handleRating = useCallback((rating: number) => {
    setSelectedRating(rating);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmitRating = useCallback(() => {
    if (selectedRating > 0 && onRateCall) {
      onRateCall(selectedRating);
      setShowThankYou(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Auto dismiss after showing thank you
      setTimeout(() => {
        onDismiss();
      }, 1500);
    }
  }, [selectedRating, onRateCall, onDismiss]);

  const handleSkip = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Only show rating for completed calls that lasted more than 10 seconds
  const showRating = endReason === 'completed' && callDuration >= 10 && onRateCall;

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Call summary */}
          <View style={styles.summarySection}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={callType === 'video' ? 'videocam' : 'call'}
                size={32}
                color={colors.white}
              />
            </View>

            <AppText size="h3" weight="bold" color={colors.white} style={styles.userName}>
              {userName}
            </AppText>

            <AppText size="body" color="rgba(255,255,255,0.8)" style={styles.endMessage}>
              {getEndMessage(endReason, callDuration)}
            </AppText>
          </View>

          {/* Rating section - only for completed calls */}
          {showRating && !showThankYou && (
            <View style={styles.ratingSection}>
              <AppText size="body" weight="semibold" color={colors.white} style={styles.ratingTitle}>
                How was the call quality?
              </AppText>

              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => handleRating(star)}
                    style={styles.starButton}
                    accessibilityLabel={`Rate ${star} stars`}
                  >
                    <Ionicons
                      name={star <= selectedRating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= selectedRating ? colors.warning : 'rgba(255,255,255,0.5)'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.ratingActions}>
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                  <AppText size="body" color="rgba(255,255,255,0.6)">
                    Skip
                  </AppText>
                </TouchableOpacity>

                {selectedRating > 0 && (
                  <TouchableOpacity style={styles.submitButton} onPress={handleSubmitRating}>
                    <AppText size="body" weight="semibold" color={colors.white}>
                      Submit
                    </AppText>
                  </TouchableOpacity>
                )}
              </View>

              {/* Report issue link for low ratings */}
              {selectedRating > 0 && selectedRating <= 2 && onReportIssue && (
                <TouchableOpacity style={styles.reportLink} onPress={onReportIssue}>
                  <Ionicons name="flag-outline" size={16} color="rgba(255,255,255,0.6)" />
                  <AppText size="small" color="rgba(255,255,255,0.6)">
                    Report an issue
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Thank you message after rating */}
          {showThankYou && (
            <View style={styles.thankYouSection}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <AppText size="body" color={colors.white} style={styles.thankYouText}>
                Thanks for your feedback!
              </AppText>
            </View>
          )}

          {/* Simple dismiss button for non-rated calls */}
          {!showRating && !showThankYou && (
            <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
              <AppText size="body" weight="semibold" color={colors.white}>
                Done
              </AppText>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  summarySection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  userName: {
    textAlign: 'center',
    marginBottom: 8,
  },
  endMessage: {
    textAlign: 'center',
  },
  ratingSection: {
    width: '100%',
    alignItems: 'center',
  },
  ratingTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  starButton: {
    padding: 4,
  },
  ratingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 24,
  },
  reportLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingVertical: 8,
  },
  thankYouSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  thankYouText: {
    marginTop: 12,
  },
  dismissButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    backgroundColor: colors.primary,
    borderRadius: 24,
    marginTop: 8,
  },
});
