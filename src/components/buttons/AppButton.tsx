/**
 * AppButton - Primary Action Button Component
 *
 * SENIOR-FRIENDLY FEATURES:
 * - Minimum touch target of 56-72px (exceeds 48px standard)
 * - Large, readable text (18-22px responsive)
 * - Clear visual feedback on press
 * - High contrast gradient background
 * - Supports screen readers with accessibility labels
 * - Loading state with activity indicator
 *
 * RESPONSIVE DESIGN:
 * - Scales appropriately across all device sizes
 * - Uses seniorResponsive for consistent sizing
 */

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
import typography from "../../config/typography";
import { seniorResponsive } from "../../utility/responsive";

interface AppButtonProps {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress?: () => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state - shows activity indicator */
  loading?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
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

  // Dynamic gradient colors based on press state
  const gradientColors = pressed
    ? ([colors.pressed.primary, colors.pressed.teal] as const)
    : colors.gradients.brandStrong.array;

  // Button should be disabled when loading or explicitly disabled
  const isDisabled = disabled || loading;

  // Responsive styles
  const buttonHeight = seniorResponsive.buttonHeight();
  const borderRadius = seniorResponsive.radiusButton();
  const paddingV = seniorResponsive.buttonPaddingV();
  const paddingH = seniorResponsive.buttonPaddingH();
  const fontSize = seniorResponsive.fontSizeLarge();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.button,
        { minHeight: buttonHeight, borderRadius },
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
    >
      <LinearGradient
        colors={isDisabled ? colors.gradients.disabled.array : gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradient,
          {
            minHeight: buttonHeight,
            borderRadius,
            paddingVertical: paddingV,
            paddingHorizontal: paddingH,
          },
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={colors.white}
            accessibilityLabel="Loading"
          />
        ) : (
          <Text
            style={[
              styles.text,
              { fontSize },
              isDisabled && styles.textDisabled,
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={typography.accessibility.maxFontSizeMultiplier}
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
    overflow: "hidden",
  },

  buttonDisabled: {
    opacity: 0.7,
  },

  gradient: {
    justifyContent: "center",
    alignItems: "center",
  },

  text: {
    color: colors.white,
    fontWeight: typography.weights.semibold,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: typography.fontFamily.medium,
  },

  textDisabled: {
    color: colors.white,
    opacity: 0.9,
  },
});
