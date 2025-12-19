import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';

interface ErrorCardProps {
  message: string;
  onRetry: () => void;
}

/**
 * ErrorCard component - Displays error message with retry option
 */
export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <View style={styles.errorCard}>
      <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
      <AppText size="body" color={colors.textSecondary} style={styles.errorText}>
        {message}
      </AppText>
      <TouchableOpacity
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry loading data"
      >
        <AppText size="body" weight="semibold" color={colors.primary}>
          Retry
        </AppText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.dangerLight,
    padding: 16,
    borderRadius: 16,
  },
  errorText: {
    flex: 1,
  },
});

export default ErrorCard;
