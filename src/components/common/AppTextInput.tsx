/**
 * AppTextInput - Senior-Friendly Text Input Component
 *
 * SENIOR-FRIENDLY FEATURES:
 * - Large touch target (56-72px minimum height)
 * - Large, readable text (16-20px)
 * - Clear visual feedback for focus and error states
 * - High contrast colors
 * - Accessible with screen readers
 * - Fixed error message height (prevents layout jumping)
 *
 * RESPONSIVE DESIGN:
 * - Scales appropriately across all device sizes
 * - Uses seniorResponsive for consistent sizing
 */

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import colors from "../../config/colors";
import typography from "../../config/typography";
import { seniorResponsive } from "../../utility/responsive";

interface Props extends TextInputProps {
  /** Left icon name from Ionicons */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Error message to display */
  error?: string | null;
  /** Additional container styles */
  containerStyle?: ViewStyle;
  /** Label text above input */
  label?: string;
}

export default function AppTextInput({
  icon,
  error,
  containerStyle,
  secureTextEntry,
  label,
  placeholder,
  ...otherProps
}: Props) {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);
  const [isFocused, setIsFocused] = useState(false);

  // Responsive sizing
  const inputPadding = seniorResponsive.inputPadding();
  const touchTarget = seniorResponsive.touchTarget();
  const iconSize = seniorResponsive.iconSmall();
  const fontSize = seniorResponsive.fontSizeBody();
  const borderRadius = seniorResponsive.radiusPill();

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}

      {/* Input Wrapper */}
      <View
        style={[
          styles.inputWrapper,
          {
            paddingHorizontal: inputPadding,
            paddingVertical: inputPadding,
            minHeight: touchTarget,
            borderRadius,
          },
          isFocused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
        ]}
      >
        {/* Left Icon */}
        {icon && (
          <Ionicons
            name={icon}
            size={iconSize}
            color={error ? colors.error : isFocused ? colors.accentTeal : colors.textSecondary}
            style={styles.leftIcon}
          />
        )}

        {/* Text Input */}
        <TextInput
          style={[styles.input, { fontSize }]}
          placeholderTextColor={colors.placeholder}
          secureTextEntry={hidePassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          accessibilityLabel={label || placeholder}
          {...otherProps}
        />

        {/* Password Toggle (Right Icon) */}
        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setHidePassword(!hidePassword)}
            style={styles.toggleButton}
            accessibilityRole="button"
            accessibilityLabel={hidePassword ? "Show password" : "Hide password"}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={hidePassword ? "eye-off-outline" : "eye-outline"}
              size={iconSize}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Fixed Height Error Message (Prevents Layout Jumping) */}
      <View style={styles.errorContainer}>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : (
          <Text style={styles.errorPlaceholder}> </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: seniorResponsive.gapMedium(),
  },

  label: {
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
    marginBottom: seniorResponsive.gapTiny(),
    marginLeft: seniorResponsive.gapTiny(),
    fontFamily: typography.fontFamily.medium,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: colors.backgroundInput,
    borderWidth: 2,
    borderColor: colors.transparent,
  },

  inputWrapperFocused: {
    borderColor: colors.borderFocus,
    backgroundColor: colors.white,
  },

  inputWrapperError: {
    borderColor: colors.error,
    backgroundColor: colors.errorBackground,
  },

  leftIcon: {
    marginRight: seniorResponsive.gapSmall(),
  },

  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.regular,
    paddingVertical: 0,
  },

  toggleButton: {
    marginLeft: seniorResponsive.gapSmall(),
    padding: seniorResponsive.gapTiny(),
  },

  errorContainer: {
    minHeight: 24,
    justifyContent: "center",
  },

  error: {
    color: colors.errorText,
    fontSize: typography.sizes.small,
    fontWeight: typography.weights.medium,
    marginLeft: seniorResponsive.gapSmall(),
    marginTop: seniorResponsive.gapTiny(),
    fontFamily: typography.fontFamily.medium,
  },

  errorPlaceholder: {
    height: 20,
    marginLeft: seniorResponsive.gapSmall(),
    marginTop: seniorResponsive.gapTiny(),
    opacity: 0,
  },
});
