import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
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
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { photoApi } from "@/src/api/photoApi";
import { userApi, UserProfile } from "@/src/api/userApi";
import PhotoPicker from "@/src/components/profile/PhotoPicker";
import { useToast } from "@/src/context/ToastContext";
import {
  SCREEN_WIDTH,
  seniorResponsive,
  getPhotoGridSize,
  moderateScale,
  isSmallDevice,
  isMediumDevice,
} from "@/src/utility/responsive";

// Responsive sizing
const CONTENT_PADDING = seniorResponsive.contentPadding();
const CARD_PADDING = seniorResponsive.cardPadding();
const PHOTO_GAP = seniorResponsive.gapSmall();
const PHOTOS_PER_ROW = 3;
const PHOTO_SIZE = getPhotoGridSize(PHOTOS_PER_ROW, CONTENT_PADDING, CARD_PADDING, PHOTO_GAP);
const MAX_ADDITIONAL_PHOTOS = 6;

// Senior-friendly responsive sizing constants
const MIN_TOUCH_TARGET = seniorResponsive.touchTarget();
const SENIOR_ICON_SIZE = seniorResponsive.iconMedium();
const SENIOR_CARD_RADIUS = seniorResponsive.cardRadius();
const PROFILE_PHOTO_HEIGHT = seniorResponsive.profilePhotoHeight();

export default function MyProfileScreen() {
  const navigation = useNavigation();
  const toast = useToast();
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
      toast.info(`You can have up to ${MAX_ADDITIONAL_PHOTOS} photos. To add a new photo, please delete one first.`);
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
      } else if (replacePhotoIndex !== null) {
        // FIXED: Upload new photo FIRST to prevent data loss
        result = await photoApi.uploadAdditionalPhotos([uri], (progress) => {
          setUploadProgress(progress);
        });
        // Only delete old photo AFTER successful upload
        if (result.status === "success") {
          try {
            await photoApi.deleteAdditionalPhoto(replacePhotoIndex);
          } catch (deleteError) {
            console.log("Old photo cleanup failed:", deleteError);
          }
        }
      } else {
        result = await photoApi.uploadAdditionalPhotos([uri], (progress) => {
          setUploadProgress(progress);
        });
      }

      if (result.status === "success") {
        await loadProfile();
        toast.success("Your photo has been uploaded successfully!");
      } else {
        toast.error(result.message || "Could not upload photo. Please try again.");
      }
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      toast.error(err.message || "Could not upload photo. Please check your internet connection and try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setReplacePhotoIndex(null);
    }
  };

  const handleDeletePhoto = async (index: number) => {
    const shouldDelete = await toast.confirm({
      title: "Delete This Photo?",
      message: "This photo will be permanently removed from your profile.",
      type: "danger",
      confirmText: "Yes, Delete",
      cancelText: "Cancel",
    });

    if (!shouldDelete) return;

    setIsUploading(true);
    try {
      await photoApi.deleteAdditionalPhoto(index);
      await loadProfile();
      toast.success("The photo has been removed from your profile.");
    } catch (err: any) {
      console.error("Failed to delete photo:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
    }
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
    return "https://ui-avatars.com/api/?name=User&background=E8F8F7&color=33A9A2&size=400&bold=true";
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

  // Loading state - Senior friendly with large elements and clear messaging
  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading Your Profile"
        subtitle="Please wait a moment..."
      />
    );
  }

  // Error state - Senior friendly with large, clear elements
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
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
            </View>
            <AppText size="h2" weight="bold" color={colors.textPrimary} style={styles.errorTitle}>
              Something Went Wrong
            </AppText>
            <AppText size="h4" weight="medium" color={colors.textSecondary} style={styles.errorMessage}>
              {error}
            </AppText>
            <AppText size="body" color={colors.textMuted} style={styles.errorHint}>
              Please check your internet connection and try again
            </AppText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadProfile}
              accessibilityRole="button"
              accessibilityLabel="Try loading your profile again"
              accessibilityHint="Double tap to reload your profile"
            >
              <Ionicons name="refresh" size={SENIOR_ICON_SIZE} color={colors.white} style={{ marginRight: 12 }} />
              <AppText size="h3" weight="bold" color={colors.white}>
                Try Again
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
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={true}
        >
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.safeArea}
          >
            {/* Header with Settings Button - Extra large for seniors */}
            <View style={styles.headerRow}>
              <AppText size="h2" weight="bold" color={colors.textPrimary}>
                My Profile
              </AppText>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Open Settings"
                accessibilityHint="Double tap to go to settings"
                activeOpacity={0.7}
                style={styles.iconButton}
                onPress={() => navigation.navigate("Settings" as never)}
              >
                <Ionicons
                  name="settings-outline"
                  size={SENIOR_ICON_SIZE}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Profile Photo with Edit Button - Senior friendly */}
            <View style={styles.photoCard}>
              <Image source={{ uri: getPhotoUrl() || undefined }} style={styles.photo} />

              {/* Edit Photo Button - Extra large and prominent */}
              <TouchableOpacity
                style={styles.editPhotoButton}
                onPress={() => handleOpenPhotoPicker("profile")}
                accessibilityRole="button"
                accessibilityLabel="Change your profile photo"
                accessibilityHint="Double tap to select a new photo"
              >
                <Ionicons name="camera" size={SENIOR_ICON_SIZE} color={colors.white} />
                <AppText size="body" weight="bold" color={colors.white} style={{ marginTop: 4 }}>
                  Change Photo
                </AppText>
              </TouchableOpacity>

              {/* Verified Badge - Larger for visibility */}
              {profile?.verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={32} color={colors.success} />
                </View>
              )}
            </View>

            {/* Name & Location Card - Enhanced for seniors */}
            <View style={styles.card}>
              <View style={styles.nameRow}>
                <AppText size="h1" weight="bold" color={colors.textPrimary}>
                  {profile?.displayName || "Your Name"}
                </AppText>
                {profile?.age && (
                  <View style={styles.ageBadge}>
                    <AppText size="h3" weight="bold" color={colors.white}>
                      {profile.age}
                    </AppText>
                  </View>
                )}
              </View>
              {profile?.verified && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={24} color={colors.success} />
                  <AppText size="body" weight="bold" color={colors.success}>
                    Verified Profile
                  </AppText>
                </View>
              )}
              <View style={styles.locationRow}>
                <View style={styles.locationIconContainer}>
                  <Ionicons name="location" size={28} color={colors.primary} />
                </View>
                <AppText size="h4" weight="semibold" color={colors.textSecondary} style={{ marginLeft: 12, flex: 1 }}>
                  {getLocation()}
                </AppText>
              </View>
            </View>

            {/* About Me Card - Senior friendly with larger text */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="person-outline" size={28} color={colors.primary} />
                <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginLeft: 10 }}>
                  About Me
                </AppText>
              </View>
              <AppText size="h4" weight="normal" color={colors.textPrimary} style={styles.bioText}>
                {profile?.bio || "Tap 'Edit My Profile' below to tell others about yourself..."}
              </AppText>
            </View>

            {/* ========== MY PHOTOS SECTION - Senior Friendly ========== */}
            <View style={styles.photosCard}>
              {/* Header with icon */}
              <View style={styles.photosCardHeader}>
                <View style={styles.cardHeader}>
                  <Ionicons name="images-outline" size={28} color={colors.primary} />
                  <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginLeft: 10 }}>
                    My Photos
                  </AppText>
                </View>
                <View style={styles.photoCountBadge}>
                  <AppText size="body" weight="bold" color={colors.primary}>
                    {additionalPhotos.length} / {MAX_ADDITIONAL_PHOTOS}
                  </AppText>
                </View>
              </View>

              {/* Photo Grid - Senior friendly with larger touch targets */}
              <View style={styles.photoGrid}>
                {/* Existing Photos */}
                {additionalPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.photoItem}
                    onPress={() => handlePhotoTap(photoApi.getPhotoUrl(photo) || "", index)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Photo ${index + 1}. Tap to view options`}
                    accessibilityHint="Double tap to see view, replace, and delete options"
                  >
                    <Image
                      source={{ uri: photoApi.getPhotoUrl(photo) || undefined }}
                      style={styles.photoImage}
                    />
                    <View style={styles.photoBadge}>
                      <AppText size="small" weight="bold" color={colors.white}>
                        {index + 1}
                      </AppText>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Add Photo Button - Extra prominent for seniors */}
                {additionalPhotos.length < MAX_ADDITIONAL_PHOTOS && (
                  <TouchableOpacity
                    style={styles.addPhotoItem}
                    onPress={() => handleOpenPhotoPicker("additional")}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Add a new photo"
                    accessibilityHint="Double tap to choose a photo from your device"
                  >
                    <Ionicons name="add-circle" size={48} color={colors.primary} />
                    <AppText size="body" weight="bold" color={colors.primary} style={{ marginTop: 8 }}>
                      Add Photo
                    </AppText>
                  </TouchableOpacity>
                )}

                {/* Empty slots - visual indicators */}
                {Array.from({ length: Math.max(0, MAX_ADDITIONAL_PHOTOS - additionalPhotos.length - 1) }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.emptyPhotoSlot}>
                    <Ionicons name="image-outline" size={28} color={colors.borderMedium} />
                  </View>
                ))}
              </View>

              {/* Helpful tip for empty state - Senior friendly messaging */}
              {additionalPhotos.length === 0 && (
                <View style={styles.tipRow}>
                  <View style={styles.tipIconContainer}>
                    <Ionicons name="bulb-outline" size={28} color={colors.warning} />
                  </View>
                  <AppText size="body" weight="semibold" color={colors.textPrimary} style={{ marginLeft: 12, flex: 1, lineHeight: 26 }}>
                    Tip: Adding photos helps others get to know you better!
                  </AppText>
                </View>
              )}
            </View>

            {/* Interests Card - Senior friendly */}
            {interests.length > 0 && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="heart-outline" size={28} color={colors.primary} />
                  <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginLeft: 10 }}>
                    My Interests
                  </AppText>
                </View>
                <View style={styles.interestsContainer}>
                  {interests.map((interest, index) => (
                    <View key={index} style={styles.interestTag}>
                      <AppText size="body" weight="bold" color={colors.accentBlue}>
                        {interest}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Profile Completion Card - Senior friendly with clear action */}
            {!profile?.profileCompleted && (
              <View style={[styles.card, styles.completionCard]}>
                <View style={styles.completionHeader}>
                  <View style={styles.completionIconContainer}>
                    <Ionicons name="information-circle" size={36} color={colors.warning} />
                  </View>
                  <View style={styles.completionTextContainer}>
                    <AppText size="h3" weight="bold" color={colors.textPrimary}>
                      Complete Your Profile
                    </AppText>
                    <AppText size="body" weight="medium" color={colors.textSecondary} style={{ marginTop: 4 }}>
                      Get more matches!
                    </AppText>
                  </View>
                </View>
                <AppText size="h4" weight="medium" color={colors.textPrimary} style={styles.completionMessage}>
                  Adding more details helps others get to know you better and increases your chances of finding matches.
                </AppText>
              </View>
            )}

            {/* Main Action Button - Extra prominent for seniors */}
            <View style={styles.actionButtonContainer}>
              <GradientButton
                title="Edit My Profile"
                textSize="h3"
                onPress={() =>
                  NavigationService.navigate("Settings", {
                    screen: "EditBasicInfoScreen",
                  })
                }
                accessibilityLabel="Edit your profile"
                accessibilityHint="Double tap to update your profile information"
              />
            </View>
          </SafeAreaView>
        </ScrollView>
      </LinearGradient>

      {/* Upload Progress Overlay */}
      {isUploading && (
        <View style={styles.uploadProgressOverlay}>
          <View style={styles.progressCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginTop: 16 }}>
              {uploadProgress > 0 ? `Uploading...` : "Processing..."}
            </AppText>
            {uploadProgress > 0 && (
              <>
                <AppText size="h2" weight="bold" color={colors.primary} style={{ marginTop: 8 }}>
                  {uploadProgress}%
                </AppText>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                </View>
              </>
            )}
            <AppText size="body" color={colors.textSecondary} style={{ marginTop: 12, textAlign: "center" }}>
              Please wait...
            </AppText>
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

      {/* ========== PHOTO ACTIONS MODAL - Senior Friendly ========== */}
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

            <AppText size="h2" weight="bold" color={colors.textPrimary} style={styles.actionSheetTitle}>
              What would you like to do?
            </AppText>

            {/* View - Large button for seniors */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleViewPhoto}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="View this photo in full size"
              accessibilityHint="Double tap to see the photo larger"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.accentMint }]}>
                <Ionicons name="eye" size={SENIOR_ICON_SIZE} color={colors.accentBlue} />
              </View>
              <View style={styles.actionTextContainer}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  View Photo
                </AppText>
                <AppText size="body" weight="medium" color={colors.textSecondary}>
                  See full size image
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Replace - Large button for seniors */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleReplacePhoto}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Replace this photo with a different one"
              accessibilityHint="Double tap to choose a new photo"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: colors.accentPeach }]}>
                <Ionicons name="camera" size={SENIOR_ICON_SIZE} color={colors.primary} />
              </View>
              <View style={styles.actionTextContainer}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  Replace Photo
                </AppText>
                <AppText size="body" weight="medium" color={colors.textSecondary}>
                  Choose a different photo
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Delete - Large button with warning */}
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteActionButton]}
              onPress={handleDeleteFromActions}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Delete this photo permanently"
              accessibilityHint="Double tap to remove this photo from your profile"
            >
              <View style={[styles.actionIconCircle, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="trash" size={SENIOR_ICON_SIZE} color={colors.error} />
              </View>
              <View style={styles.actionTextContainer}>
                <AppText size="h4" weight="bold" color={colors.error}>
                  Delete Photo
                </AppText>
                <AppText size="body" weight="medium" color={colors.textSecondary}>
                  Remove from your profile
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textMuted} />
            </TouchableOpacity>

            {/* Cancel - Extra prominent */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPhotoActions(false)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
              accessibilityHint="Double tap to close this menu"
            >
              <AppText size="h4" weight="bold" color={colors.textSecondary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Photo Viewer Modal - Senior Friendly */}
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

            {/* Close Button - Extra Large for seniors */}
            <TouchableOpacity
              style={styles.closeViewerButton}
              onPress={() => setShowPhotoViewer(false)}
              accessibilityRole="button"
              accessibilityLabel="Close photo viewer"
              accessibilityHint="Double tap to go back"
            >
              <Ionicons name="close" size={44} color={colors.white} />
            </TouchableOpacity>

            {/* Bottom Actions - Senior friendly large buttons */}
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
                accessibilityHint="Double tap to choose a different photo"
              >
                <Ionicons name="camera" size={SENIOR_ICON_SIZE} color={colors.white} />
                <AppText size="h4" weight="bold" color={colors.white}>
                  Replace Photo
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
                accessibilityLabel="Delete this photo permanently"
                accessibilityHint="Double tap to remove this photo from your profile"
              >
                <Ionicons name="trash" size={SENIOR_ICON_SIZE} color={colors.white} />
                <AppText size="h4" weight="bold" color={colors.white}>
                  Delete Photo
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FullScreen>
  );
}

// Responsive helper values
const LOCATION_ICON_SIZE = isSmallDevice ? 40 : isMediumDevice ? 44 : 48;
const TIP_ICON_SIZE = isSmallDevice ? 40 : isMediumDevice ? 44 : 48;
const COMPLETION_ICON_SIZE = isSmallDevice ? 48 : isMediumDevice ? 52 : 56;
const LOADING_ICON_SIZE = isSmallDevice ? 80 : isMediumDevice ? 90 : 100;
const ERROR_ICON_SIZE = isSmallDevice ? 100 : isMediumDevice ? 110 : 120;
const ACTION_ICON_SIZE = isSmallDevice ? 48 : isMediumDevice ? 54 : 60;
const CLOSE_BUTTON_SIZE = isSmallDevice ? 64 : isMediumDevice ? 72 : 80;
const PHOTO_BADGE_SIZE = isSmallDevice ? 24 : isMediumDevice ? 26 : 28;
// Removed fixed minWidth - buttons now use flex: 1 to share space evenly
const MODAL_BUTTON_HEIGHT = seniorResponsive.modalButtonHeight();

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
    paddingBottom: moderateScale(50),
  },

  // ========== HEADER - Responsive ==========
  headerRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: moderateScale(16),
    paddingTop: moderateScale(8),
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(10),
    elevation: 5,
  },

  // ========== PHOTO CARD - Responsive ==========
  photoCard: {
    overflow: "hidden",
    borderRadius: SENIOR_CARD_RADIUS,
    backgroundColor: colors.white,
    position: "relative",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: moderateScale(6) },
    shadowRadius: moderateScale(14),
    elevation: 6,
  },
  photo: {
    width: "100%",
    height: PROFILE_PHOTO_HEIGHT,
  },
  editPhotoButton: {
    position: "absolute",
    bottom: moderateScale(16),
    right: moderateScale(16),
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(20),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(8),
    elevation: 8,
    minHeight: moderateScale(52),
  },
  verifiedBadge: {
    position: "absolute",
    top: moderateScale(16),
    right: moderateScale(16),
    backgroundColor: colors.white,
    borderRadius: moderateScale(18),
    padding: moderateScale(6),
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowRadius: moderateScale(5),
    elevation: 4,
  },

  // ========== CARDS - Responsive ==========
  card: {
    marginTop: moderateScale(16),
    padding: CARD_PADDING,
    backgroundColor: colors.white,
    borderRadius: SENIOR_CARD_RADIUS,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowRadius: moderateScale(8),
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: moderateScale(10),
    marginBottom: moderateScale(10),
  },
  ageBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(18),
    minWidth: moderateScale(48),
    alignItems: "center",
  },
  verifiedTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
    backgroundColor: colors.successLight || "#E8F5E9",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(14),
    marginBottom: moderateScale(10),
    alignSelf: "flex-start",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(6),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  locationIconContainer: {
    width: LOCATION_ICON_SIZE,
    height: LOCATION_ICON_SIZE,
    borderRadius: LOCATION_ICON_SIZE / 2,
    backgroundColor: colors.accentPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  bioText: {
    lineHeight: moderateScale(28),
    marginTop: moderateScale(4),
  },

  // ========== INTERESTS - Responsive ==========
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },
  interestTag: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(20),
    minHeight: moderateScale(44),
    justifyContent: "center",
  },

  // ========== COMPLETION CARD - Responsive ==========
  completionCard: {
    borderWidth: 2,
    borderColor: colors.warning,
    backgroundColor: colors.warningLight || "#FFF8E1",
  },
  completionHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: moderateScale(12),
  },
  completionIconContainer: {
    width: COMPLETION_ICON_SIZE,
    height: COMPLETION_ICON_SIZE,
    borderRadius: COMPLETION_ICON_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  completionTextContainer: {
    flex: 1,
  },
  completionMessage: {
    lineHeight: moderateScale(26),
  },

  // ========== ACTION BUTTON CONTAINER ==========
  actionButtonContainer: {
    marginTop: moderateScale(24),
    marginBottom: moderateScale(16),
  },

  // ========== LOADING & ERROR STATES - Responsive ==========
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(24),
  },
  loadingIconContainer: {
    width: LOADING_ICON_SIZE,
    height: LOADING_ICON_SIZE,
    borderRadius: LOADING_ICON_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowRadius: moderateScale(10),
    elevation: 4,
  },
  loadingTitle: {
    marginTop: moderateScale(22),
    textAlign: "center",
  },
  loadingSubtitle: {
    marginTop: moderateScale(10),
    textAlign: "center",
  },
  errorIconContainer: {
    width: ERROR_ICON_SIZE,
    height: ERROR_ICON_SIZE,
    borderRadius: ERROR_ICON_SIZE / 2,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    marginTop: moderateScale(22),
    textAlign: "center",
  },
  errorMessage: {
    marginTop: moderateScale(12),
    textAlign: "center",
    paddingHorizontal: moderateScale(16),
  },
  errorHint: {
    marginTop: moderateScale(10),
    textAlign: "center",
    paddingHorizontal: moderateScale(16),
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(24),
    paddingHorizontal: moderateScale(36),
    paddingVertical: moderateScale(18),
    borderRadius: moderateScale(32),
    backgroundColor: colors.primary,
    minHeight: MIN_TOUCH_TARGET,
    minWidth: moderateScale(200),
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(10),
    elevation: 6,
  },

  // ========== PHOTOS SECTION - Responsive ==========
  photosCard: {
    marginTop: moderateScale(16),
    padding: CARD_PADDING,
    backgroundColor: colors.white,
    borderRadius: SENIOR_CARD_RADIUS,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowRadius: moderateScale(8),
    elevation: 3,
  },
  photosCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  photoCountBadge: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(12),
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: PHOTO_GAP,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: moderateScale(14),
    overflow: "hidden",
    position: "relative",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  photoBadge: {
    position: "absolute",
    top: moderateScale(6),
    left: moderateScale(6),
    width: PHOTO_BADGE_SIZE,
    height: PHOTO_BADGE_SIZE,
    borderRadius: PHOTO_BADGE_SIZE / 2,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  addPhotoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: moderateScale(14),
    borderWidth: isSmallDevice ? 2 : 3,
    borderColor: colors.primary,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.accentMint,
  },
  emptyPhotoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: moderateScale(14),
    borderWidth: isSmallDevice ? 1 : 2,
    borderColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(12),
    paddingTop: moderateScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tipIconContainer: {
    width: TIP_ICON_SIZE,
    height: TIP_ICON_SIZE,
    borderRadius: TIP_ICON_SIZE / 2,
    backgroundColor: colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },

  // ========== UPLOAD PROGRESS - Responsive ==========
  uploadProgressOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.97)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  progressCard: {
    backgroundColor: colors.white,
    borderRadius: SENIOR_CARD_RADIUS,
    padding: moderateScale(24),
    alignItems: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(12),
    elevation: 8,
    width: isSmallDevice ? "90%" : "85%",
    maxWidth: moderateScale(320),
  },
  progressBar: {
    width: "100%",
    height: moderateScale(10),
    backgroundColor: colors.borderLight,
    borderRadius: moderateScale(5),
    overflow: "hidden",
    marginTop: moderateScale(12),
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: moderateScale(5),
  },

  // ========== ACTION SHEET MODAL - Responsive ==========
  actionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    paddingHorizontal: CONTENT_PADDING,
    paddingTop: moderateScale(10),
    paddingBottom: moderateScale(32),
  },
  actionSheetHandle: {
    width: moderateScale(40),
    height: moderateScale(4),
    backgroundColor: colors.borderMedium,
    borderRadius: moderateScale(2),
    alignSelf: "center",
    marginBottom: moderateScale(12),
  },
  actionSheetTitle: {
    textAlign: "center",
    marginBottom: moderateScale(18),
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    padding: moderateScale(14),
    borderRadius: moderateScale(16),
    marginBottom: moderateScale(10),
    minHeight: MODAL_BUTTON_HEIGHT,
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: moderateScale(12),
  },
  deleteActionButton: {
    backgroundColor: "#FFF5F5",
  },
  actionIconCircle: {
    width: ACTION_ICON_SIZE,
    height: ACTION_ICON_SIZE,
    borderRadius: ACTION_ICON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateScale(18),
    marginTop: moderateScale(8),
    backgroundColor: colors.backgroundLight,
    borderRadius: moderateScale(16),
    minHeight: MIN_TOUCH_TARGET,
  },

  // ========== PHOTO VIEWER - Responsive ==========
  photoViewerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.97)",
  },
  photoViewerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewerPhoto: {
    width: SCREEN_WIDTH - moderateScale(24),
    height: SCREEN_WIDTH - moderateScale(24),
    borderRadius: moderateScale(14),
  },
  closeViewerButton: {
    position: "absolute",
    top: moderateScale(50),
    right: moderateScale(16),
    width: CLOSE_BUTTON_SIZE,
    height: CLOSE_BUTTON_SIZE,
    borderRadius: CLOSE_BUTTON_SIZE / 2,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: isSmallDevice ? 2 : 3,
    borderColor: colors.white,
  },
  viewerBottomActions: {
    position: "absolute",
    bottom: moderateScale(50),
    left: 0,
    right: 0,
    flexDirection: "row",
    gap: isSmallDevice ? moderateScale(8) : moderateScale(12),
    paddingHorizontal: isSmallDevice ? moderateScale(12) : moderateScale(16),
  },
  viewerActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: isSmallDevice ? moderateScale(6) : moderateScale(8),
    paddingHorizontal: isSmallDevice ? moderateScale(12) : moderateScale(16),
    paddingVertical: isSmallDevice ? moderateScale(14) : moderateScale(16),
    borderRadius: moderateScale(28),
    backgroundColor: colors.primary,
    minHeight: MIN_TOUCH_TARGET,
  },
  viewerDeleteButton: {
    backgroundColor: colors.error,
  },
});
