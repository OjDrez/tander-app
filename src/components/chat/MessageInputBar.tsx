import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  GestureResponderEvent,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * MessageInputBar - Accessible message composition component
 *
 * Accessibility Features:
 * - Minimum 48px touch targets for buttons
 * - Large, readable text input (18px)
 * - Clear button labels for screen readers
 * - Visual disabled state for send button
 */
type MessageInputBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (event?: GestureResponderEvent) => void;
  placeholder?: string;
  onAttachmentPress?: () => void;
  disabled?: boolean;
};

export default function MessageInputBar({
  value,
  onChangeText,
  onSend,
  placeholder = "Type a message...",
  onAttachmentPress,
  disabled = false,
}: MessageInputBarProps) {
  const isSendDisabled = disabled || value.trim().length === 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Add attachment"
        accessibilityHint="Double tap to add photos or files"
        onPress={onAttachmentPress}
        style={styles.iconButton}
        activeOpacity={0.85}
      >
        <Ionicons name="attach" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        accessibilityLabel="Message input"
        accessibilityHint="Type your message here"
        allowFontScaling={true}
        maxFontSizeMultiplier={1.3}
      />

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={isSendDisabled ? "Send button disabled" : "Send message"}
        accessibilityHint={isSendDisabled ? "Type a message first" : "Double tap to send your message"}
        accessibilityState={{ disabled: isSendDisabled }}
        onPress={onSend}
        style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
        activeOpacity={0.85}
        disabled={isSendDisabled}
      >
        <Ionicons
          name="send"
          size={22}
          color={isSendDisabled ? colors.textMuted : colors.white}
        />
      </TouchableOpacity>
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
 */
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderMedium,
  },
  iconButton: {
    // Minimum 48px touch target
    height: 48,
    width: 48,
    borderRadius: 18,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 52, // Increased for larger text
    maxHeight: 140,
    borderRadius: 26,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 20,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 18, // Larger font for readability
    lineHeight: 24,
    textAlignVertical: "center",
  },
  sendButton: {
    // Minimum 48px touch target
    height: 52,
    width: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
});
