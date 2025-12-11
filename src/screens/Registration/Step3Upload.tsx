import { Ionicons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";

import FullScreen from "@/src/components/layout/FullScreen";
import ProgressBar from "../../components/ui/ProgressBar";
import colors from "../../config/colors";
import { useSlideUp } from "../../hooks/useFadeIn";
import { useToast } from "@/src/context/ToastContext";
import { Step3Nav } from "../../navigation/NavigationTypes";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../api/authApi";
import { API_BASE_URL } from "../../api/config";

interface Props {
  navigation: Step3Nav;
}

interface FormValues {
  photos: string[];
  profilePhoto: string;
}

const DEFAULT_PROFILE_PHOTO = "https://ui-avatars.com/api/?name=Tander+User&background=F5A14B&color=fff&size=256";

// Helper to convert local URI to file object for upload
const uriToFile = (uri: string, index: number, type: string = 'profile') => {
  const filename = uri.split('/').pop() || `${type}_photo_${index}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const mimeType = match ? `image/${match[1]}` : 'image/jpeg';

  return {
    uri,
    type: mimeType,
    name: filename,
  };
};

export default function Step3Upload({ navigation }: Props) {
  const { values, setFieldValue } = useFormikContext<FormValues>();
  const toast = useToast();
  const { phase1Data, registrationFlow } = useAuth();

  // Profile photo (main photo)
  const [profilePhoto, setProfilePhoto] = useState<string>(values.profilePhoto || "");

  // Additional photos (up to 5)
  const [additionalPhotos, setAdditionalPhotos] = useState<string[]>(
    values.photos?.slice(1) || []
  );

  // Upload state
  const [isUploading, setIsUploading] = useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const profileCardAnim = useSlideUp(500, 100, 30);
  const photosCardAnim = useSlideUp(500, 200, 30);
  const bottomNavAnim = useSlideUp(600, 300, 40);

  const hasProfilePhoto = !!profilePhoto;
  const additionalPhotoCount = additionalPhotos.filter(p => p !== "").length;

  // Pick profile photo
  const handlePickProfilePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      setFieldValue("profilePhoto", uri);
    }
  };

  // Take profile photo with camera
  const handleTakeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please enable camera access to take photos.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setProfilePhoto(uri);
      setFieldValue("profilePhoto", uri);
    }
  };

  // Remove profile photo
  const handleRemoveProfilePhoto = () => {
    setProfilePhoto("");
    setFieldValue("profilePhoto", "");
  };

  // Pick additional photo
  const handlePickAdditionalPhoto = async () => {
    if (additionalPhotoCount >= 5) {
      toast.warning("You can only upload up to 5 additional photos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const newPhotos = [...additionalPhotos, uri];
      setAdditionalPhotos(newPhotos);
      setFieldValue("photos", [profilePhoto, ...newPhotos].filter(Boolean));
    }
  };

  // Remove additional photo
  const handleRemoveAdditionalPhoto = (index: number) => {
    const newPhotos = additionalPhotos.filter((_, i) => i !== index);
    setAdditionalPhotos(newPhotos);
    setFieldValue("photos", [profilePhoto, ...newPhotos].filter(Boolean));
  };

  const handleContinue = async () => {
    const username = phase1Data?.username || registrationFlow?.username;
    const hasPhotosToUpload = profilePhoto || additionalPhotos.length > 0;

    // If we have photos and a username, upload them
    if (hasPhotosToUpload && username) {
      setIsUploading(true);
      try {
        // Prepare profile photo for upload
        const profilePhotoFile = profilePhoto
          ? uriToFile(profilePhoto, 0, 'profile')
          : undefined;

        // Prepare additional photos for upload
        const additionalPhotoFiles = additionalPhotos
          .filter(p => p !== "")
          .map((photo, index) => uriToFile(photo, index, 'additional'));

        // Upload photos to backend
        const response = await authApi.uploadPhotos(
          username,
          profilePhotoFile,
          additionalPhotoFiles.length > 0 ? additionalPhotoFiles : undefined
        );

        if (response.status === 'success') {
          // Store the server URLs in Formik
          const serverProfilePhotoUrl = response.profilePhotoUrl
            ? `${API_BASE_URL}${response.profilePhotoUrl}`
            : DEFAULT_PROFILE_PHOTO;
          const serverAdditionalUrls = (response.additionalPhotoUrls || [])
            .map(url => `${API_BASE_URL}${url}`);

          setFieldValue("profilePhoto", serverProfilePhotoUrl);
          setFieldValue("photos", [serverProfilePhotoUrl, ...serverAdditionalUrls].filter(Boolean));

          toast.success("Photos uploaded successfully!");
        } else {
          // If upload fails, still proceed but with local URIs
          console.warn('Photo upload returned error status:', response.message);
          toast.warning("Photos will be saved locally. You can retry uploading later.");

          const allPhotos = [profilePhoto, ...additionalPhotos].filter(Boolean);
          setFieldValue("photos", allPhotos);
          setFieldValue("profilePhoto", profilePhoto || DEFAULT_PROFILE_PHOTO);
        }
      } catch (error: any) {
        console.error('Photo upload error:', error);
        toast.warning("Photos will be saved locally. You can retry uploading later.");

        // Fall back to local storage
        const allPhotos = [profilePhoto, ...additionalPhotos].filter(Boolean);
        setFieldValue("photos", allPhotos);
        setFieldValue("profilePhoto", profilePhoto || DEFAULT_PROFILE_PHOTO);
      } finally {
        setIsUploading(false);
      }
    } else {
      // No photos to upload, just save to Formik
      const allPhotos = [profilePhoto, ...additionalPhotos].filter(Boolean);
      setFieldValue("photos", allPhotos);
      setFieldValue("profilePhoto", profilePhoto || DEFAULT_PROFILE_PHOTO);
    }

    navigation.navigate("Step4");
  };

  const handleSkip = () => {
    // Set default profile photo and empty photos array
    setFieldValue("photos", []);
    setFieldValue("profilePhoto", DEFAULT_PROFILE_PHOTO);

    toast.info("You can add photos later from your profile settings.", 3000);
    navigation.navigate("Step4");
  };

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={["#C8E6E2", "#FFE2C1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top"]} style={styles.headerView}>
        <ProgressBar step={3} total={4} />

        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim.opacity,
              transform: [{ translateY: headerAnim.translateY }],
            },
          ]}
        >
          <View style={styles.titleRow}>
            <Ionicons name="images" size={28} color={colors.primary} />
            <Text style={styles.title}>Add Your Photos</Text>
          </View>
          <Text style={styles.subtitle}>
            Show others who you are! This step is optional.
          </Text>
        </Animated.View>

        {/* Skip Button */}
        <Animated.View
          style={{
            opacity: headerAnim.opacity,
            transform: [{ translateY: headerAnim.translateY }],
          }}
        >
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <Animated.View
            style={{
              opacity: profileCardAnim.opacity,
              transform: [{ translateY: profileCardAnim.translateY }],
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="person-circle" size={22} color={colors.primary} />
                  <Text style={styles.cardTitle}>Profile Photo</Text>
                </View>
                <View style={styles.optionalBadge}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </View>
              <Text style={styles.cardSubtitle}>
                This will be your main photo that others see first.
              </Text>

              {hasProfilePhoto ? (
                <View style={styles.profilePhotoContainer}>
                  <Image source={{ uri: profilePhoto }} style={styles.profilePhoto} />
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveProfilePhoto}
                  >
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                  <View style={styles.profileBadge}>
                    <Ionicons name="star" size={14} color={colors.white} />
                    <Text style={styles.profileBadgeText}>Main</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={styles.uploadOption}
                    onPress={handlePickProfilePhoto}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="images" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadOptionText}>Choose Photo</Text>
                  </TouchableOpacity>

                  <View style={styles.uploadDivider}>
                    <Text style={styles.uploadDividerText}>or</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.uploadOption}
                    onPress={handleTakeProfilePhoto}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera" size={28} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadOptionText}>Take Photo</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Default avatar preview */}
              {!hasProfilePhoto && (
                <View style={styles.defaultPreview}>
                  <Text style={styles.defaultPreviewText}>
                    If skipped, we'll use a default avatar
                  </Text>
                  <Image
                    source={{ uri: DEFAULT_PROFILE_PHOTO }}
                    style={styles.defaultAvatar}
                  />
                </View>
              )}
            </View>
          </Animated.View>

          {/* Additional Photos Section */}
          <Animated.View
            style={{
              opacity: photosCardAnim.opacity,
              transform: [{ translateY: photosCardAnim.translateY }],
            }}
          >
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardTitleRow}>
                  <Ionicons name="grid" size={20} color={colors.primary} />
                  <Text style={styles.cardTitle}>More Photos</Text>
                </View>
                <Text style={styles.photoCount}>{additionalPhotoCount}/5</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Add more photos to show your personality and interests.
              </Text>

              {/* Photo Grid */}
              <View style={styles.photoGrid}>
                {additionalPhotos.map((photo, index) => (
                  <View key={index} style={styles.photoGridItem}>
                    <Image source={{ uri: photo }} style={styles.gridPhoto} />
                    <TouchableOpacity
                      style={styles.removeGridButton}
                      onPress={() => handleRemoveAdditionalPhoto(index)}
                    >
                      <Ionicons name="close-circle" size={24} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}

                {/* Add photo button */}
                {additionalPhotoCount < 5 && (
                  <TouchableOpacity
                    style={styles.addPhotoButton}
                    onPress={handlePickAdditionalPhoto}
                  >
                    <Ionicons name="add" size={32} color={colors.primary} />
                    <Text style={styles.addPhotoText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Tips */}
              <View style={styles.tipContainer}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={styles.tipText}>
                  Tip: Add photos of your hobbies, travel, or with friends!
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation */}
        <Animated.View
          style={[
            styles.bottomNav,
            {
              opacity: bottomNavAnim.opacity,
              transform: [{ translateY: bottomNavAnim.translateY }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !hasProfilePhoto && styles.nextButtonSecondary,
              isUploading && styles.nextButtonDisabled,
            ]}
            onPress={handleContinue}
            activeOpacity={0.8}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.nextText}>Uploading...</Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextText, !hasProfilePhoto && styles.nextTextSecondary]}>
                  {hasProfilePhoto ? "Continue" : "Skip Photos"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={hasProfilePhoto ? colors.white : colors.primary}
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  headerView: {
    padding: 20,
  },
  header: {
    marginBottom: 8,
    marginTop: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },

  // Card styles
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  optionalBadge: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.accentTeal,
  },
  photoCount: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Profile Photo
  profilePhotoContainer: {
    alignItems: "center",
    position: "relative",
  },
  profilePhoto: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  removeButton: {
    position: "absolute",
    top: 0,
    right: "25%",
    backgroundColor: colors.white,
    borderRadius: 14,
  },
  profileBadge: {
    position: "absolute",
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  profileBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
  },

  // Upload Options
  uploadOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 24,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
  },
  uploadOption: {
    alignItems: "center",
    gap: 8,
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  uploadDivider: {
    paddingHorizontal: 16,
  },
  uploadDividerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },

  // Default preview
  defaultPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 12,
  },
  defaultPreviewText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
  },

  // Photo Grid
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  photoGridItem: {
    position: "relative",
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  removeGridButton: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: colors.white,
    borderRadius: 12,
  },
  addPhotoButton: {
    width: "30%",
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  addPhotoText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },

  // Tips
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: "#92400E",
  },

  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonSecondary: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  nextTextSecondary: {
    color: colors.primary,
  },
});
