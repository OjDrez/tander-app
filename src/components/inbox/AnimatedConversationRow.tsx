import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '@/src/config/colors';
import AppText from '@/src/components/inputs/AppText';
import { ConversationPreview } from '@/src/types/chat';

/**
 * Props for AnimatedConversationRow component
 */
export interface AnimatedConversationRowProps {
  item: ConversationPreview;
  index: number;
  onPress: () => void;
  onAvatarPress: () => void;
  onVideoCall: () => void;
  onVoiceCall: () => void;
  isOnline: boolean;
}

/**
 * Animated conversation row component for the inbox
 * SENIOR-FRIENDLY: Large touch targets, clear text, simple layout
 *
 * Extracted from InboxScreen for better maintainability and performance
 */
const AnimatedConversationRow = memo(function AnimatedConversationRow({
  item,
  index,
  onPress,
  onAvatarPress,
  onVideoCall,
  onVoiceCall,
  isOnline,
}: AnimatedConversationRowProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]);

    animation.start();

    // Cleanup: stop animation on unmount
    return () => {
      animation.stop();
    };
  }, [fadeAnim, slideAnim, index]);

  const hasUnread = (item.unreadCount ?? 0) > 0;

  return (
    <Animated.View
      style={[
        styles.threadCard,
        hasUnread && styles.threadCardUnread,
        Platform.OS === 'ios' ? styles.iosShadow : styles.androidShadow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.threadTouchable}
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${item.name}${hasUnread ? `. You have ${item.unreadCount} new message${(item.unreadCount ?? 0) > 1 ? 's' : ''}` : ''}${isOnline ? '. They are online now' : ''}`}
        accessibilityHint="Tap to read and reply to messages"
      >
        {/* Large avatar with online status */}
        <TouchableOpacity
          style={[
            styles.avatarWrapper,
            Platform.OS === 'ios' ? styles.iosShadow : styles.androidShadow,
          ]}
          activeOpacity={0.7}
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name}'s profile photo`}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          {isOnline && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </TouchableOpacity>

        {/* Name and message preview */}
        <View style={styles.threadBody}>
          <View style={styles.threadTopRow}>
            <View style={styles.nameRow}>
              <AppText size="h3" weight="bold" numberOfLines={1} style={styles.name}>
                {item.name}
              </AppText>
              {isOnline && (
                <AppText
                  size="body"
                  weight="bold"
                  color={colors.success}
                  style={styles.onlineText}
                >
                  Online
                </AppText>
              )}
            </View>
            <AppText size="body" color={colors.textSecondary} weight="medium">
              {item.timestamp}
            </AppText>
          </View>

          <AppText
            size="body"
            color={hasUnread ? colors.textPrimary : colors.textSecondary}
            weight={hasUnread ? 'bold' : 'normal'}
            numberOfLines={2}
            style={styles.preview}
          >
            {hasUnread ? '● ' : ''}
            {item.message}
          </AppText>

          {/* Unread count badge - more prominent */}
          {hasUnread && (
            <View style={styles.unreadRow}>
              <View style={styles.unreadBadgeLarge}>
                <AppText size="body" weight="bold" color={colors.white}>
                  {item.unreadCount} NEW
                </AppText>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Call buttons - larger and clearly labeled */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.callButtonLarge}
          onPress={onVoiceCall}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Call ${item.name}`}
          accessibilityHint="Tap to make a voice call"
        >
          <Ionicons name="call" size={24} color={colors.primary} />
          <AppText size="body" weight="bold" color={colors.primary}>
            Call
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButtonLarge, styles.videoCallButtonLarge]}
          onPress={onVideoCall}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Video call ${item.name}`}
          accessibilityHint="Tap to make a video call"
        >
          <Ionicons name="videocam" size={24} color={colors.white} />
          <AppText size="body" weight="bold" color={colors.white}>
            Video
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Message ${item.name}`}
        >
          <Ionicons name="chatbubble" size={24} color={colors.accentTeal} />
          <AppText size="body" weight="bold" color={colors.accentTeal}>
            Message
          </AppText>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

/**
 * Styles for AnimatedConversationRow - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Minimum touch targets of 56x56px (larger than standard 48px)
 * - Large, readable fonts (minimum 18px)
 * - High contrast colors with clear visual hierarchy
 * - Generous spacing between interactive elements
 * - Clear labels on all buttons (icons + text)
 */
const styles = StyleSheet.create({
  // Thread card - much larger and clearer
  threadCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    overflow: 'hidden',
    gap: 16,
  },
  threadCardUnread: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.accentPeach,
  },
  threadTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  // Avatar - much larger
  avatarWrapper: {
    height: 80,
    width: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: colors.borderMedium,
    position: 'relative',
  },
  avatar: {
    height: '100%',
    width: '100%',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  onlineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
  },

  // Thread body - larger text
  threadBody: {
    flex: 1,
    gap: 10,
  },
  threadTopRow: {
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 22,
  },
  onlineText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.successLight,
    borderRadius: 10,
    overflow: 'hidden',
  },
  preview: {
    lineHeight: 26,
    fontSize: 17,
  },
  unreadRow: {
    marginTop: 8,
  },
  unreadBadgeLarge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  // Action buttons row - large labeled buttons
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
    marginTop: 4,
  },
  callButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  videoCallButtonLarge: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentMint,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },

  // Shadows
  iosShadow: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  androidShadow: {
    elevation: 4,
  },
});

export default AnimatedConversationRow;
