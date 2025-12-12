import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import AppText from '../inputs/AppText';
import colors from '../../config/colors';
import { Match } from '../../types/matching';
import { getFullPhotoUrl } from '../../api/chatApi';

interface MatchListItemProps {
  match: Match;
  onPress: () => void;
  onStartChat: () => void;
}

/**
 * MatchListItem Component
 *
 * Displays a single match in the matches list.
 * Optimized for seniors with:
 * - Large touch targets (56px minimum)
 * - Clear, readable text
 * - Obvious expiration warnings
 * - Easy-to-tap action buttons
 */
export default function MatchListItem({
  match,
  onPress,
  onStartChat,
}: MatchListItemProps) {
  // Convert relative photo URL to full URL, fallback to UI Avatars
  const fullPhotoUrl = getFullPhotoUrl(match.matchedUserProfilePhotoUrl);
  const profilePhoto = fullPhotoUrl
    ? { uri: fullPhotoUrl }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(match.matchedUserDisplayName || 'Match')}&size=200&background=random` };

  // Calculate expiration status
  const isExpiringSoon = match.hoursUntilExpiration !== undefined && match.hoursUntilExpiration <= 24;
  const isExpired = match.status === 'EXPIRED';
  const chatStarted = match.chatStarted || match.status === 'CHAT_STARTED';

  // Format expiration text
  const getExpirationText = () => {
    if (chatStarted) return null;
    if (isExpired) return 'Expired';
    if (match.hoursUntilExpiration === undefined) return null;

    if (match.hoursUntilExpiration < 1) {
      return 'Expires soon!';
    } else if (match.hoursUntilExpiration < 24) {
      return `${Math.round(match.hoursUntilExpiration)}h left`;
    } else {
      const days = Math.floor(match.hoursUntilExpiration / 24);
      return `${days}d left`;
    }
  };

  const expirationText = getExpirationText();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isExpiringSoon && !chatStarted && styles.containerExpiring,
        isExpired && styles.containerExpired,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Match with ${match.matchedUserDisplayName}${expirationText ? `, ${expirationText}` : ''}`}
      accessibilityHint="Double tap to view profile"
    >
      {/* Profile Photo */}
      <TouchableOpacity
        style={styles.avatarContainer}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <Image source={profilePhoto} style={styles.avatar} />
        {chatStarted && (
          <View style={styles.chatBadge}>
            <Ionicons name="chatbubble" size={12} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>

      {/* Match Info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameRow}>
          <AppText weight="semibold" size="h4" numberOfLines={1} style={styles.name}>
            {match.matchedUserDisplayName}
          </AppText>
          {match.matchedUserAge && (
            <AppText size="body" color={colors.textSecondary}>
              , {match.matchedUserAge}
            </AppText>
          )}
        </View>

        {match.matchedUserLocation && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <AppText size="small" color={colors.textSecondary} numberOfLines={1}>
              {match.matchedUserLocation}
            </AppText>
          </View>
        )}

        {/* Expiration Warning or Chat Status */}
        {expirationText && !chatStarted && (
          <View style={[
            styles.expirationRow,
            isExpiringSoon && styles.expirationRowUrgent,
          ]}>
            <Ionicons
              name="time-outline"
              size={14}
              color={isExpiringSoon ? colors.danger : colors.textSecondary}
            />
            <AppText
              size="small"
              color={isExpiringSoon ? colors.danger : colors.textSecondary}
              weight={isExpiringSoon ? 'semibold' : 'normal'}
            >
              {expirationText}
            </AppText>
          </View>
        )}

        {chatStarted && (
          <View style={styles.chatStartedRow}>
            <MaterialCommunityIcons name="message-check" size={14} color={colors.success} />
            <AppText size="small" color={colors.success}>
              Chat started
            </AppText>
          </View>
        )}
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          chatStarted ? styles.actionButtonChat : styles.actionButtonMessage,
        ]}
        onPress={onStartChat}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={chatStarted ? 'Continue chat' : 'Start chatting'}
      >
        <Ionicons
          name={chatStarted ? 'chatbubble' : 'chatbubble-outline'}
          size={24}
          color={chatStarted ? colors.white : colors.accentTeal}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  containerExpiring: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  containerExpired: {
    opacity: 0.6,
    borderColor: colors.borderMedium,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.borderMedium,
  },
  chatBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  name: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expirationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  expirationRowUrgent: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  chatStartedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  actionButton: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonMessage: {
    backgroundColor: colors.accentMint,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },
  actionButtonChat: {
    backgroundColor: colors.accentTeal,
  },
});
