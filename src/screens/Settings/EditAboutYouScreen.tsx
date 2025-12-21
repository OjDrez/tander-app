import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import TextInputField from "@/src/components/forms/TextInputField";
import PillSelector from "@/src/components/forms/PillSelector";
import SelectField from "@/src/components/forms/SelectField";
import PickerModal from "@/src/components/modals/PickerModal";
import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import colors from "@/src/config/colors";
import { CIVIL_STATUS_OPTIONS } from "@/src/constants/formData";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { useToast } from "@/src/context/ToastContext";
import { useSlideUp } from "@/src/hooks/useFadeIn";

type EditAboutNav = NativeStackNavigationProp<AppStackParamList>;

interface AboutData {
  bio: string;
  interests: string[];
  lookingFor: string[];
  civilStatus: string;
}

// Same options as Step4AboutYou for consistency
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

export default function EditAboutYouScreen() {
  const navigation = useNavigation<EditAboutNav>();
  const toast = useToast();

  const [about, setAbout] = useState<AboutData>({
    bio: "",
    interests: [],
    lookingFor: [],
    civilStatus: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [civilStatusPickerVisible, setCivilStatusPickerVisible] = useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 100, 40);
  const bottomNavAnim = useSlideUp(600, 200, 30);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await userApi.getCurrentUser();
      setAbout({
        bio: userData.bio || "",
        interests: userApi.parseInterests(userData.interests),
        lookingFor: userApi.parseLookingFor(userData.lookingFor),
        civilStatus: userData.civilStatus || "",
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Validation checks
  const interestsCount = about.interests.length;
  const lookingForCount = about.lookingFor.length;
  const hasCivilStatus = !!about.civilStatus;
  const hasMinInterests = interestsCount >= MIN_INTERESTS;
  const hasMinLookingFor = lookingForCount >= MIN_LOOKING_FOR;
  const isFormComplete = hasCivilStatus && hasMinInterests && hasMinLookingFor;

  const handleGoBack = () => navigation.goBack();

  const handleSave = async () => {
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

    setIsSaving(true);
    try {
      await userApi.updateProfile({
        bio: about.bio,
        interests: about.interests,
        lookingFor: about.lookingFor,
        civilStatus: about.civilStatus,
      });

      toast.success("Profile updated successfully!");
      navigation.goBack();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading Your Profile"
        subtitle="Please wait..."
      />
    );
  }

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={colors.gradients.main.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView edges={["top"]} style={styles.headerView}>
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
            <Text style={styles.title}>Edit About You</Text>
          </View>
          <Text style={styles.subtitle}>
            Update your profile information to help others get to know you better.
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
              {isFormComplete ? "All complete!" : "Complete these items"}
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
                  {lookingForCount}/{MIN_LOOKING_FOR} Looking For
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
            {/* Civil Status */}
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
                value={about.civilStatus}
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
                value={about.bio}
                onChangeText={(text) => setAbout({ ...about, bio: text })}
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>
                {about.bio.length}/500 characters
              </Text>
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
                value={about.interests}
                onChange={(val) => setAbout({ ...about, interests: val })}
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
                value={about.lookingFor}
                onChange={(val) => setAbout({ ...about, lookingFor: val })}
              />
            </View>
          </Animated.View>

          {/* Success Card */}
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
                <Text style={styles.successTitle}>Looking Good!</Text>
                <Text style={styles.successText}>
                  Your profile is complete. Tap "Save Changes" to update your profile.
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
            onPress={handleGoBack}
            activeOpacity={0.7}
            disabled={isSaving}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.saveButton,
              !isFormComplete && styles.saveButtonDisabled,
              isSaving && styles.saveButtonSubmitting,
            ]}
            onPress={handleSave}
            activeOpacity={0.8}
            disabled={isSaving || !isFormComplete}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.saveText}>Saving...</Text>
              </>
            ) : (
              <>
                <Text style={[styles.saveText, !isFormComplete && styles.saveTextDisabled]}>
                  {isFormComplete ? "Save Changes" : "Complete All Fields"}
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
          selectedValue={about.civilStatus}
          onSelect={(value) => {
            setAbout({ ...about, civilStatus: value });
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
  charCount: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "right",
    marginTop: 8,
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
  saveButton: {
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
  saveButtonDisabled: {
    backgroundColor: colors.disabled,
    shadowOpacity: 0.05,
    elevation: 0,
  },
  saveButtonSubmitting: {
    opacity: 0.8,
  },
  saveText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  saveTextDisabled: {
    color: colors.disabledText,
  },
  bottomSpacer: {
    height: 20,
  },
});
