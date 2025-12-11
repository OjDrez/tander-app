import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

/**
 * DashboardActionsRow - Action buttons for user profile interactions
 *
 * Accessibility Features:
 * - 64px touch targets (exceeds 48px minimum)
 * - 28px icons for visibility
 * - 16px labels (meets minimum font size)
 * - Full accessibility labels and hints for screen readers
 * - High contrast colors
 */
type Action = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress?: () => void;
  accessibilityHint?: string;
};

type DashboardActionsRowProps = {
  actions: Action[];
  userName?: string;
};

export default function DashboardActionsRow({ actions, userName }: DashboardActionsRowProps) {
  const getAccessibilityHint = (action: Action) => {
    if (action.accessibilityHint) return action.accessibilityHint;

    switch (action.key) {
      case "chat":
        return `Double tap to start a chat${userName ? ` with ${userName}` : ""}`;
      case "voice":
        return `Double tap to start a voice call${userName ? ` with ${userName}` : ""}`;
      case "video":
        return `Double tap to start a video call${userName ? ` with ${userName}` : ""}`;
      case "favorite":
        return `Double tap to add${userName ? ` ${userName}` : ""} to favorites`;
      case "close":
        return "Double tap to go back";
      default:
        return `Double tap to ${action.label.toLowerCase()}`;
    }
  };

  return (
    <View style={styles.row} accessibilityRole="toolbar">
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.circle, action.color ? { backgroundColor: action.color } : null]}
          onPress={action.onPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityHint={getAccessibilityHint(action)}
        >
          <Ionicons
            name={action.icon}
            size={28}
            color={action.color ? colors.white : colors.textPrimary}
          />
          <Text
            style={[styles.label, action.color ? styles.labelLight : styles.labelDark]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {action.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/**
 * DashboardActionsRow Styles
 *
 * Accessibility Optimizations:
 * - 64px touch targets (larger than 48px minimum)
 * - 16px font size for labels
 * - High contrast text colors
 * - Clear visual separation between buttons
 */
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  circle: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  label: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "700",
  },
  labelLight: {
    color: colors.white,
  },
  labelDark: {
    color: colors.textPrimary,
  },
});
