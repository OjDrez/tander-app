import React from 'react';
import { View, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppText from '@/src/components/inputs/AppText';
import FullScreen from '@/src/components/layout/FullScreen';
import colors from '@/src/config/colors';

/**
 * LoadingIndicator - Unified loading component for the entire app
 * Supports multiple variants:
 * - fullscreen: Full screen with gradient background (for initial page loads)
 * - overlay: Semi-transparent overlay on top of content
 * - inline: Just the spinner and optional text (for use within containers)
 * - button: Small spinner for use inside buttons
 */

type LoadingVariant = 'fullscreen' | 'overlay' | 'inline' | 'button';

interface LoadingIndicatorProps {
  /** Loading variant type */
  variant?: LoadingVariant;
  /** Primary loading message */
  message?: string;
  /** Secondary loading message (subtitle) */
  subtitle?: string;
  /** Custom color for the spinner (defaults based on variant) */
  color?: string;
  /** Size of the spinner */
  size?: 'small' | 'large';
  /** Additional styles for the container */
  style?: ViewStyle;
  /** Whether to show the loading indicator */
  visible?: boolean;
}

/**
 * Unified Loading Indicator Component
 *
 * Usage examples:
 * - <LoadingIndicator variant="fullscreen" message="Loading your dashboard..." />
 * - <LoadingIndicator variant="overlay" message="Saving..." visible={isSaving} />
 * - <LoadingIndicator variant="inline" message="Finding people near you..." />
 * - <LoadingIndicator variant="button" /> (inside a button)
 */
export default function LoadingIndicator({
  variant = 'inline',
  message,
  subtitle,
  color,
  size,
  style,
  visible = true,
}: LoadingIndicatorProps) {
  if (!visible) return null;

  // Determine size based on variant
  const spinnerSize = size ?? (variant === 'button' ? 'small' : 'large');

  // Determine color based on variant
  const spinnerColor = color ?? (variant === 'button' ? colors.white : colors.primary);

  // Button variant - just the spinner
  if (variant === 'button') {
    return <ActivityIndicator size={spinnerSize} color={spinnerColor} />;
  }

  // Inline variant - spinner with optional text
  if (variant === 'inline') {
    return (
      <View style={[styles.inlineContainer, style]}>
        <ActivityIndicator size={spinnerSize} color={spinnerColor} />
        {message && (
          <AppText size="body" color={colors.textSecondary} style={styles.message}>
            {message}
          </AppText>
        )}
        {subtitle && (
          <AppText size="small" color={colors.textMuted} style={styles.subtitle}>
            {subtitle}
          </AppText>
        )}
      </View>
    );
  }

  // Overlay variant - semi-transparent overlay
  if (variant === 'overlay') {
    return (
      <View style={[styles.overlayContainer, style]}>
        <View style={styles.overlayContent}>
          <ActivityIndicator size={spinnerSize} color={spinnerColor} />
          {message && (
            <AppText size="body" color={colors.textPrimary} style={styles.message}>
              {message}
            </AppText>
          )}
          {subtitle && (
            <AppText size="small" color={colors.textSecondary} style={styles.subtitle}>
              {subtitle}
            </AppText>
          )}
        </View>
      </View>
    );
  }

  // Fullscreen variant - full screen with gradient background
  return (
    <FullScreen statusBarStyle="dark" style={styles.fullscreenContainer}>
      <LinearGradient colors={colors.gradients.softAqua.array} style={styles.gradient}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.centeredContent, style]}>
            <ActivityIndicator size={spinnerSize} color={spinnerColor} />
            {message && (
              <AppText size="body" color={colors.textSecondary} style={styles.message}>
                {message}
              </AppText>
            )}
            {subtitle && (
              <AppText size="small" color={colors.textMuted} style={styles.subtitle}>
                {subtitle}
              </AppText>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  // Fullscreen variant styles
  fullscreenContainer: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },

  // Inline variant styles
  inlineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 20,
  },

  // Overlay variant styles
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: colors.white,
    borderRadius: 20,
    minWidth: 200,
  },

  // Text styles
  message: {
    marginTop: 12,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 4,
    textAlign: 'center',
  },
});

// Named export for easier importing
export { LoadingIndicator };
