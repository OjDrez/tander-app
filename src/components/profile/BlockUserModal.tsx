import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import colors from '@/src/config/colors';
import { blockReportApi } from '@/src/api/blockReportApi';
import AppText from '../inputs/AppText';
import { useToast } from '@/src/context/ToastContext';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  userId: number;
  userName: string;
  onBlocked?: () => void;
}

/**
 * BlockUserModal Component
 *
 * Confirms blocking a user with clear explanation of what happens.
 * Senior-friendly design with large buttons.
 */
export default function BlockUserModal({
  visible,
  onClose,
  userId,
  userName,
  onBlocked,
}: BlockUserModalProps) {
  const [isBlocking, setIsBlocking] = useState(false);
  const { success, error } = useToast();

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await blockReportApi.blockUser(userId);
      success(`You have blocked ${userName}. They won't be able to contact you.`);
      onClose();
      onBlocked?.();
    } catch (err: any) {
      error(err.message || 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.dialog} onPress={(e) => e.stopPropagation()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="ban" size={36} color={colors.error} />
          </View>

          {/* Title & Description */}
          <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.title}>
            Block {userName}?
          </AppText>

          <AppText size="body" color={colors.textSecondary} style={styles.description}>
            Blocking this user will:
          </AppText>

          {/* Effects List */}
          <View style={styles.effectsList}>
            <View style={styles.effectItem}>
              <Ionicons name="eye-off" size={18} color={colors.textMuted} />
              <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 10 }}>
                Hide your profile from them
              </AppText>
            </View>
            <View style={styles.effectItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.textMuted} />
              <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 10 }}>
                Prevent them from messaging you
              </AppText>
            </View>
            <View style={styles.effectItem}>
              <Ionicons name="heart-dislike" size={18} color={colors.textMuted} />
              <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 10 }}>
                Remove any existing matches
              </AppText>
            </View>
          </View>

          {/* Note */}
          <View style={styles.note}>
            <AppText size="small" color={colors.textMuted} style={{ textAlign: 'center' }}>
              You can unblock them later from Settings {'\u003E'} Privacy {'\u003E'} Blocked Users
            </AppText>
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={styles.blockButton}
            onPress={handleBlock}
            disabled={isBlocking}
          >
            {isBlocking ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Ionicons name="ban" size={20} color={colors.white} />
                <AppText weight="bold" color={colors.white} style={{ marginLeft: 8 }}>
                  Block {userName}
                </AppText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <AppText weight="semibold" color={colors.textSecondary}>
              Cancel
            </AppText>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.errorLight || '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    marginBottom: 16,
  },
  effectsList: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  effectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
  },
  note: {
    marginBottom: 20,
  },
  blockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    minHeight: 56,
    marginBottom: 12,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '100%',
    minHeight: 48,
  },
});
