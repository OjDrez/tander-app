/**
 * Control Button Component
 * Accessible call control button with press animations
 *
 * Accessibility Features:
 * - Minimum 64px touch target (exceeds 48px minimum)
 * - Large 80px buttons for important actions (accept/decline/end)
 * - Clear labels visible below buttons
 * - Screen reader support with accessibilityLabel and accessibilityHint
 * - Visual feedback on press
 */
import React, { memo, useCallback, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';

type ControlButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  active?: boolean;
  onPress?: () => void;
  danger?: boolean;
  success?: boolean;
  disabled?: boolean;
  size?: 'normal' | 'large';
  accessibilityHint?: string;
};

function ControlButton({
  icon,
  label,
  active = false,
  onPress,
  danger = false,
  success = false,
  disabled = false,
  size = 'normal',
  accessibilityHint,
}: ControlButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const isLarge = size === 'large';
  // Larger touch targets for better accessibility
  const buttonSize = isLarge ? 80 : 64;
  const iconSize = isLarge ? 36 : 28;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label || icon}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected: active }}
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.controlButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          danger && styles.dangerButton,
          success && styles.successButton,
          active && styles.activeButton,
          disabled && styles.disabledButton,
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={colors.white} />
      </TouchableOpacity>
      {label && (
        <AppText
          size="small"
          weight="semibold"
          color="rgba(255,255,255,0.9)"
          style={styles.controlLabel}
        >
          {label}
        </AppText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activeButton: {
    backgroundColor: colors.accentBlue,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlLabel: {
    marginTop: 10,
    textAlign: 'center',
    minWidth: 80,
  },
});

export default memo(ControlButton);
