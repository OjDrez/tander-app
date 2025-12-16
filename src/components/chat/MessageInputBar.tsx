import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useEffect } from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AppText from "@/src/components/inputs/AppText";

/**
 * MessageInputBar - SENIOR-FRIENDLY Message Input Component
 *
 * Design Principles for Elderly Users:
 * - Very large touch targets (64px minimum)
 * - Extra large, readable text input (20px)
 * - Labeled buttons (icons + text)
 * - Clear placeholder text
 * - High contrast colors
 * - Simple, uncluttered layout
 * - Clear visual feedback
 */
type MessageInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (event?: GestureResponderEvent) => void;
  placeholder?: string;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  disabled?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
};

export default function MessageInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = "Type your message here...",
  onAttachmentPress,
  onCameraPress,
  disabled = false,
  maxLength = 1000,
  showCharCount = false,
}: MessageInputBarProps) {
  const isSendDisabled = disabled || value.trim().length === 0;
  const hasText = value.length > 0;
  const isNearLimit = maxLength && value.length > maxLength * 0.9;

  // Animation for send button
  const sendButtonScale = useRef(new Animated.Value(1)).current;
  const sendButtonOpacity = useRef(new Animated.Value(isSendDisabled ? 0.6 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sendButtonScale, {
        toValue: hasText ? 1 : 0.95,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(sendButtonOpacity, {
        toValue: isSendDisabled ? 0.6 : 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [hasText, isSendDisabled, sendButtonScale, sendButtonOpacity]);

  const handleSend = () => {
    if (isSendDisabled) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(sendButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(sendButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 4,
      }),
    ]).start();

    onSend();
  };

  return (
    <View style={styles.wrapper}>
      {/* Helpful hint for seniors */}
      <View style={styles.hintContainer}>
        <AppText size="small" color={colors.textSecondary}>
          {hasText ? "Tap the Send button when ready" : "Type your message below"}
        </AppText>
        {/* Character count - SENIOR-FRIENDLY: Larger text */}
        {showCharCount && hasText && (
          <AppText
            size="small"
            weight="medium"
            color={isNearLimit ? colors.warning : colors.textMuted}
          >
            {value.length} / {maxLength} characters
          </AppText>
        )}
      </View>

      {/* Text input area - SENIOR-FRIENDLY: Large and prominent */}
      <View style={styles.inputArea}>
        <View style={styles.inputWrapper}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={maxLength}
            accessibilityLabel="Type your message"
            accessibilityHint="Enter your message in this text box"
            allowFontScaling={true}
            maxFontSizeMultiplier={1.5}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Action buttons - SENIOR-FRIENDLY: Large labeled buttons in a row */}
      <View style={styles.actionsContainer}>
        {/* Attachment button */}
        {onAttachmentPress && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add a photo"
            accessibilityHint="Tap to add a photo to your message"
            onPress={onAttachmentPress}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="image" size={26} color={colors.accentTeal} />
            <AppText size="small" weight="semibold" color={colors.accentTeal}>
              Photo
            </AppText>
          </TouchableOpacity>
        )}

        {/* Camera button */}
        {onCameraPress && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Take a photo"
            accessibilityHint="Tap to open the camera"
            onPress={onCameraPress}
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <Ionicons name="camera" size={26} color={colors.textSecondary} />
            <AppText size="small" weight="semibold" color={colors.textSecondary}>
              Camera
            </AppText>
          </TouchableOpacity>
        )}

        {/* Spacer to push send button to the right */}
        <View style={styles.spacer} />

        {/* Send button - SENIOR-FRIENDLY: Large with label */}
        <Animated.View
          style={[
            styles.sendButtonWrapper,
            {
              transform: [{ scale: sendButtonScale }],
              opacity: sendButtonOpacity,
            },
          ]}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isSendDisabled ? "Send button - type a message first" : "Send your message"}
            accessibilityHint={isSendDisabled ? "You need to type something before you can send" : "Tap to send your message"}
            accessibilityState={{ disabled: isSendDisabled }}
            onPress={handleSend}
            style={[
              styles.sendButton,
              isSendDisabled && styles.sendButtonDisabled,
              hasText && styles.sendButtonActive,
            ]}
            activeOpacity={0.7}
            disabled={isSendDisabled}
          >
            <Ionicons
              name="send"
              size={24}
              color={colors.white}
            />
            <AppText size="body" weight="bold" color={colors.white}>
              Send
            </AppText>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * MessageInputBar Styles - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Minimum 56px touch targets (larger than standard)
 * - 20px font size for input text
 * - High contrast colors
 * - Labeled buttons (not just icons)
 * - Clear visual feedback
 * - Simple, vertical layout
 * - Generous spacing
 */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },

  // Hint text container
  hintContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },

  // Input area - SENIOR-FRIENDLY: Large, prominent
  inputArea: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },
  inputWrapper: {
    minHeight: 80,
    maxHeight: 160,
  },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 16 : 14,
    paddingBottom: Platform.OS === "ios" ? 16 : 14,
    color: colors.textPrimary,
    fontSize: 20,
    lineHeight: 28,
    textAlignVertical: "top",
  },

  // Actions container - SENIOR-FRIENDLY: Large labeled buttons
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
  },

  // Action buttons - SENIOR-FRIENDLY: Large with labels
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },

  spacer: {
    flex: 1,
  },

  // Send button - SENIOR-FRIENDLY: Large, prominent, labeled
  sendButtonWrapper: {
    // No extra padding needed
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 64,
    paddingHorizontal: 28,
    borderRadius: 20,
    backgroundColor: colors.textMuted,
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderMedium,
  },
  sendButtonActive: {
    backgroundColor: colors.accentTeal,
    ...Platform.select({
      ios: {
        shadowColor: colors.accentTeal,
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
});
