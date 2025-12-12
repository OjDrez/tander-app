import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import colors from '@/src/config/colors';
import { blockReportApi, REPORT_REASONS, ReportReason } from '@/src/api/blockReportApi';
import AppText from '../inputs/AppText';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  onReported?: () => void;
}

/**
 * ReportUserModal Component
 *
 * Allows users to report another user for various reasons.
 * Senior-friendly design with large touch targets and clear options.
 */
export default function ReportUserModal({
  visible,
  onClose,
  userId,
  userName,
  onReported,
}: ReportUserModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Select a Reason', 'Please select a reason for your report.');
      return;
    }

    setIsSubmitting(true);
    try {
      await blockReportApi.reportUser(userId, selectedReason, details);

      Alert.alert(
        'Report Submitted',
        'Thank you for helping keep Tander safe. Our team will review your report.',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onReported?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="flag" size={28} color={colors.error} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <AppText size="h3" weight="bold" color={colors.textPrimary}>
                  Report {userName}
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  Help us understand the issue
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Reason Selection */}
            <View style={styles.section}>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                What's the issue?
              </AppText>
              <View style={styles.reasonsList}>
                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      selectedReason === reason.value && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: selectedReason === reason.value }}
                  >
                    <View
                      style={[
                        styles.radioCircle,
                        selectedReason === reason.value && styles.radioCircleSelected,
                      ]}
                    >
                      {selectedReason === reason.value && (
                        <View style={styles.radioInner} />
                      )}
                    </View>
                    <AppText
                      size="body"
                      weight={selectedReason === reason.value ? 'semibold' : 'regular'}
                      color={colors.textPrimary}
                    >
                      {reason.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Additional Details */}
            <View style={styles.section}>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Additional Details (Optional)
              </AppText>
              <TextInput
                style={styles.textInput}
                value={details}
                onChangeText={setDetails}
                placeholder="Tell us more about what happened..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <AppText size="tiny" color={colors.textMuted} style={{ textAlign: 'right' }}>
                {details.length}/500
              </AppText>
            </View>

            {/* Info Note */}
            <View style={styles.infoNote}>
              <Ionicons name="information-circle" size={18} color={colors.accentBlue} />
              <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 8 }}>
                Your report is confidential. The reported user won't know who reported them.
              </AppText>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={colors.white} />
                  <AppText weight="bold" color={colors.white} style={{ marginLeft: 8 }}>
                    Submit Report
                  </AppText>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <AppText weight="semibold" color={colors.textSecondary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 20,
    gap: 12,
  },
  reasonsList: {
    gap: 10,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    minHeight: 56,
  },
  reasonOptionSelected: {
    backgroundColor: colors.primaryLight || '#FFE5E5',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  textInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    minHeight: 100,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.accentMint,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    minHeight: 56,
    marginBottom: 12,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 14,
    minHeight: 48,
  },
});
