import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import colors from '@/src/config/colors';
import AppText from '../inputs/AppText';

// Maximum file size: 10MB in bytes
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_SIZE_MB = 10;

interface PhotoPickerProps {
  visible: boolean;
  onClose: () => void;
  onPhotoSelected: (uri: string) => void;
  title?: string;
}

/**
 * PhotoPicker Component
 *
 * Senior-friendly photo picker with large touch targets and clear options.
 * Supports both camera and photo library selection.
 *
 * Accessibility features:
 * - 56px minimum touch targets
 * - Large, clear text
 * - High contrast colors
 * - Simple two-option interface
 */
export default function PhotoPicker({
  visible,
  onClose,
  onPhotoSelected,
  title = 'Add Photo',
}: PhotoPickerProps) {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Validates that the photo file size is within the 10MB limit
   * @param uri - The local URI of the photo
   * @returns true if valid, false if too large
   */
  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);

      if (fileInfo.exists && fileInfo.size !== undefined) {
        const fileSizeMB = fileInfo.size / (1024 * 1024);

        if (fileInfo.size > MAX_FILE_SIZE_BYTES) {
          Alert.alert(
            'Photo Too Large',
            `Your photo is ${fileSizeMB.toFixed(1)}MB. Please choose a photo smaller than ${MAX_FILE_SIZE_MB}MB.`,
            [{ text: 'OK', style: 'default' }]
          );
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking file size:', error);
      // Allow upload if we can't check size - let server validate
      return true;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Needed',
        'Please allow camera access in your device settings to take photos.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    return true;
  };

  const requestLibraryPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Needed',
        'Please allow photo library access in your device settings to choose photos.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        // Validate file size before proceeding
        const isValidSize = await validateFileSize(uri);
        if (!isValidSize) {
          setIsLoading(false);
          return;
        }

        onPhotoSelected(uri);
        onClose();
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Could not take photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    const hasPermission = await requestLibraryPermission();
    if (!hasPermission) return;

    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;

        // Validate file size before proceeding
        const isValidSize = await validateFileSize(uri);
        if (!isValidSize) {
          setIsLoading(false);
          return;
        }

        onPhotoSelected(uri);
        onClose();
      }
    } catch (error) {
      console.error('Library error:', error);
      Alert.alert('Error', 'Could not select photo. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}

          <View style={styles.header}>
            <AppText size="h3" weight="bold" color={colors.textPrimary}>
              {title}
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              Choose how you'd like to add your photo
            </AppText>
          </View>

          <View style={styles.options}>
            {/* Take Photo Option */}
            <Pressable
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
              onPress={handleTakePhoto}
              accessibilityRole="button"
              accessibilityLabel="Take a photo with camera"
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentMint }]}>
                <Ionicons name="camera" size={28} color={colors.accentBlue} />
              </View>
              <View style={styles.optionText}>
                <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                  Take Photo
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  Use your camera
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </Pressable>

            {/* Choose from Library Option */}
            <Pressable
              style={({ pressed }) => [
                styles.option,
                pressed && styles.optionPressed,
              ]}
              onPress={handleChooseFromLibrary}
              accessibilityRole="button"
              accessibilityLabel="Choose photo from library"
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.accentPeach }]}>
                <Ionicons name="images" size={28} color={colors.primary} />
              </View>
              <View style={styles.optionText}>
                <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                  Choose from Library
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  Select an existing photo
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Cancel Button */}
          <Pressable
            style={({ pressed }) => [
              styles.cancelButton,
              pressed && styles.cancelButtonPressed,
            ]}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
          >
            <AppText size="body" weight="semibold" color={colors.textSecondary}>
              Cancel
            </AppText>
          </Pressable>
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  options: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    minHeight: 80, // Large touch target for seniors
  },
  optionPressed: {
    backgroundColor: colors.borderLight,
    transform: [{ scale: 0.98 }],
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    minHeight: 56, // Large touch target
  },
  cancelButtonPressed: {
    backgroundColor: colors.borderLight,
  },
});
