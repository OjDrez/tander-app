/**
 * AppText - Senior-Friendly Text Component
 *
 * SENIOR-FRIENDLY FEATURES:
 * - Large, readable text sizes (16-38px)
 * - High contrast default colors
 * - Generous line heights for readability
 * - Supports dynamic font scaling with limits
 * - Platform-specific font families
 *
 * RESPONSIVE DESIGN:
 * - Font sizes can be responsive based on device
 * - Uses typography tokens for consistency
 * - Accessible with screen readers
 */

import React from "react";
import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
import colors from "../../config/colors";
import typography from "../../config/typography";

// Type definitions for valid keys
type TextSize = keyof typeof typography.sizes;
type TextWeight = keyof typeof typography.weights;

interface AppTextProps extends TextProps {
  /** Text size - corresponds to typography.sizes */
  size?: TextSize;
  /** Font weight - corresponds to typography.weights */
  weight?: TextWeight;
  /** Text color - defaults to textPrimary */
  color?: string;
  /** Additional styles */
  style?: TextStyle | TextStyle[];
  /** Whether to use responsive font size */
  responsive?: boolean;
  /** Text content */
  children: React.ReactNode;
}

export default function AppText({
  children,
  size = "body",
  weight = "normal",
  color = colors.textPrimary,
  style,
  responsive = false,
  ...otherProps
}: AppTextProps) {
  // Get font size - use responsive if enabled
  const fontSize = responsive && typography.responsiveSizes[size]
    ? typography.responsiveSizes[size]()
    : typography.sizes[size];

  // Get line height - use responsive if enabled
  const lineHeight = responsive && typography.responsiveLineHeights[size]
    ? typography.responsiveLineHeights[size]()
    : typography.lineHeights[size] || Math.round(fontSize * 1.5);

  return (
    <Text
      style={[
        styles.text,
        {
          fontSize,
          fontWeight: typography.weights[weight],
          lineHeight,
          color,
        },
        style,
      ]}
      allowFontScaling={typography.accessibility.allowFontScaling}
      maxFontSizeMultiplier={typography.accessibility.maxFontSizeMultiplier}
      {...otherProps}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.fontFamily.regular,
    letterSpacing: typography.letterSpacing.normal,
  },
});
