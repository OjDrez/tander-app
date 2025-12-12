import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  Animated,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

import AppText from '../inputs/AppText';
import GradientButton from '../buttons/GradientButton';
import colors from '../../config/colors';
import { SwipeResponse } from '../../types/matching';
import { getFullPhotoUrl } from '../../api/chatApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MatchCelebrationModalProps {
  visible: boolean;
  matchData: SwipeResponse | null;
  onSendMessage: () => void;
  onKeepBrowsing: () => void;
}

/**
 * MatchCelebrationModal
 *
 * A celebratory modal shown when two users match.
 * Designed for seniors with:
 * - Large, clear text
 * - Obvious action buttons
 * - Celebratory but not overwhelming animation
 * - Clear next steps
 */
export default function MatchCelebrationModal({
  visible,
  matchData,
  onSendMessage,
  onKeepBrowsing,
}: MatchCelebrationModalProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const heartScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      heartScale.setValue(0);

      // Animate in
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 6,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(heartScale, {
          toValue: 1,
          friction: 4,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!matchData) return null;

  // Convert relative photo URL to full URL, fallback to UI Avatars
  const fullPhotoUrl = getFullPhotoUrl(matchData.matchedUserProfilePhotoUrl);
  const profilePhoto = fullPhotoUrl
    ? { uri: fullPhotoUrl }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(matchData.matchedUserDisplayName || 'Match')}&size=200&background=random` };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(245,161,75,0.95)', 'rgba(51,169,162,0.95)']}
          style={styles.gradient}
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ scale: scaleAnim }],
                opacity: opacityAnim,
              },
            ]}
          >
            {/* Heart Animation */}
            <Animated.View
              style={[
                styles.heartContainer,
                { transform: [{ scale: heartScale }] },
              ]}
            >
              <View style={styles.heartBackground}>
                <Ionicons name="heart" size={48} color={colors.primary} />
              </View>
            </Animated.View>

            {/* Title */}
            <AppText size="h1" weight="bold" color={colors.white} style={styles.title}>
              It's a Match!
            </AppText>

            <AppText size="body" color={colors.white} style={styles.subtitle}>
              You and {matchData.matchedUserDisplayName} have liked each other
            </AppText>

            {/* Profile Photo */}
            <View style={styles.photoContainer}>
              <Image source={profilePhoto} style={styles.profilePhoto} />
              <View style={styles.photoOverlay}>
                <AppText weight="semibold" size="h4" color={colors.white}>
                  {matchData.matchedUserDisplayName}
                </AppText>
              </View>
            </View>

            {/* Expiration Notice */}
            {matchData.expiresAt && (
              <View style={styles.expirationNotice}>
                <Ionicons name="time-outline" size={20} color={colors.white} />
                <AppText size="small" color={colors.white}>
                  Start chatting before your match expires!
                </AppText>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <GradientButton
                title="Send a Message"
                onPress={onSendMessage}
                style={styles.messageButton}
                textStyle={styles.messageButtonText}
              />

              <TouchableOpacity
                style={styles.keepBrowsingButton}
                onPress={onKeepBrowsing}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Keep browsing profiles"
              >
                <AppText size="body" weight="semibold" color={colors.white}>
                  Keep Browsing
                </AppText>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  heartContainer: {
    marginBottom: 20,
  },
  heartBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
    fontSize: 18,
    lineHeight: 26,
  },
  photoContainer: {
    width: 180,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  profilePhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    alignItems: 'center',
  },
  expirationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  messageButton: {
    width: '100%',
    height: 60,
    borderRadius: 16,
  },
  messageButtonText: {
    fontSize: 18,
  },
  keepBrowsingButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
