import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { userApi, UserProfile } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";
import PhotoPicker from "@/src/components/profile/PhotoPicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_PADDING = 20;
const CARD_PADDING = 16;
const PHOTO_GAP = 8;
const PHOTOS_PER_ROW = 3;
const PHOTO_SIZE = (SCREEN_WIDTH - CONTENT_PADDING * 2 - CARD_PADDING * 2 - PHOTO_GAP * (PHOTOS_PER_ROW - 1)) / PHOTOS_PER_ROW;
const MAX_ADDITIONAL_PHOTOS = 6;

export default function MyProfileScreen() {
  const navigation = useNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [photoPickerMode, setPhotoPickerMode] = useState<"profile" | "additional">("profile");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [showPhotoActions, setShowPhotoActions] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);
  const [replacePhotoIndex, setReplacePhotoIndex] = useState<number | null>(null);

  // Fetch profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      setError(null);
      const data = await userApi.getCurrentUser();
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenPhotoPicker = (mode: "profile" | "additional", replaceIndex?: number) => {
    const additionalPhotos = getAdditionalPhotos();
    if (mode === "additional" && replaceIndex === undefined && additionalPhotos.length >= MAX_ADDITIONAL_PHOTOS) {
      Alert.alert(
        "Maximum Photos Reached",
        `You can have up to ${MAX_ADDITIONAL_PHOTOS} photos.\n\nTo add a new photo, please delete one first.`,
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    setPhotoPickerMode(mode);
    setReplacePhotoIndex(replaceIndex ?? null);
    setShowPhotoPicker(true);
  };

  const handlePhotoSelected = async (uri: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    try {
      let result;
      if (photoPickerMode === "profile") {
        result = await photoApi.uploadProfilePhoto(uri, (progress) => {
          setUploadProgress(progress);
        });
      } else {
        // If replacing a photo, delete old one first
        if (replacePhotoIndex !== null) {
          try {
            await photoApi.deleteAdditionalPhoto(replacePhotoIndex);
          } catch (e) {
            // Continue with upload even if delete fails
            console.log("Delete during replace failed:", e);
          }
        }
        result = await photoApi.uploadAdditionalPhotos([uri], (progress) => {
          setUploadProgress(progress);
        });
      }

      if (result.status === "success") {
        await loadProfile();
        Alert.alert(
          "Photo Added",
          "Your photo has been uploaded successfully!",
          [{ text: "Great!", style: "default" }]
        );
      } else {
        Alert.alert(
          "Upload Failed",
          result.message || "Could not upload photo. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      Alert.alert(
        "Upload Failed",
        err.message || "Could not upload photo. Please check your internet connection and try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplacePhotoIndex(null);
    }
  };

  const handleDeletePhoto = (index: number) => {
    Alert.alert(
      "Delete This Photo?",
      "This photo will be permanently removed from your profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Delete",
          style: "destructive",
          onPress: async () => {
            setIsUploading(true);
            try {
              await photoApi.deleteAdditionalPhoto(index);
              await loadProfile();
              Alert.alert(
                "Photo Deleted",
                "The photo has been removed from your profile.",
                [{ text: "OK" }]
              );
            } catch (err: any) {
              console.error("Failed to delete photo:", err);
              Alert.alert(
                "Could Not Delete",
                err.message || "Something went wrong. Please try again.",
                [{ text: "OK" }]
              );
            } finally {
              setIsUploading(false);
            }
          },
        },
      ]
    );
  };

  const handlePhotoTap = (photoUrl: string, index: number) => {
    setViewingPhotoUrl(photoUrl);
    setSelectedPhotoIndex(index);
    setShowPhotoActions(true);
  };

  const handleViewPhoto = () => {
    setShowPhotoActions(false);
    setTimeout(() => {
      setShowPhotoViewer(true);
    }, 300);
  };

  const handleReplacePhoto = () => {
    setShowPhotoActions(false);
    if (selectedPhotoIndex !== null) {
      setTimeout(() => {
        handleOpenPhotoPicker("additional", selectedPhotoIndex);
      }, 300);
    }
  };

  const handleDeleteFromActions = () => {
    setShowPhotoActions(false);
    if (selectedPhotoIndex !== null) {
      setTimeout(() => {
        handleDeletePhoto(selectedPhotoIndex);
      }, 300);
    }
  };

  const getPhotoUrl = () => {
    if (profile?.profilePhotoUrl) {
      return photoApi.getPhotoUrl(profile.profilePhotoUrl);
    }
    return "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80";
  };

  const getLocation = () => {
    if (profile) {
      return userApi.getLocationDisplay(profile);
    }
    return "Location not set";
  };

  const getInterests = (): string[] => {
    if (profile?.interests) {
      return userApi.parseInterests(profile.interests);
    }
    return [];
  };

  const getAdditionalPhotos = (): string[] => {
    if (profile?.additionalPhotos) {
      return userApi.parseAdditionalPhotos(profile.additionalPhotos);
    }
    return [];
  };

  // Loading state
  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary} style={{ marginTop: 16 }}>
              Loading your profile...
            </AppText>
          </View>
        </LinearGradient>
      </FullScreen>
    );
  }

  // Error state
  if (error) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
            <AppText size="body" color={colors.textSecondary} style={{ marginTop: 16, textAlign: "center" }}>
              {error}
            </AppText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadProfile}
              accessibilityRole="button"
              accessibilityLabel="Retry loading profile"
            >
              <AppText size="body" weight="semibold" color={colors.primary}>
                Tap to Retry
              </AppText>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </FullScreen>
    );
  }

  const interests = getInterests();
  const additionalPhotos = getAdditionalPhotos();

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.safeArea}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                style={styles.iconButton}
                onPress={() => navigation.navigate("Settings" as never)}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Photo with Edit Button */}
            <View style={styles.photoCard}>
              <Image source={{ uri: getPhotoUrl() || undefined }} style={styles.photo} />

              {/* Edit Photo Button */}
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={() => handleOpenPhotoPicker("profile")}
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
              >
                <Ionicons name="camera" size={20} color={colors.white} />
              </TouchableOpacity>

              {/* Verified Badge */}
              {profile?.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              )}
            </View>

            {/* Name & Location Card */}
            <View style={styles.card}>
              <View style={styles.nameRow}>
                <AppText size="h3" weight="bold">
                  {profile?.displayName || "Your Name"}{profile?.age ? `, ${profile.age}` : ""}
                </AppText>
                {profile?.verified && (
                  <View style={styles.verifiedTag}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                    <AppText size="tiny" weight="semibold" color={colors.success}>
                      Verified
                    </AppText>
                  </View>
                )}
              </View>
              <AppText size="body" weight="medium" color={colors.textSecondary}>
                {getLocation()}
              </AppText>
            </View>

            {/* About Me Card */}
            <View style={styles.card}>
              <AppText size="h4" weight="bold">
                About Me
              </AppText>
              <AppText size="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
                {profile?.bio || "Tell others about yourself..."}
              </AppText>
            </View>

            {/* ========== MY PHOTOS SECTION - COMPACT ========== */}
            <View style={styles.photosCard}>
              {/* Header */}
              <View style={styles.photosCardHeader}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  My Photos
                </AppText>
                <View style={styles.photoCountBadge}>
                  <AppText size="small" weight="bold" color={colors.primary}>
                    {additionalPhotos.length}/{MAX_ADDITIONAL_PHOTOS}
                  </AppText>
                </View>
              </View>

              {/* Photo Grid - 3 per row, compact */}
              <View style={styles.photoGrid}>
                {/* Existing Photos */}
                {additionalPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoItem}
                    onPress={() => handlePhotoTap(photoApi.getPhotoUrl(photo) || "", index)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Photo ${index + 1}. Tap for options`}
                  >
                    <Image
                      source={{ uri: photoApi.getPhotoUrl(photo) || undefined }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoBadge}>
                      <AppText size="tiny" weight="bold" color={colors.white}>
                        {index + 1}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Add Photo Button */}
                {additionalPhotos.length < MAX_ADDITIONAL_PHOTOS && (
                  <TouchableOpacity
                    style={styles.addPhotoItem}
                    onPress={() => handleOpenPhotoPicker("additional")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Add photo"
                  >
                    <Ionicons name="add-circle" size={32} color={colors.primary} />
                    <AppText size="tiny" weight="medium" color={colors.primary} style={{ marginTop: 4 }}>
                      Add
                    </AppText>
                  </TouchableOpacity>
                )}

                {/* Empty slots */}
                {Array.from({ length: Math.max(0, MAX_ADDITIONAL_PHOTOS - additionalPhotos.length - 1) }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.emptyPhotoSlot}>
                    <Ionicons name="image-outline" size={24} color={colors.borderMedium} />
                  </View>
                ))}
              </View>

              {/* Tip for empty state */}
              {additionalPhotos.length === 0 && (
                <View style={styles.tipRow}>
                  <Ionicons name="bulb-outline" size={16} color={colors.warning} />
                  <AppText size="small" color={colors.textSecondary} style={{ marginLeft: 6, flex: 1 }}>
                    Add photos to get more matches!
                  </AppText>
                </View>
              )}
            </View>

            {/* Interests Card */}
            {interests.length > 0 && (
              <View style={styles.card}>
                <AppText size="h4" weight="bold">
                  Interests
                </AppText>
                <View style={styles.interestsContainer}>
                  {interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <AppText size="small" weight="medium" color={colors.accentBlue}>
                        {interest}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Profile Completion Card */}
            {!profile?.profileCompleted && (
              <View style={[styles.card, styles.completionCard]}>
                <View style={styles.completionHeader}>
                  <Ionicons name="information-circle" size={24} color={colors.warning} />
                  <AppText size="body" weight="semibold" color={colors.textPrimary}>
                    Complete Your Profile
                  </AppText>
                </View>
                <AppText size="small" color={colors.textSecondary}>
                  Add more details to help others get to know you better.
                </AppText>
              </View>
            )}

            <GradientButton
              title="Edit Profile"
              style={{ marginTop: 20 }}
              onPress={() =>
                NavigationService.navigate("Settings", {
                  screen: "EditBasicInfoScreen",
                })
              }
            />
          </SafeAreaView>
        </ScrollView>
      </LinearGradient>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View style={styles.uploadProgressOverlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="small" color={colors.primary} />
            <AppText size="body" weight="semibold" style={{ marginTop: 12 }}>
              {uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Processing..."}
            </AppText>
            {uploadProgress > 0 && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
            )}
          </View>
        </View>
      )}

      {/* Photo Picker Modal */}
      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => {
          setShowPhotoPicker(false);
          setReplacePhotoIndex(null);
        }}
        onPhotoSelected={handlePhotoSelected}
        title={photoPickerMode === "profile" ? "Update Profile Photo" : (replacePhotoIndex !== null ? "Replace Photo" : "Add New Photo")}
      />

      {/* ========== PHOTO ACTIONS MODAL - COMPACT ========== */}
      <Modal
        visible={showPhotoActions}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoActions(false)}
      >
        <Pressable
          style={styles.actionModalOverlay}
          onPress={() => setShowPhotoActions(false)}
        >
          <View style={styles.actionSheet}>
            <View style={styles.actionSheetHandle} />

            <AppText size="h4" weight="bold" color={colors.textPrimary} style={{ textAlign: "center", marginBottom: 16 }}>
              Photo Options
            </AppText>

            {/* View */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewPhoto}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.accentMint }]}>
                <Ionicons name="eye" size={22} color={colors.accentBlue} />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary} style={{ flex: 1, marginLeft: 12 }}>
                View Full Size
              </AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Replace */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReplacePhoto}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.accentPeach }]}>
                <Ionicons name="camera" size={22} color={colors.primary} />
              </View>
              <AppText size="body" weight="semibold" color={colors.textPrimary} style={{ flex: 1, marginLeft: 12 }}>
                Replace Photo
              </AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Delete */}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={handleDeleteFromActions}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="trash" size={22} color={colors.error} />
              </View>
              <AppText size="body" weight="semibold" color={colors.error} style={{ flex: 1, marginLeft: 12 }}>
                Delete Photo
              </AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Cancel */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPhotoActions(false)}
              activeOpacity={0.7}
            >
              <AppText size="body" weight="semibold" color={colors.textSecondary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Photo Viewer Modal */}
      <Modal
        visible={showPhotoViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPhotoViewer(false)}
      >
        <View style={styles.photoViewerOverlay}>
          <View style={styles.photoViewerContainer}>
            {viewingPhotoUrl && (
              <Image
                source={{ uri: viewingPhotoUrl }}
                style={styles.viewerPhoto}
                resizeMode="contain"
              />
            )}

            {/* Close Button - Large for seniors */}
            <TouchableOpacity
              style={styles.closeViewerButton}
              onPress={() => setShowPhotoViewer(false)}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
            >
              <Ionicons name="close" size={32} color={colors.white} />
            </TouchableOpacity>

            {/* Bottom Actions */}
            <View style={styles.viewerBottomActions}>
              <TouchableOpacity
                style={styles.viewerActionButton}
                onPress={() => {
                  setShowPhotoViewer(false);
                  if (selectedPhotoIndex !== null) {
                    setTimeout(() => handleOpenPhotoPicker("additional", selectedPhotoIndex), 300);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Replace this photo"
              >
                <Ionicons name="camera" size={24} color={colors.white} />
                <AppText size="body" weight="semibold" color={colors.white}>
                  Replace
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.viewerActionButton, styles.viewerDeleteButton]}
                onPress={() => {
                  setShowPhotoViewer(false);
                  if (selectedPhotoIndex !== null) {
                    setTimeout(() => handleDeletePhoto(selectedPhotoIndex), 300);
                  }
                }}
                accessibilityRole="button"
                accessibilityLabel="Delete this photo"
              >
                <Ionicons name="trash" size={24} color={colors.white} />
                <AppText size="body" weight="semibold" color={colors.white}>
                  Delete
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: CONTENT_PADDING,
    paddingBottom: 40,
  },
  headerRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  photoCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.white,
    position: "relative",
  },
  photo: {
    width: "100%",
    height: 360,
  },
  editPhotoButton: {
    position: "absolute",
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6,
  },
  verifiedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 4,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.successLight || "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  interestTag: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  completionCard: {
    borderWidth: 1,
    borderColor: colors.warning,
    backgroundColor: colors.warningLight || "#FFF8E1",
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    minHeight: 56,
    justifyContent: "center",
  },

  // ========== PHOTOS SECTION STYLES ==========
  photosCard: {
    marginTop: 16,
    padding: CARD_PADDING,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
  photosCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoCountBadge: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
  },
  emptyPhotoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  // ========== UPLOAD PROGRESS ==========
  uploadProgressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
    width: "75%",
    maxWidth: 280,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: colors.borderLight,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 12,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 4,
  },

  // ========== ACTION SHEET MODAL ==========
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.borderMedium,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  deleteActionButton: {
    backgroundColor: "#FFF5F5",
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 4,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },

  // ========== PHOTO VIEWER ==========
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
  },
  photoViewerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerPhoto: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
    borderRadius: 12,
  },
  closeViewerButton: {
    position: "absolute",
    top: 50,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerBottomActions: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    gap: 12,
  },
  viewerActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.primary,
  },
  viewerDeleteButton: {
    backgroundColor: colors.error,
  },
});
