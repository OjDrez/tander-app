import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Get screen width for responsive bubble sizing
const { width: SCREEN_WIDTH } = Dimensions.get("window");
// On tablets (width > 600), use narrower bubbles for better readability
const IS_TABLET = SCREEN_WIDTH > 600;
const BUBBLE_MAX_WIDTH = IS_TABLET ? "65%" : "85%";

type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

/**
 * MessageBubble - SENIOR-FRIENDLY Chat Message Component
 *
 * Design Principles for Elderly Users:
 * - Extra large, readable text (20px minimum)
 * - Very high contrast colors
 * - Large status indicators with text labels
 * - Generous padding for easy reading
 * - Clear visual distinction between sent/received
 * - Large, labeled retry/delete buttons
 * - Prominent timestamps
 */
type MessageBubbleProps = {
  text: string;
  time: string;
  isOwn?: boolean;
  status?: MessageStatus;
  onRetry?: () => void;
  onDelete?: () => void;
};

// SENIOR-FRIENDLY: Status indicator with icon AND text label
const StatusIndicator = ({ status }: { status?: MessageStatus }) => {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status) {
      case "sending":
        return { icon: "time-outline", label: "Sending...", color: colors.textMuted };
      case "sent":
        return { icon: "checkmark", label: "Sent", color: colors.textSecondary };
      case "delivered":
        return { icon: "checkmark-done", label: "Delivered", color: colors.accentTeal };
      case "read":
        return { icon: "checkmark-done", label: "Read", color: colors.success };
      case "failed":
        return { icon: "alert-circle", label: "Failed", color: colors.danger };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <View
      style={styles.statusIndicator}
      accessibilityLabel={`Message status: ${config.label}`}
    >
      <Ionicons name={config.icon as any} size={20} color={config.color} />
      <AppText size="body" weight="semibold" color={config.color}>
        {config.label}
      </AppText>
    </View>
  );
};

// Sending animation component - SENIOR-FRIENDLY: Larger indicator
const SendingIndicator = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scaleAnim]);

  return (
    <Animated.View style={[styles.sendingIndicatorContainer, { transform: [{ scale: scaleAnim }] }]}>
      <Ionicons name="time-outline" size={20} color={colors.textMuted} />
      <AppText size="body" weight="medium" color={colors.textMuted}>
        Sending...
      </AppText>
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
      accessibilityLabel={`${isOwn ? "You sent" : "They sent"}: ${text}. Time: ${time}. ${status === "read" ? "Message has been read." : status === "delivered" ? "Message delivered." : status === "sent" ? "Message sent." : status === "sending" ? "Message is sending." : status === "failed" ? "Message failed to send." : ""}`}
    >
      {/* Label showing who sent the message - SENIOR-FRIENDLY: Larger text for 60+ users */}
      <View style={styles.senderLabel}>
        <AppText size="body" weight="semibold" color={isOwn ? colors.accentTeal : colors.primary}>
          {isOwn ? "You" : "Them"}
        </AppText>
        <AppText size="body" weight="medium" color={colors.textPrimary}>
          • {time}
        </AppText>
      </View>

      {/* Message bubble - SENIOR-FRIENDLY: Larger text, better contrast */}
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
          size="h4"
          weight={isOwn ? "medium" : "normal"}
          color={isFailed ? colors.danger : isOwn ? colors.white : colors.textPrimary}
          style={[styles.messageText, isSending && styles.sendingText]}
        >
          {text}
        </AppText>
      </View>

      {/* Status row - SENIOR-FRIENDLY: Clear status with text labels */}
      {isOwn && (
        <View style={styles.statusRow}>
          {isSending ? <SendingIndicator /> : <StatusIndicator status={status} />}
        </View>
      )}

      {/* Failed message actions - SENIOR-FRIENDLY: Large labeled buttons */}
      {isFailed && isOwn && (onRetry || onDelete) && (
        <View style={styles.failedActionsContainer}>
          <AppText size="body" weight="semibold" color={colors.danger} style={styles.failedText}>
            This message did not send
          </AppText>
          <View style={styles.failedActions}>
            {onRetry && (
              <TouchableOpacity
                style={styles.retryButtonLarge}
                onPress={onRetry}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Try sending this message again"
              >
                <Ionicons name="refresh" size={22} color={colors.white} />
                <AppText size="body" weight="bold" color={colors.white}>
                  Try Again
                </AppText>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteButtonLarge}
                onPress={onDelete}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Delete this message"
              >
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <AppText size="body" weight="semibold" color={colors.danger}>
                  Delete
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

/**
 * MessageBubble Styles - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Extra large text (h4 size = 20px+)
 * - Generous padding (24px horizontal, 18px vertical)
 * - Very high line height (32px) for easy reading
 * - Responsive max width (85% on phones, 65% on tablets) for comfortable reading
 * - Clear sender labels above each message
 * - Status indicators with text labels (not just icons)
 * - Large, labeled action buttons (56px minimum touch target)
 * - High contrast colors for better visibility
 */
const styles = StyleSheet.create({
  container: {
    maxWidth: BUBBLE_MAX_WIDTH,
    marginBottom: 20,
  },
  alignEnd: {
    alignSelf: "flex-end",
  },
  alignStart: {
    alignSelf: "flex-start",
  },

  // Sender label - SENIOR-FRIENDLY: Clear who sent the message
  senderLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 4,
  },

  // Message bubble - SENIOR-FRIENDLY: Large, easy to read
  bubble: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    borderRadius: 24,
  },
  incoming: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },
  outgoing: {
    backgroundColor: colors.accentTeal,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  failedBubble: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.danger,
    borderWidth: 3,
  },
  sendingBubble: {
    opacity: 0.8,
  },
  messageText: {
    lineHeight: 32,
    fontSize: 20,
  },
  sendingText: {
    opacity: 0.85,
  },

  // Status indicators - SENIOR-FRIENDLY
  statusRow: {
    marginTop: 10,
    paddingHorizontal: 4,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sendingIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // Shadow styles
  shadow: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  elevated: {
    elevation: 4,
  },

  // Failed message actions - SENIOR-FRIENDLY: Large labeled buttons
  failedActionsContainer: {
    marginTop: 12,
    gap: 12,
  },
  failedText: {
    paddingHorizontal: 4,
  },
  failedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  retryButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    backgroundColor: colors.accentTeal,
    borderRadius: 16,
    minHeight: 56,
  },
  deleteButtonLarge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.dangerLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.danger,
    minHeight: 56,
  },
});
