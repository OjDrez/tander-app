import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';
import { getExpirationWarning } from '../../api/chatApi';

interface MatchExpirationBannerProps {
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
}

/**
 * Match Expiration Warning Banner Component
 * SENIOR-FRIENDLY: Larger, clearer warning about match expiration
 * Shows time remaining to start a conversation before the match expires
 */
const MatchExpirationBanner: React.FC<MatchExpirationBannerProps> = ({
  hoursUntilExpiration,
  chatStarted,
}) => {
  const warningMessage = getExpirationWarning(hoursUntilExpiration);

  // Don't show warning if chat has started (match won't expire)
  if (chatStarted || !warningMessage) return null;

  const isUrgent = hoursUntilExpiration !== undefined && hoursUntilExpiration <= 6;

  return (
    <View
      style={[styles.expirationBanner, isUrgent && styles.expirationBannerUrgent]}
      accessibilityRole="alert"
      accessibilityLabel={`Time reminder: ${warningMessage}`}
    >
      <View style={[styles.expirationIconContainer, isUrgent && styles.expirationIconUrgent]}>
        <Ionicons name="time" size={28} color={isUrgent ? colors.white : colors.warning} />
      </View>
      <View style={styles.expirationTextContainer}>
        <AppText size="body" weight="bold" color={isUrgent ? colors.error : colors.textPrimary}>
          {isUrgent ? '⏰ Time running out!' : 'Reminder'}
        </AppText>
        <AppText size="body" color={colors.textPrimary} style={styles.expirationText}>
          {warningMessage}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  expirationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.warningLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },

  expirationBannerUrgent: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },

  expirationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  expirationIconUrgent: {
    backgroundColor: colors.error,
  },

  expirationTextContainer: {
    flex: 1,
    gap: 4,
  },

  expirationText: {
    lineHeight: 24,
  },
});

export default MatchExpirationBanner;
