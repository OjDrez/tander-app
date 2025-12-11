import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

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
 * - Retry and delete actions for failed messages
 */
type MessageBubbleProps = {
  text: string;
  time: string;
  isOwn?: boolean;
  status?: MessageStatus;
  onRetry?: () => void;
  onDelete?: () => void;
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

// Sending animation component
const SendingIndicator = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name="time-outline" size={16} color={colors.textMuted} />
    </Animated.View>
  );
};

export default function MessageBubble({
  text,
  time,
  isOwn,
  status,
  onRetry,
  onDelete,
}: MessageBubbleProps) {
  const isFailed = status === "failed";
  const isSending = status === "sending";

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
          isFailed && styles.failedBubble,
          isSending && styles.sendingBubble,
          Platform.OS === "ios" ? styles.shadow : styles.elevated,
        ]}
      >
        <AppText
          size="body"
          weight={isOwn ? "medium" : "normal"}
          color={isFailed ? colors.danger : isOwn ? colors.white : colors.textPrimary}
          style={[styles.messageText, isSending && styles.sendingText]}
        >
          {text}
        </AppText>
      </View>

      {/* Meta row with time and status */}
      <View style={styles.metaRow}>
        <AppText size="small" color={colors.textSecondary} style={styles.timestamp}>
          {time}
        </AppText>
        {isOwn && (
          isSending ? <SendingIndicator /> : <StatusIcon status={status} />
        )}
      </View>

      {/* Failed message actions */}
      {isFailed && isOwn && (onRetry || onDelete) && (
        <View style={styles.failedActions}>
          {onRetry && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRetry}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Retry sending message"
              accessibilityHint="Double tap to retry sending this message"
            >
              <Ionicons name="refresh" size={16} color={colors.white} />
              <AppText size="small" weight="semibold" color={colors.white}>
                Retry
              </AppText>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={onDelete}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Delete failed message"
              accessibilityHint="Double tap to delete this message"
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      )}
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
  sendingBubble: {
    opacity: 0.85,
  },
  messageText: {
    lineHeight: 28, // Increased from 21 for better readability
  },
  sendingText: {
    opacity: 0.9,
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
  // Failed message actions
  failedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.accentTeal,
    borderRadius: 16,
    minHeight: 36,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
});
