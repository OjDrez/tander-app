import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/**
 * MessageBubble - Chat message display component
 *
 * Accessibility Features:
 * - Large, readable text (body size - 18px)
 * - High contrast colors
 * - Larger status icons (16px)
 * - Increased padding for visual comfort
 * - Clear visual distinction between sent and received messages
 */
type MessageBubbleProps = {
  text: string;
  time: string;
  isOwn?: boolean;
  status?: MessageStatus;
};

const StatusIcon = ({ status }: { status?: MessageStatus }) => {
  if (!status) return null;

  const getStatusLabel = () => {
    switch (status) {
      case "sending":
        return "Sending";
      case "sent":
        return "Sent";
      case "delivered":
        return "Delivered";
      case "read":
        return "Read";
      case "failed":
        return "Failed to send";
      default:
        return "";
    }
  };

  switch (status) {
    case "sending":
      return (
        <View accessibilityLabel={getStatusLabel()}>
          <Ionicons name="time-outline" size={16} color={colors.textMuted} />
        </View>
      );
    case "sent":
      return (
        <View accessibilityLabel={getStatusLabel()}>
          <Ionicons name="checkmark" size={16} color={colors.textMuted} />
        </View>
      );
    case "delivered":
      return (
        <View accessibilityLabel={getStatusLabel()}>
          <Ionicons name="checkmark-done" size={16} color={colors.textMuted} />
        </View>
      );
    case "read":
      return (
        <View accessibilityLabel={getStatusLabel()}>
          <Ionicons name="checkmark-done" size={16} color={colors.accentTeal} />
        </View>
      );
    case "failed":
      return (
        <View accessibilityLabel={getStatusLabel()}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
        </View>
      );
    default:
      return null;
  }
};

export default function MessageBubble({
  text,
  time,
  isOwn,
  status,
}: MessageBubbleProps) {
  return (
    <View
      style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}
      accessibilityRole="text"
      accessibilityLabel={`${isOwn ? "You" : "They"} said: ${text}. ${time}${status ? `, ${status}` : ""}`}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.outgoing : styles.incoming,
          status === "failed" && styles.failedBubble,
          Platform.OS === "ios" ? styles.shadow : styles.elevated,
        ]}
      >
        <AppText
          size="body"
          weight={isOwn ? "medium" : "normal"}
          color={isOwn ? colors.white : colors.textPrimary}
          style={styles.messageText}
        >
          {text}
        </AppText>
      </View>
      <View style={styles.metaRow}>
        <AppText size="small" color={colors.textSecondary} style={styles.timestamp}>
          {time}
        </AppText>
        {isOwn && <StatusIcon status={status} />}
      </View>
    </View>
  );
}

/**
 * MessageBubble Styles
 *
 * Optimized for readability with:
 * - Larger padding (20px horizontal, 16px vertical)
 * - Increased line height (28px)
 * - Max width of 80% for comfortable reading
 * - Larger border radius for softer appearance
 */
const styles = StyleSheet.create({
  container: {
    maxWidth: "80%", // Increased from 75% for better readability
    marginBottom: 14, // More spacing between messages
  },
  alignEnd: {
    alignSelf: "flex-end",
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 20, // Increased from 16
    paddingVertical: 14, // Increased from 12
    borderRadius: 24, // Larger, softer corners
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  incoming: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 24,
  },
  outgoing: {
    backgroundColor: colors.accentTeal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
  },
  failedBubble: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 2,
  },
  messageText: {
    lineHeight: 28, // Increased from 21 for better readability
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 6,
    marginTop: 8, // Increased from 6
  },
  timestamp: {
    // marginTop handled by metaRow
  },
  shadow: {
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  elevated: {
    elevation: 2,
  },
});
