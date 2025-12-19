/**
 * GradientButton - Senior-Friendly Gradient Button Component
 *
 * SENIOR-FRIENDLY FEATURES:
 * - Minimum touch target of 52-72px (exceeds 48px standard)
 * - Large, readable text (20-28px responsive)
 * - Clear visual feedback with gradient
 * - High contrast colors
 * - Supports screen readers with accessibility labels
 *
 * RESPONSIVE DESIGN:
 * - Scales appropriately across all device sizes
 * - Uses seniorResponsive for consistent sizing
 */

import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import colors from "../../config/colors";
import typography from "../../config/typography";
import { seniorResponsive, moderateScale } from "../../utility/responsive";

interface Props {
  /** Button label text */
  title: string;
  /** Press handler */
  onPress: () => void;
  /** Additional container styles */
  style?: ViewStyle;
  /** Additional text styles */
  textStyle?: TextStyle;
  /** Text size key from typography */
  textSize?: keyof typeof typography.sizes;
  /** Disabled state */
  disabled?: boolean;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Accessibility hint for screen readers */
  accessibilityHint?: string;
}

export default function GradientButton({
  title,
  onPress,
  style,
  textStyle,
  textSize = "h4",
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  // Responsive sizing
  const buttonHeight = seniorResponsive.buttonHeight();
  const borderRadius = seniorResponsive.radiusPill();
  const paddingV = seniorResponsive.buttonPaddingV();
  const paddingH = seniorResponsive.buttonPaddingH();
  const fontSize = typography.responsiveSizes[textSize]?.() || typography.sizes[textSize];

  // Shadow styles based on platform
  const shadowStyle = Platform.select({
    ios: {
      shadowColor: colors.shadowMedium,
      shadowOffset: { width: 0, height: moderateScale(3) },
      shadowOpacity: 0.2,
      shadowRadius: moderateScale(6),
    },
    android: {
      elevation: 4,
    },
  });

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      onPress={!disabled ? onPress : undefined}
      disabled={disabled}
      style={style}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {disabled ? (
        <View
          style={[
            styles.button,
            {
              minHeight: buttonHeight,
              paddingVertical: paddingV,
              paddingHorizontal: paddingH,
              borderRadius,
            },
            styles.disabledButton,
            shadowStyle,
          ]}
        >
          <Text
            style={[
              styles.text,
              { fontSize },
              styles.disabledText,
              textStyle,
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={typography.accessibility.maxFontSizeMultiplier}
          >
            {title}
          </Text>
        </View>
      ) : (
        <LinearGradient
          colors={colors.gradients.brandStrong.array}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            {
              minHeight: buttonHeight,
              paddingVertical: paddingV,
              paddingHorizontal: paddingH,
              borderRadius,
            },
            shadowStyle,
          ]}
        >
          <Text
            style={[styles.text, { fontSize }, textStyle]}
            allowFontScaling={true}
            maxFontSizeMultiplier={typography.accessibility.maxFontSizeMultiplier}
          >
            {title}
          </Text>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  disabledButton: {
    backgroundColor: colors.disabled,
  },

  text: {
    color: colors.white,
    fontWeight: typography.weights.bold,
    letterSpacing: typography.letterSpacing.wide,
    fontFamily: typography.fontFamily.bold,
  },

  disabledText: {
    color: colors.disabledText,
  },
});
