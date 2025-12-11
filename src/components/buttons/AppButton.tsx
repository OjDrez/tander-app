import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import colors from "../../config/colors";

/**
 * AppButton - Primary action button
 *
 * Accessibility Features:
 * - Minimum touch target of 56px height (exceeds 48px minimum)
 * - Large, readable text (20px)
 * - Clear visual feedback on press
 * - Disabled state is clearly visible
 * - Supports screen readers with accessibilityLabel and accessibilityHint
 */
interface AppButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function AppButton({
  title,
  onPress,
  style,
  disabled = false,
  loading = false,
  accessibilityLabel,
  accessibilityHint,
}: AppButtonProps) {
  const [pressed, setPressed] = useState(false);

  const gradientColors = pressed
    ? ([colors.pressed.primary, colors.pressed.teal] as const)
    : colors.gradients.brandStrong.array;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: disabled || loading,
        busy: loading,
      }}
    >
      <LinearGradient
        colors={disabled ? [colors.textMuted, colors.textMuted] : gradientColors}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <Text
            style={[styles.text, disabled && styles.textDisabled]}
            allowFontScaling={true}
            maxFontSizeMultiplier={1.3}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    borderRadius: 30,
    overflow: "hidden",
    // Minimum touch target size for accessibility
    minHeight: 56,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradient: {
    paddingVertical: 18, // Increased from 15 for larger touch target
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    minHeight: 56,
  },
  text: {
    color: colors.white,
    fontSize: 20, // Increased from 18 for better readability
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  textDisabled: {
    color: colors.white,
  },
});
