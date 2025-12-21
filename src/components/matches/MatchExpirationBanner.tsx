import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';

/**
 * MatchExpirationBanner - Senior Friendly
 *
 * A prominent banner to show when a match is about to expire.
 * Features:
 * - Large, readable text
 * - Clear countdown
 * - High contrast colors for urgency
 * - Easy-to-tap action button
 */

interface MatchExpirationBannerProps {
  matchedUserName: string;
  hoursRemaining: number;
  onPress: () => void;
  onDismiss?: () => void;
}

export default function MatchExpirationBanner({
  matchedUserName,
  hoursRemaining,
  onPress,
  onDismiss,
}: MatchExpirationBannerProps) {
  const [pulseAnim] = useState(new Animated.Value(1));
  const isUrgent = hoursRemaining < 6;
  const isVeryUrgent = hoursRemaining < 2;

  // Pulse animation for urgent matches
  useEffect(() => {
    if (isUrgent) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isUrgent, pulseAnim]);

  // Format time remaining in a clear way for seniors
  const formatTimeRemaining = (): string => {
    if (hoursRemaining < 1) {
      const minutes = Math.ceil(hoursRemaining * 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    const hours = Math.ceil(hoursRemaining);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  // Get urgency message
  const getUrgencyMessage = (): string => {
    if (isVeryUrgent) {
      return 'ACT NOW!';
    }
    if (isUrgent) {
      return 'Time is running out!';
    }
    return 'Expiring soon';
  };

  // Get background color based on urgency
  const getBackgroundColor = () => {
    if (isVeryUrgent) return colors.danger;
    if (isUrgent) return colors.warning;
    return colors.warningLight;
  };

  const getBorderColor = () => {
    if (isVeryUrgent) return colors.danger;
    if (isUrgent) return colors.warning;
    return colors.warning;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      {/* Dismiss button */}
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss this alert"
        >
          <Ionicons
            name="close"
            size={24}
            color={isVeryUrgent ? colors.white : colors.textPrimary}
          />
        </TouchableOpacity>
      )}

      {/* Icon */}
      <View style={styles.iconContainer}>
        <Ionicons
          name={isVeryUrgent ? 'warning' : 'time'}
          size={40}
          color={isVeryUrgent ? colors.white : colors.warning}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <AppText
          size="body"
          weight="bold"
          color={isVeryUrgent ? colors.white : colors.textPrimary}
          style={styles.urgencyText}
        >
          {getUrgencyMessage()}
        </AppText>

        <AppText
          size="h4"
          weight="semibold"
          color={isVeryUrgent ? colors.white : colors.textPrimary}
          style={styles.mainText}
        >
          Your match with {matchedUserName} expires in{' '}
          <AppText weight="bold" color={isVeryUrgent ? colors.white : colors.danger}>
            {formatTimeRemaining()}
          </AppText>
        </AppText>

        <AppText
          size="body"
          color={isVeryUrgent ? 'rgba(255,255,255,0.9)' : colors.textSecondary}
          style={styles.helpText}
        >
          Send a message to keep this connection!
        </AppText>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          isVeryUrgent && styles.actionButtonUrgent,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Send message to ${matchedUserName}`}
        accessibilityHint="Tap to open the conversation"
      >
        <Ionicons
          name="chatbubble"
          size={24}
          color={isVeryUrgent ? colors.danger : colors.white}
        />
        <AppText
          size="body"
          weight="bold"
          color={isVeryUrgent ? colors.danger : colors.white}
        >
          Say Hello!
        </AppText>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 20,
    borderWidth: 3,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  dismissButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  content: {
    alignItems: 'center',
    marginBottom: 16,
  },
  urgencyText: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainText: {
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  helpText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accentTeal,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minHeight: 56, // Senior-friendly touch target
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButtonUrgent: {
    backgroundColor: colors.white,
  },
});
