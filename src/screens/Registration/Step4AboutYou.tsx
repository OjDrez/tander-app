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
import SelectField from "@/src/components/forms/SelectField";
import TextInputField from "@/src/components/forms/TextInputField";
import PickerModal from "@/src/components/modals/PickerModal";
import ProgressBar from "@/src/components/ui/ProgressBar";
import colors from "@/src/config/colors";
import { CIVIL_STATUS_OPTIONS } from "@/src/constants/formData";
import { useSlideUp } from "@/src/hooks/useFadeIn";
import { useToast } from "@/src/context/ToastContext";
import { Step4Nav } from "@/src/navigation/NavigationTypes";
import { useAuth } from "@/src/hooks/useAuth";
import { authApi } from "@/src/api/authApi";

interface Props {
  navigation: Step4Nav;
}

// Curated interest options for seniors
const INTEREST_OPTIONS = [
  // Social & Community
  "Socializing",
  "Church/Faith",
  "Volunteer Work",
  "Community Events",

  // Relaxing
  "Reading",
  "TV/Movies",
  "Music",
  "Gardening",
  "Walking",

  // Creative
  "Painting",
  "Photography",
  "Writing",
  "Crafts",
  "Singing",
  "Dancing",

  // Food
  "Cooking",
  "Baking",
  "Dining Out",

  // Games
  "Mahjong",
  "Card Games",
  "Chess",
  "Puzzles",

  // Physical
  "Swimming",
  "Yoga",
  "Tai Chi",
  "Golf",
  "Bowling",
  "Exercise",

  // Travel
  "Travel",
  "Day Trips",
  "Nature Walks",

  // Popular activities
  "Karaoke",
  "Pet Care",
  "Watching Dramas",
];

const LOOKING_FOR_OPTIONS = [
  "Someone to Talk To",
  "Travel Companion",
  "Friendship",
  "Dating",
  "Activity Partner",
  "Life Partner",
];

const MIN_INTERESTS = 2;
const MIN_LOOKING_FOR = 2;

export default function Step4AboutYou({ navigation }: Props) {
  const { values, setFieldValue, handleSubmit } = useFormikContext<any>();
  const toast = useToast();
  const { phase1Data, registrationFlow } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [civilStatusPickerVisible, setCivilStatusPickerVisible] = useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 100, 40);
  const bottomNavAnim = useSlideUp(600, 200, 30);

  // Validation checks
  const interestsCount = values.interests?.length || 0;
  const lookingForCount = values.lookingFor?.length || 0;
  const hasCivilStatus = !!values.civilStatus;
  const hasMinInterests = interestsCount >= MIN_INTERESTS;
  const hasMinLookingFor = lookingForCount >= MIN_LOOKING_FOR;
  const isFormComplete = hasCivilStatus && hasMinInterests && hasMinLookingFor;

  const handleComplete = async () => {
    if (!hasCivilStatus) {
      toast.error("Please select your civil status.");
      return;
    }
    if (!hasMinInterests) {
      toast.error(`Please select at least ${MIN_INTERESTS} interests.`);
      return;
    }
    if (!hasMinLookingFor) {
      toast.error(`Please select at least ${MIN_LOOKING_FOR} options for what you're looking for.`);
      return;
    }

    const username = phase1Data?.username || registrationFlow?.username;

    if (!username) {
      toast.error("Session expired. Please start registration again.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Save About You data including civil status
      const response = await authApi.updateAboutYou(
        username,
        values.bio || undefined,
        values.interests || [],
        values.lookingFor || [],
        values.civilStatus || undefined
      );

      if (response.status === "success") {
        toast.success("Profile saved successfully!");
      } else {
        console.warn("About You save returned error:", response.message);
        toast.warning("There was a problem saving. Please try again.");
      }

      await handleSubmit();
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Failed to save. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={colors.gradients.main.array}
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
            <Ionicons name="heart-circle" size={28} color={colors.primary} />
            <Text style={styles.title}>About You</Text>
          </View>
          <Text style={styles.subtitle}>
            Final step! Help us introduce you to others.
          </Text>
        </Animated.View>

        {/* Completion Status */}
        <Animated.View
          style={[
            styles.progressCard,
            {
              opacity: headerAnim.opacity,
              transform: [{ translateY: headerAnim.translateY }],
            },
          ]}
        >
          <View style={styles.progressRow}>
            <Ionicons
              name={isFormComplete ? "checkmark-circle" : "ellipsis-horizontal-circle"}
              size={24}
              color={isFormComplete ? colors.success : colors.textSecondary}
            />
            <Text style={styles.progressText}>
              {isFormComplete ? "Ready to go!" : "Complete these items"}
            </Text>
          </View>
          {!isFormComplete && (
            <View style={styles.checklistContainer}>
              <View style={styles.checklistItem}>
                <Ionicons
                  name={hasCivilStatus ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={hasCivilStatus ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.checklistText, hasCivilStatus && styles.checklistTextDone]}>
                  Civil Status
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons
                  name={hasMinInterests ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={hasMinInterests ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.checklistText, hasMinInterests && styles.checklistTextDone]}>
                  {interestsCount}/{MIN_INTERESTS} Interests
                </Text>
              </View>
              <View style={styles.checklistItem}>
                <Ionicons
                  name={hasMinLookingFor ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={hasMinLookingFor ? colors.success : colors.textSecondary}
                />
                <Text style={[styles.checklistText, hasMinLookingFor && styles.checklistTextDone]}>
                  Looking For
                </Text>
              </View>
            </View>
          )}
        </Animated.View>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim.opacity,
                transform: [{ translateY: cardAnim.translateY }],
              },
            ]}
          >
            {/* Civil Status - Moved from Step 1 */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Civil Status *</Text>
                {hasCivilStatus && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                )}
              </View>
              <Text style={styles.sectionHint}>
                What is your current relationship status?
              </Text>
              <SelectField
                label=""
                placeholder="Select civil status"
                value={values.civilStatus}
                onPress={() => setCivilStatusPickerVisible(true)}
              />
            </View>

            <View style={styles.divider} />

            {/* Bio */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Short Introduction</Text>
              <Text style={styles.sectionHint}>
                Share a little about yourself (optional)
              </Text>
              <TextInputField
                label=""
                placeholder="E.g., Retired teacher who loves to cook..."
                value={values.bio}
                onChangeText={(t) => setFieldValue("bio", t)}
                multiline
              />
            </View>

            <View style={styles.divider} />

            {/* Interests */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Interests *</Text>
                <View style={[styles.countBadge, hasMinInterests && styles.countBadgeComplete]}>
                  <Text style={[styles.countText, hasMinInterests && styles.countTextComplete]}>
                    {interestsCount}/{MIN_INTERESTS}
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionHint}>
                Select things you enjoy (minimum {MIN_INTERESTS})
              </Text>
              <PillSelector
                items={INTEREST_OPTIONS}
                value={values.interests || []}
                onChange={(val) => setFieldValue("interests", val)}
              />
            </View>

            <View style={styles.divider} />

            {/* Looking For */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>What Are You Looking For? *</Text>
                <View style={[styles.countBadge, hasMinLookingFor && styles.countBadgeComplete]}>
                  <Text style={[styles.countText, hasMinLookingFor && styles.countTextComplete]}>
                    {lookingForCount}/{MIN_LOOKING_FOR}
                  </Text>
                </View>
              </View>
              <Text style={styles.sectionHint}>
                What do you hope to find on Tander? (minimum {MIN_LOOKING_FOR})
              </Text>
              <PillSelector
                items={LOOKING_FOR_OPTIONS}
                value={values.lookingFor || []}
                onChange={(val) => setFieldValue("lookingFor", val)}
              />
            </View>
          </Animated.View>

          {/* Info Card */}
          {isFormComplete && (
            <Animated.View
              style={[
                styles.successCard,
                {
                  opacity: cardAnim.opacity,
                  transform: [{ translateY: cardAnim.translateY }],
                },
              ]}
            >
              <Ionicons name="sparkles" size={28} color={colors.success} />
              <View style={styles.successContent}>
                <Text style={styles.successTitle}>Congratulations!</Text>
                <Text style={styles.successText}>
                  You're ready to use Tander! Tap "Complete Registration" to get started.
                </Text>
              </View>
            </Animated.View>
          )}

          <View style={styles.bottomSpacer} />
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
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.nextButton,
              !isFormComplete && styles.nextButtonDisabled,
              isSubmitting && styles.nextButtonSubmitting,
            ]}
            onPress={handleComplete}
            activeOpacity={0.8}
            disabled={isSubmitting || !isFormComplete}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.nextText}>Processing...</Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextText, !isFormComplete && styles.nextTextDisabled]}>
                  {isFormComplete ? "Complete Registration" : "Complete All Fields"}
                </Text>
                <Ionicons
                  name={isFormComplete ? "checkmark-circle" : "chevron-forward"}
                  size={24}
                  color={isFormComplete ? colors.white : colors.disabledText}
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Civil Status Picker */}
        <PickerModal
          visible={civilStatusPickerVisible}
          title="Select Civil Status"
          options={CIVIL_STATUS_OPTIONS}
          selectedValue={values.civilStatus}
          onSelect={async (value) => {
            await setFieldValue("civilStatus", value, true);
          }}
          onClose={() => setCivilStatusPickerVisible(false)}
          enableSearch={false}
        />
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
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
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
    fontSize: 28,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 24,
  },

  // Progress Card
  progressCard: {
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  progressText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  checklistContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checklistText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  checklistTextDone: {
    color: colors.success,
    textDecorationLine: "line-through",
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionHint: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 20,
  },

  // Count Badge
  countBadge: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeComplete: {
    backgroundColor: colors.successLight,
  },
  countText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  countTextComplete: {
    color: colors.successDark,
  },

  // Success Card
  successCard: {
    flexDirection: "row",
    backgroundColor: colors.successLight,
    borderRadius: 20,
    padding: 20,
    gap: 16,
    alignItems: "center",
  },
  successContent: {
    flex: 1,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.successDark,
    marginBottom: 4,
  },
  successText: {
    fontSize: 15,
    color: colors.successDark,
    lineHeight: 22,
  },

  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
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
    gap: 16,
  },
  backButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0.05,
    elevation: 0,
  },
  nextButtonSubmitting: {
    opacity: 0.8,
  },
  nextText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  nextTextDisabled: {
    color: colors.disabledText,
  },
  bottomSpacer: {
    height: 20,
  },
});
