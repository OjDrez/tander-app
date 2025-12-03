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
        onPress={onAttachmentPress}
        style={styles.iconButton}
        activeOpacity={0.85}
      >
        <Ionicons name="attach" size={18} color={colors.textSecondary} />
      </TouchableOpacity>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
      />

      <TouchableOpacity
        accessibilityRole="button"
        onPress={onSend}
        style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]}
        activeOpacity={0.9}
        disabled={isSendDisabled}
      >
        <Ionicons
          name="send"
          size={18}
          color={isSendDisabled ? colors.textMuted : colors.white}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderMedium,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 24,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.textPrimary,
    textAlignVertical: "center",
  },
  sendButton: {
    height: 46,
    width: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderLight,
    shadowOpacity: 0,
    elevation: 0,
  },
});
