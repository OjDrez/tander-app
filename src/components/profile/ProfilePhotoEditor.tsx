import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import colors from '@/src/config/colors';
import { photoApi } from '@/src/api/photoApi';
import AppText from '../inputs/AppText';
import PhotoPicker from './PhotoPicker';

interface ProfilePhotoEditorProps {
  profilePhotoUrl: string | null;
  additionalPhotos: string[];
  onPhotosUpdated: () => void;
  maxAdditionalPhotos?: number;
}

/**
 * ProfilePhotoEditor Component
 *
 * Allows users to manage their profile photo and additional photos.
 * Senior-friendly design with large touch targets.
 *
 * Features:
 * - Main profile photo editing
 * - Up to 6 additional photos (total 7 including profile photo)
 * - Progress feedback during upload
 * - Clear visual feedback
 */
export default function ProfilePhotoEditor({
  profilePhotoUrl,
  additionalPhotos = [],
  onPhotosUpdated,
  maxAdditionalPhotos = 6,
}: ProfilePhotoEditorProps) {
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoPickerMode, setPhotoPickerMode] = useState<'profile' | 'additional'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleOpenPhotoPicker = (mode: 'profile' | 'additional') => {
    if (mode === 'additional' && additionalPhotos.length >= maxAdditionalPhotos) {
      Alert.alert(
        'Maximum Photos Reached',
        `You can add up to ${maxAdditionalPhotos} additional photos.`,
        [{ text: 'OK' }]
      );
      return;
    }
    setPhotoPickerMode(mode);
    setShowPhotoPicker(true);
  };

  const handlePhotoSelected = async (uri: string) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      if (photoPickerMode === 'profile') {
        await photoApi.uploadProfilePhoto(uri, setUploadProgress);
      } else {
        await photoApi.uploadAdditionalPhotos([uri], setUploadProgress);
      }
      onPhotosUpdated();
    } catch (error: any) {
      Alert.alert('Upload Failed', error.message || 'Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const getPhotoUrl = (path: string | null): string | null => {
    return photoApi.getPhotoUrl(path);
  };

  return (
    <View style={styles.container}>
      {/* Upload Progress Overlay */}
      {isUploading && (
        <View style={styles.uploadOverlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" weight="semibold" style={styles.progressText}>
              Uploading... {uploadProgress}%
            </AppText>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
          </View>
        </View>
      )}

      {/* Main Profile Photo */}
      <View style={styles.section}>
        <AppText size="h4" weight="bold" color={colors.textPrimary}>
          Profile Photo
        </AppText>
        <AppText size="small" color={colors.textSecondary} style={styles.hint}>
          This is the first photo others will see
        </AppText>

        <Pressable
          style={({ pressed }) => [
            styles.mainPhotoContainer,
            pressed && styles.photoPressed,
          ]}
          onPress={() => handleOpenPhotoPicker('profile')}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          {profilePhotoUrl ? (
            <Image
              source={{ uri: getPhotoUrl(profilePhotoUrl) || undefined }}
              style={styles.mainPhoto}
            />
          ) : (
            <View style={styles.placeholderPhoto}>
              <Ionicons name="person" size={60} color={colors.textMuted} />
              <AppText size="small" color={colors.textMuted} style={{ marginTop: 8 }}>
                Add Photo
              </AppText>
            </View>
          )}

          <View style={styles.editBadge}>
            <Ionicons name="camera" size={18} color={colors.white} />
          </View>
        </Pressable>
      </View>

      {/* Additional Photos Grid */}
      <View style={styles.section}>
        <AppText size="h4" weight="bold" color={colors.textPrimary}>
          Additional Photos
        </AppText>
        <AppText size="small" color={colors.textSecondary} style={styles.hint}>
          Add up to {maxAdditionalPhotos} more photos to your profile
        </AppText>

        <View style={styles.photoGrid}>
          {/* Existing Additional Photos */}
          {additionalPhotos.map((photo, index) => (
            <View key={index} style={styles.gridPhotoWrapper}>
              <Image
                source={{ uri: getPhotoUrl(photo) || undefined }}
                style={styles.gridPhoto}
              />
              <View style={styles.photoNumber}>
                <AppText size="tiny" weight="bold" color={colors.white}>
                  {index + 2}
                </AppText>
              </View>
            </View>
          ))}

          {/* Add Photo Button (if under limit) */}
          {additionalPhotos.length < maxAdditionalPhotos && (
            <Pressable
              style={({ pressed }) => [
                styles.addPhotoButton,
                pressed && styles.photoPressed,
              ]}
              onPress={() => handleOpenPhotoPicker('additional')}
              accessibilityRole="button"
              accessibilityLabel="Add additional photo"
            >
              <Ionicons name="add" size={36} color={colors.primary} />
              <AppText size="tiny" weight="medium" color={colors.primary}>
                Add Photo
              </AppText>
            </Pressable>
          )}
        </View>
      </View>

      {/* Photo Tips */}
      <View style={styles.tipsCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={20} color={colors.warning} />
          <AppText size="body" weight="semibold" color={colors.textPrimary}>
            Photo Tips
          </AppText>
        </View>
        <View style={styles.tipsList}>
          <AppText size="small" color={colors.textSecondary}>
            {'\u2022'} Use a recent, clear photo of yourself
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            {'\u2022'} Show your face clearly in your main photo
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            {'\u2022'} Add photos of your hobbies and interests
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            {'\u2022'} Photos must be under 10MB each
          </AppText>
        </View>
      </View>

      {/* Photo Picker Modal */}
      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onPhotoSelected={handlePhotoSelected}
        title={photoPickerMode === 'profile' ? 'Update Profile Photo' : 'Add Photo'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 24,
  },
  section: {
    gap: 8,
  },
  hint: {
    marginBottom: 8,
  },
  mainPhotoContainer: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.backgroundLight,
    position: 'relative',
  },
  mainPhoto: {
    width: '100%',
    height: '100%',
  },
  placeholderPhoto: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.borderMedium,
    borderStyle: 'dashed',
    borderRadius: 20,
  },
  editBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridPhotoWrapper: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  photoNumber: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    minHeight: 100,
  },
  photoPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  tipsCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipsList: {
    gap: 4,
    paddingLeft: 4,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    width: '80%',
  },
  progressText: {
    marginTop: 16,
    marginBottom: 12,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
