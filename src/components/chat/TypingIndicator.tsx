import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';

interface TypingIndicatorProps {
  isTyping: boolean;
  typingUsername: string | null;
  otherUserName: string;
}

/**
 * Typing Indicator Component
 * SENIOR-FRIENDLY: Larger and clearer typing indicator
 * Shows when the other user is typing a message
 */
const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  isTyping,
  typingUsername,
  otherUserName,
}) => {
  if (!isTyping) return null;

  // FIXED: Explicit null check for typingUsername
  const displayName = typingUsername !== null && typingUsername !== ''
    ? typingUsername
    : otherUserName;

  return (
    <View style={styles.typingIndicatorLarge}>
      <View style={styles.typingDots}>
        <View style={[styles.typingDot, styles.typingDot1]} />
        <View style={[styles.typingDot, styles.typingDot2]} />
        <View style={[styles.typingDot, styles.typingDot3]} />
      </View>
      <AppText size="body" weight="medium" color={colors.textPrimary}>
        {displayName} is typing a message...
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  typingIndicatorLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.accentMint,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },

  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  typingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentTeal,
  },

  typingDot1: {
    opacity: 0.4,
  },

  typingDot2: {
    opacity: 0.6,
  },

  typingDot3: {
    opacity: 0.8,
  },
});

export default TypingIndicator;
