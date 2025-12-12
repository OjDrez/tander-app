import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import colors from '@/src/config/colors';
import AppText from '../inputs/AppText';

interface ProfileCompletionItem {
  label: string;
  completed: boolean;
  icon: keyof typeof Ionicons.glyphMap;
}

interface ProfileCompletionIndicatorProps {
  hasPhoto: boolean;
  hasBio: boolean;
  hasInterests: boolean;
  isVerified: boolean;
  hasLocation: boolean;
  onPress?: () => void;
}

/**
 * ProfileCompletionIndicator Component
 *
 * Shows users their profile completion progress with a visual indicator.
 * Senior-friendly design with large text and clear visual feedback.
 *
 * Features:
 * - Circular progress indicator
 * - Checklist of completion items
 * - Tap to navigate to profile editing
 */
export default function ProfileCompletionIndicator({
  hasPhoto,
  hasBio,
  hasInterests,
  isVerified,
  hasLocation,
  onPress,
}: ProfileCompletionIndicatorProps) {
  const items: ProfileCompletionItem[] = [
    { label: 'Profile Photo', completed: hasPhoto, icon: 'camera' },
    { label: 'About Me', completed: hasBio, icon: 'document-text' },
    { label: 'Interests', completed: hasInterests, icon: 'heart' },
    { label: 'Location', completed: hasLocation, icon: 'location' },
    { label: 'ID Verified', completed: isVerified, icon: 'shield-checkmark' },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  // Determine status color
  const getStatusColor = () => {
    if (percentage === 100) return colors.success;
    if (percentage >= 60) return colors.warning;
    return colors.primary;
  };

  const statusColor = getStatusColor();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Profile ${percentage}% complete. Tap to complete your profile.`}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.progressCircle}>
          <View style={[styles.progressFill, { borderColor: statusColor }]}>
            <AppText size="h4" weight="bold" color={statusColor}>
              {percentage}%
            </AppText>
          </View>
        </View>
        <View style={styles.headerText}>
          <AppText size="h4" weight="bold" color={colors.textPrimary}>
            Profile Completion
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            {completedCount} of {totalCount} completed
          </AppText>
        </View>
        {onPress && (
          <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressBarFill,
            { width: `${percentage}%`, backgroundColor: statusColor },
          ]}
        />
      </View>

      {/* Completion Checklist */}
      <View style={styles.checklist}>
        {items.map((item, index) => (
          <View key={index} style={styles.checklistItem}>
            <View
              style={[
                styles.checkIcon,
                { backgroundColor: item.completed ? colors.successLight || '#E8F5E9' : colors.backgroundLight },
              ]}
            >
              <Ionicons
                name={item.completed ? 'checkmark' : item.icon}
                size={16}
                color={item.completed ? colors.success : colors.textMuted}
              />
            </View>
            <AppText
              size="small"
              weight={item.completed ? 'medium' : 'regular'}
              color={item.completed ? colors.textPrimary : colors.textMuted}
              style={item.completed ? undefined : styles.strikethrough}
            >
              {item.label}
            </AppText>
          </View>
        ))}
      </View>

      {/* Completion Message */}
      {percentage < 100 && (
        <View style={styles.messageCard}>
          <Ionicons name="bulb-outline" size={18} color={colors.warning} />
          <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
            Complete your profile to get more matches!
          </AppText>
        </View>
      )}

      {percentage === 100 && (
        <View style={[styles.messageCard, styles.successCard]}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <AppText size="small" color={colors.success} style={{ flex: 1, marginLeft: 8 }}>
            Your profile is complete!
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    gap: 16,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  containerPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressFill: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  checklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundLight,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strikethrough: {
    textDecorationLine: 'none',
    opacity: 0.7,
  },
  messageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight || '#FFF8E1',
    borderRadius: 12,
    padding: 12,
  },
  successCard: {
    backgroundColor: colors.successLight || '#E8F5E9',
  },
});
