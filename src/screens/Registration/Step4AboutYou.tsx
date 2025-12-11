import { Ionicons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import FullScreen from "@/src/components/layout/FullScreen";
import PillSelector from "@/src/components/forms/PillSelector";
import TextInputField from "@/src/components/forms/TextInputField";
import ProgressBar from "@/src/components/ui/ProgressBar";
import colors from "@/src/config/colors";
import { useSlideUp } from "@/src/hooks/useFadeIn";
import { useToast } from "@/src/context/ToastContext";
import { Step4Nav } from "@/src/navigation/NavigationTypes";
import { useAuth } from "@/src/hooks/useAuth";
import { authApi } from "@/src/api/authApi";

interface Props {
  navigation: Step4Nav;
}

const INTEREST_OPTIONS = [
  "Travel",
  "Music",
  "Sports",
  "Art",
  "Cooking",
  "Fitness",
  "Reading",
  "Gardening",
  "Dancing",
  "Photography",
  "Movies",
  "Walking",
];

const LOOKING_FOR_OPTIONS = [
  "Connect",
  "Companionship",
  "Dating",
  "Socialize",
  "Friendship",
  "Activity Partner",
];

const MIN_SELECTIONS = 2;

export default function Step4AboutYou({ navigation }: Props) {
  const { values, setFieldValue, handleSubmit } = useFormikContext<any>();
  const toast = useToast();
  const { phase1Data, registrationFlow } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 100, 40);
  const bottomNavAnim = useSlideUp(600, 200, 30);

  // Check if minimum selections are met
  const interestsCount = values.interests?.length || 0;
  const lookingForCount = values.lookingFor?.length || 0;
  const hasMinInterests = interestsCount >= MIN_SELECTIONS;
  const hasMinLookingFor = lookingForCount >= MIN_SELECTIONS;
  const isFormComplete = hasMinInterests && hasMinLookingFor;

  const handleComplete = async () => {
    // Validate minimum selections
    if (!hasMinInterests) {
      toast.error(`Please select at least ${MIN_SELECTIONS} interests.`);
      return;
    }
    if (!hasMinLookingFor) {
      toast.error(`Please select at least ${MIN_SELECTIONS} options for what you're looking for.`);
      return;
    }

    const username = phase1Data?.username || registrationFlow?.username;

    if (!username) {
      toast.error("Session expired. Please start registration again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save About You data to backend
      const response = await authApi.updateAboutYou(
        username,
        values.bio || undefined,
        values.interests || [],
        values.lookingFor || []
      );

      if (response.status === 'success') {
        toast.success("About You saved successfully!");
      } else {
        console.warn('About You save returned error status:', response.message);
        toast.warning("About You data will be saved later.");
      }

      // Continue with Formik submit to complete registration
      await handleSubmit();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to save About You. Please try again.");
      setIsSubmitting(false);
    }
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
        <ProgressBar step={4} total={4} />

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
            <Ionicons name="person-circle" size={28} color={colors.primary} />
            <Text style={styles.title}>About You</Text>
          </View>
          <Text style={styles.subtitle}>
            Tell others a bit about yourself. Select at least 2 options in each section.
          </Text>
        </Animated.View>

        {/* Completion Status */}
        <Animated.View
          style={[
            styles.completionIndicator,
            {
              opacity: headerAnim.opacity,
              transform: [{ translateY: headerAnim.translateY }],
            },
          ]}
        >
          <View style={styles.completionRow}>
            <Ionicons
              name={isFormComplete ? "checkmark-circle" : "information-circle-outline"}
              size={18}
              color={isFormComplete ? colors.success : colors.textSecondary}
            />
            <Text style={styles.completionText}>
              {isFormComplete ? "Ready to complete registration!" : "Complete selections below"}
            </Text>
          </View>
          {!isFormComplete && (
            <Text style={styles.completionHint}>
              Interests: {interestsCount}/{MIN_SELECTIONS} | Looking for: {lookingForCount}/{MIN_SELECTIONS}
            </Text>
          )}
        </Animated.View>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          {/* About You Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim.opacity,
                transform: [{ translateY: cardAnim.translateY }],
              },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Your Profile</Text>
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            </View>

            {/* Bio */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Short Bio (Optional)</Text>
              <Text style={styles.sectionHint}>
                Share something interesting about yourself
              </Text>
              <TextInputField
                label=""
                placeholder="e.g., Retired teacher who loves gardening..."
                value={values.bio}
                onChangeText={(t) => setFieldValue("bio", t)}
                multiline
              />
            </View>

            {/* Interests */}
            <View style={styles.inputSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>Your Interests *</Text>
                <Text style={[
                  styles.selectionCount,
                  hasMinInterests && styles.selectionCountComplete
                ]}>
                  {interestsCount}/{MIN_SELECTIONS} min
                </Text>
              </View>
              <Text style={styles.sectionHint}>
                Select at least {MIN_SELECTIONS} interests that describe you
              </Text>
              <PillSelector
                items={INTEREST_OPTIONS}
                value={values.interests || []}
                onChange={(val) => setFieldValue("interests", val)}
              />
              {!hasMinInterests && interestsCount > 0 && (
                <Text style={styles.selectionWarning}>
                  Select {MIN_SELECTIONS - interestsCount} more interest{MIN_SELECTIONS - interestsCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>

            {/* Looking For */}
            <View style={styles.inputSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>What are you looking for? *</Text>
                <Text style={[
                  styles.selectionCount,
                  hasMinLookingFor && styles.selectionCountComplete
                ]}>
                  {lookingForCount}/{MIN_SELECTIONS} min
                </Text>
              </View>
              <Text style={styles.sectionHint}>
                Select at least {MIN_SELECTIONS} options for what you'd like to find on Tander
              </Text>
              <PillSelector
                items={LOOKING_FOR_OPTIONS}
                value={values.lookingFor || []}
                onChange={(val) => setFieldValue("lookingFor", val)}
              />
              {!hasMinLookingFor && lookingForCount > 0 && (
                <Text style={styles.selectionWarning}>
                  Select {MIN_SELECTIONS - lookingForCount} more option{MIN_SELECTIONS - lookingForCount > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </Animated.View>

          {/* Encouragement Card */}
          {!isFormComplete && (
            <Animated.View
              style={[
                styles.infoCard,
                {
                  opacity: cardAnim.opacity,
                  transform: [{ translateY: cardAnim.translateY }],
                },
              ]}
            >
              <Ionicons name="bulb" size={24} color="#F59E0B" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Almost there!</Text>
                <Text style={styles.infoText}>
                  Select at least {MIN_SELECTIONS} interests and {MIN_SELECTIONS} options for what you're looking for to complete your registration.
                </Text>
              </View>
            </Animated.View>
          )}
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
            disabled={isSubmitting}
          >
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !isFormComplete && styles.nextButtonMuted,
              isSubmitting && styles.nextButtonDisabled,
            ]}
            onPress={handleComplete}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.nextText}>
                  Completing...
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextText, !isFormComplete && styles.nextTextMuted]}>
                  {isFormComplete ? "Complete Registration" : "Complete Selections"}
                </Text>
                <Ionicons
                  name={isFormComplete ? "checkmark-circle" : "chevron-forward"}
                  size={20}
                  color={isFormComplete ? colors.white : "#9CA3AF"}
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
  completionIndicator: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  completionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completionText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  completionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  requiredBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requiredText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#DC2626",
  },

  // Input sections
  inputSection: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  selectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  selectionCountComplete: {
    backgroundColor: "#D1FAE5",
    color: "#059669",
  },
  selectionWarning: {
    fontSize: 12,
    color: "#F59E0B",
    marginTop: 8,
    fontWeight: "500",
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  // Info Card
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#FEF3C7",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#92400E",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#92400E",
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
  nextButtonMuted: {
    backgroundColor: colors.borderMedium,
    shadowOpacity: 0.05,
    elevation: 0,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  nextText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  nextTextMuted: {
    color: "#9CA3AF",
  },
});
