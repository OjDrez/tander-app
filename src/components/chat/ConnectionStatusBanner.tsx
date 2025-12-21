import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';

interface ConnectionStatusBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

/**
 * Connection Status Banner Component
 * SENIOR-FRIENDLY: Larger, clearer messaging about connection status
 * Shows offline state and pending message count
 */
const ConnectionStatusBanner: React.FC<ConnectionStatusBannerProps> = ({
  isOnline,
  pendingCount,
}) => {
  const slideAnim = useRef(new Animated.Value(isOnline ? -80 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline && pendingCount === 0 ? -80 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isOnline, pendingCount, slideAnim]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.connectionBanner,
        { transform: [{ translateY: slideAnim }] },
        !isOnline ? styles.offlineBanner : styles.pendingBanner,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={
        !isOnline
          ? 'You are offline. Your messages will be sent when you reconnect to the internet.'
          : `${pendingCount} messages are waiting to be sent.`
      }
    >
      <View style={styles.connectionIconContainer}>
        <Ionicons
          name={!isOnline ? 'cloud-offline' : 'time-outline'}
          size={28}
          color={colors.white}
        />
      </View>
      <View style={styles.connectionTextContainer}>
        <AppText size="body" weight="bold" color={colors.white}>
          {!isOnline ? "You're offline" : 'Sending messages...'}
        </AppText>
        <AppText size="body" weight="medium" color={colors.white}>
          {!isOnline
            ? "Messages will send when you're back online"
            : `${pendingCount} message${pendingCount > 1 ? 's' : ''} waiting`}
        </AppText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },

  connectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectionTextContainer: {
    flex: 1,
    gap: 4,
  },

  offlineBanner: {
    backgroundColor: colors.textSecondary,
  },

  pendingBanner: {
    backgroundColor: colors.accentTeal,
  },
});

export default ConnectionStatusBanner;
