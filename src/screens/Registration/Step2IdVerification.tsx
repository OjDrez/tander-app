import { Ionicons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import React, { useState, useRef, useEffect } from "react";
import {
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ScreenOrientation from "expo-screen-orientation";

import FullScreen from "@/src/components/layout/FullScreen";
import ProgressBar from "@/src/components/ui/ProgressBar";
import colors from "@/src/config/colors";
import { useSlideUp } from "@/src/hooks/useFadeIn";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/context/ToastContext";
import { Step2Nav } from "@/src/navigation/NavigationTypes";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface Props {
  navigation: Step2Nav;
  /** If true, screen is used from Settings (no Formik context, no progress bar) */
  isSettings?: boolean;
}

interface FormValues {
  idPhotoFront: string;
}

/**
 * Custom hook to safely use Formik context
 * Returns null if not wrapped in Formik provider
 */
function useFormikContextSafe<T>() {
  try {
    return useFormikContext<T>();
  } catch {
    return null;
  }
}

export default function Step2IdVerification({ navigation, isSettings = false }: Props) {
  // Try to get Formik context (will be null if accessed from Settings)
  const formikContext = useFormikContextSafe<FormValues>();
  const { verifyId, phase1Data, registrationFlow, user } = useAuth();
  const toast = useToast();

  // Get initial value from Formik if available
  const initialPhoto = formikContext?.values?.idPhotoFront || "";
  const [idPhotoFront, setIdPhotoFront] = useState<string>(initialPhoto);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isLandscape, setIsLandscape] = useState(false);

  const cameraRef = useRef<any>(null);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 200, 40);
  const buttonAnim = useSlideUp(600, 300, 30);

  // Lock to landscape when camera opens, unlock when closes
  useEffect(() => {
    if (showCamera) {
      lockToLandscape();
    } else {
      unlockOrientation();
    }

    return () => {
      unlockOrientation();
    };
  }, [showCamera]);

  const lockToLandscape = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
      setIsLandscape(true);
    } catch (error) {
      console.log("Could not lock orientation:", error);
    }
  };

  const unlockOrientation = async () => {
    try {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsLandscape(false);
    } catch (error) {
      console.log("Could not unlock orientation:", error);
    }
  };

  // Helper to update Formik if available
  const updateFormikField = (field: string, value: string) => {
    if (formikContext?.setFieldValue) {
      formikContext.setFieldValue(field, value);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setIdPhotoFront(uri);
      updateFormikField("idPhotoFront", uri);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera Permission",
          "Please enable camera access in your device settings to scan your ID."
        );
        return;
      }
    }
    setShowCamera(true);
  };

  const handleTakePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });

        setIdPhotoFront(photo.uri);
        updateFormikField("idPhotoFront", photo.uri);
        setShowCamera(false);
      } catch (error) {
        console.error("Error taking photo:", error);
        toast.error("Failed to take photo. Please try again.");
      }
    }
  };

  const handleCloseCamera = () => {
    setShowCamera(false);
  };

  const handleSubmitVerification = async () => {
    if (!idPhotoFront) {
      toast.warning("Please upload a photo of your ID card.");
      return;
    }

    // Get username from different sources depending on context
    const username = isSettings
      ? user?.username
      : (phase1Data?.username || registrationFlow?.username);

    if (!username) {
      toast.error(isSettings
        ? "Please log in to verify your ID."
        : "Session expired. Please start registration again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const frontPhoto = {
        uri: idPhotoFront,
        type: "image/jpeg",
        name: "id_front.jpg",
      };

      const result = await verifyId(
        username,
        frontPhoto,
        undefined,
        registrationFlow?.verificationToken
      );

      if (result.status === "success") {
        toast.success("ID verified successfully!", 3000);
        if (isSettings) {
          // Go back to settings
          navigation.goBack();
        } else {
          // Continue registration flow
          navigation.navigate("Step3");
        }
      } else {
        toast.error(result.message || "ID verification failed. Please try again.");
      }
    } catch (error: any) {
      console.error("ID verification error:", error);

      const errorMessage = error.message || "ID verification failed";

      if (errorMessage.toLowerCase().includes("age") || errorMessage.toLowerCase().includes("60")) {
        toast.error("You must be 60 years or older to use Tander.");
      } else if (errorMessage.toLowerCase().includes("unclear") || errorMessage.toLowerCase().includes("readable")) {
        toast.warning("Your ID photo is unclear. Please upload a clearer image.");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGuideModal = () => (
    <Modal
      visible={showGuide}
      animationType="fade"
      transparent
      onRequestClose={() => setShowGuide(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.guideModal}>
          <View style={styles.guideHeader}>
            <Ionicons name="id-card" size={48} color={colors.primary} />
            <Text style={styles.guideTitle}>ID Verification Guide</Text>
          </View>

          <View style={styles.guideContent}>
            <View style={styles.guideItem}>
              <View style={styles.guideIconCircle}>
                <Ionicons name="checkmark" size={20} color={colors.success} />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideItemTitle}>Use a valid government ID</Text>
                <Text style={styles.guideItemDesc}>
                  Senior Citizen ID, Driver's License, or Passport
                </Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={styles.guideIconCircle}>
                <Ionicons name="sunny" size={20} color={colors.success} />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideItemTitle}>Good lighting</Text>
                <Text style={styles.guideItemDesc}>
                  Ensure your ID is clearly visible with no shadows
                </Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={styles.guideIconCircle}>
                <Ionicons name="phone-landscape" size={20} color={colors.success} />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideItemTitle}>Hold phone horizontally</Text>
                <Text style={styles.guideItemDesc}>
                  Camera will switch to landscape mode for better capture
                </Text>
              </View>
            </View>

            <View style={styles.guideItem}>
              <View style={styles.guideIconCircle}>
                <Ionicons name="text" size={20} color={colors.success} />
              </View>
              <View style={styles.guideTextContainer}>
                <Text style={styles.guideItemTitle}>Birthdate must be readable</Text>
                <Text style={styles.guideItemDesc}>
                  We verify you are 60+ years old using your birthdate
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.guideButton}
            onPress={() => setShowGuide(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.guideButtonText}>Got it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderCameraModal = () => (
    <Modal
      visible={showCamera}
      animationType="slide"
      supportedOrientations={["landscape-right", "landscape-left"]}
      onRequestClose={handleCloseCamera}
    >
      <StatusBar hidden />
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
        >
          {/* Camera overlay with landscape ID card outline */}
          <View style={styles.cameraOverlay}>
            {/* Close button - top left - LARGER for elderly users */}
            <TouchableOpacity
              style={styles.cameraCloseButton}
              onPress={handleCloseCamera}
              accessibilityLabel="Cancel and go back"
              accessibilityRole="button"
            >
              <Ionicons name="close" size={32} color={colors.white} />
              <Text style={styles.cameraCloseText}>Cancel</Text>
            </TouchableOpacity>

            {/* Title - top center */}
            <Text style={styles.cameraTitle}>
              Scan Front of ID
            </Text>

            {/* Helpful tip for elderly users */}
            <Text style={styles.cameraTip}>
              Hold your phone steady over your ID card
            </Text>

            {/* Landscape ID Card Outline Guide - centered */}
            <View style={styles.idCardOutlineLandscape}>
              {/* Corner brackets */}
              <View style={[styles.cornerBracket, styles.cornerTopLeft]} />
              <View style={[styles.cornerBracket, styles.cornerTopRight]} />
              <View style={[styles.cornerBracket, styles.cornerBottomLeft]} />
              <View style={[styles.cornerBracket, styles.cornerBottomRight]} />
            </View>

            <Text style={styles.cameraHint}>
              Align your ID within the frame
            </Text>

            {/* Capture button - bottom center - LARGER with label for elderly */}
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handleTakePhoto}
                accessibilityLabel="Take photo of your ID"
                accessibilityRole="button"
              >
                <View style={styles.captureButtonInner}>
                  <Ionicons name="camera" size={32} color={colors.primary} />
                </View>
              </TouchableOpacity>
              <Text style={styles.captureLabel}>Tap to Take Photo</Text>
            </View>
          </View>
        </CameraView>
      </View>
    </Modal>
  );

  const canProceed = !!idPhotoFront;

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={["#C8E6E2", "#FFE2C1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top"]} style={styles.headerView}>
        {/* Only show progress bar during registration flow */}
        {!isSettings && <ProgressBar step={2} total={4} />}

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
            <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
            <Text style={styles.title}>ID Verification</Text>
          </View>
          <Text style={styles.subtitle}>
            Upload a clear photo of your government-issued ID to verify your age.
          </Text>
        </Animated.View>

        {/* Help Button */}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setShowGuide(true)}
        >
          <Ionicons name="help-circle" size={20} color={colors.accentTeal} />
          <Text style={styles.helpButtonText}>View Guide</Text>
        </TouchableOpacity>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Upload Card - Front Only */}
          <Animated.View
            style={{
              opacity: cardAnim.opacity,
              transform: [{ translateY: cardAnim.translateY }],
            }}
          >
            <View style={styles.uploadCard}>
              <View style={styles.uploadCardHeader}>
                <Text style={styles.uploadCardTitle}>
                  Front of ID <Text style={styles.required}>*</Text>
                </Text>
              </View>

              {idPhotoFront ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: idPhotoFront }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => {
                      setIdPhotoFront("");
                      updateFormikField("idPhotoFront", "");
                    }}
                  >
                    <Ionicons name="close-circle" size={28} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity
                    style={styles.uploadOption}
                    onPress={handlePickImage}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="images" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadOptionText}>Choose Photo</Text>
                  </TouchableOpacity>

                  <View style={styles.uploadDivider}>
                    <Text style={styles.uploadDividerText}>or</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.uploadOption}
                    onPress={handleOpenCamera}
                  >
                    <View style={styles.uploadIconCircle}>
                      <Ionicons name="camera" size={24} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadOptionText}>Take Photo</Text>
                    <Text style={styles.uploadOptionHint}>(Landscape)</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Info Card */}
          <Animated.View
            style={[
              styles.infoCard,
              {
                opacity: cardAnim.opacity,
                transform: [{ translateY: cardAnim.translateY }],
              },
            ]}
          >
            <Ionicons name="information-circle" size={24} color={colors.accentBlue} />
            <Text style={styles.infoText}>
              Your ID is used only for age verification. We extract your birthdate to
              confirm you are 60+ years old. Your ID photo is securely processed and
              not shared with third parties.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Bottom Navigation */}
        <Animated.View
          style={[
            styles.bottomNav,
            {
              opacity: buttonAnim.opacity,
              transform: [{ translateY: buttonAnim.translateY }],
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
              (!canProceed || isSubmitting) && styles.nextButtonDisabled,
            ]}
            onPress={handleSubmitVerification}
            activeOpacity={canProceed && !isSubmitting ? 0.8 : 1}
            disabled={!canProceed || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.nextText}>Verifying...</Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.nextText,
                    !canProceed && styles.nextTextDisabled,
                  ]}
                >
                  {canProceed ? "Verify & Continue" : "Upload ID Photo"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={canProceed ? colors.white : "#9CA3AF"}
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {renderGuideModal()}
      {renderCameraModal()}
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
    marginBottom: 12,
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
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderRadius: 20,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  helpButtonText: {
    color: colors.accentTeal,
    fontSize: 14,
    fontWeight: "600",
  },

  // Upload Card
  uploadCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  uploadCardHeader: {
    marginBottom: 16,
  },
  uploadCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  required: {
    color: colors.error,
  },
  uploadOptions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: 20,
  },
  uploadOption: {
    alignItems: "center",
    gap: 8,
  },
  uploadIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  uploadOptionHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: -4,
  },
  uploadDivider: {
    paddingHorizontal: 16,
  },
  uploadDividerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  photoPreview: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    resizeMode: "contain",
    backgroundColor: "#F5F5F5",
  },
  removePhotoButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E0F2FE",
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#0369A1",
    lineHeight: 18,
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
  // Increased back button size for elderly users (56x56 minimum)
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  nextButtonDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0.05,
    elevation: 0,
  },
  nextText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  nextTextDisabled: {
    color: "#9CA3AF",
  },

  // Guide Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  guideModal: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  guideHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  guideTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 12,
  },
  guideContent: {
    gap: 16,
    marginBottom: 24,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  guideIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  guideTextContainer: {
    flex: 1,
  },
  guideItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  guideItemDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  guideButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: "center",
  },
  guideButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },

  // Camera Modal - Landscape
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  // LARGER close button for elderly users with text label
  cameraCloseButton: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    gap: 8,
    zIndex: 10,
  },
  cameraCloseText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  cameraTitle: {
    position: "absolute",
    top: 24,
    alignSelf: "center",
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    zIndex: 10,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraTip: {
    position: "absolute",
    top: 52,
    alignSelf: "center",
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    zIndex: 10,
    opacity: 0.9,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Landscape ID Card Outline - horizontal rectangle
  idCardOutlineLandscape: {
    width: "70%",
    aspectRatio: 1.586, // Standard ID card ratio (85.6mm x 53.98mm)
    maxHeight: "60%",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
    borderRadius: 12,
    borderStyle: "dashed",
  },

  // Corner brackets for the outline
  cornerBracket: {
    position: "absolute",
    width: 30,
    height: 30,
    borderColor: colors.white,
    borderWidth: 4,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },

  cameraHint: {
    position: "absolute",
    bottom: 100,
    alignSelf: "center",
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraControls: {
    position: "absolute",
    bottom: 24,
    right: 32,
    alignItems: "center",
  },
  // LARGER capture button for elderly users
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: colors.white,
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  captureLabel: {
    marginTop: 8,
    color: colors.white,
    fontSize: 14,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
