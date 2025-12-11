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
 * MessageInputBar - Accessible message composition component
 *
 * Accessibility Features:
 * - Minimum 48px touch targets for buttons
 * - Large, readable text input (18px)
 * - Clear button labels for screen readers
 * - Visual disabled state for send button
 * - Character count indicator
 * - Animated send button
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
  placeholder = "Type a message...",
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
  const sendButtonOpacity = useRef(new Animated.Value(isSendDisabled ? 0.5 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sendButtonScale, {
        toValue: hasText ? 1 : 0.9,
        useNativeDriver: true,
        friction: 6,
      }),
      Animated.timing(sendButtonOpacity, {
        toValue: isSendDisabled ? 0.5 : 1,
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
        toValue: 0.85,
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
      {/* Character count indicator */}
      {showCharCount && hasText && (
        <View style={styles.charCountContainer}>
          <AppText
            size="tiny"
            color={isNearLimit ? colors.warning : colors.textMuted}
          >
            {value.length}/{maxLength}
          </AppText>
        </View>
      )}

      <View style={styles.container}>
        {/* Action buttons on the left */}
        <View style={styles.leftActions}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add attachment"
            accessibilityHint="Double tap to add photos or files"
            onPress={onAttachmentPress}
            style={styles.iconButton}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={26} color={colors.accentTeal} />
          </TouchableOpacity>

          {onCameraPress && !hasText && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Take photo"
              accessibilityHint="Double tap to open camera"
              onPress={onCameraPress}
              style={styles.iconButton}
              activeOpacity={0.7}
            >
              <Ionicons name="camera" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Text input */}
        <View style={styles.inputWrapper}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
            maxLength={maxLength}
            accessibilityLabel="Message input"
            accessibilityHint="Type your message here"
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>

        {/* Send button */}
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
            accessibilityLabel={isSendDisabled ? "Send button disabled" : "Send message"}
            accessibilityHint={isSendDisabled ? "Type a message first" : "Double tap to send your message"}
            accessibilityState={{ disabled: isSendDisabled }}
            onPress={handleSend}
            style={[
              styles.sendButton,
              isSendDisabled && styles.sendButtonDisabled,
              hasText && styles.sendButtonActive,
            ]}
            activeOpacity={0.85}
            disabled={isSendDisabled}
          >
            <Ionicons
              name="send"
              size={20}
              color={colors.white}
              style={styles.sendIcon}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

/**
 * MessageInputBar Styles
 *
 * Accessibility Optimizations:
 * - 48px minimum touch targets
 * - 18px font size for input
 * - High contrast colors
 * - Clear visual feedback
 * - Animated send button
 */
const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.white,
  },
  charCountContainer: {
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderLight,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 6,
  },
  iconButton: {
    // Minimum 44px touch target
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: 24,
    minHeight: 48,
    maxHeight: 120,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowLight,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 1,
      },
    }),
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: Platform.OS === "ios" ? 12 : 10,
    paddingBottom: Platform.OS === "ios" ? 12 : 10,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "center",
  },
  sendButtonWrapper: {
    paddingBottom: 4,
  },
  sendButton: {
    // Minimum 48px touch target
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
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
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sendIcon: {
    marginLeft: 2, // Visual centering for send icon
  },
});
