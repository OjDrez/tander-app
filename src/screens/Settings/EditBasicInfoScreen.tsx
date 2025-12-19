import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TextInputField from "@/src/components/forms/TextInputField";
import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import AppText from "@/src/components/inputs/AppText";
import AppHeader from "@/src/components/navigation/AppHeader";
import DatePickerInput from "@/src/components/inputs/DatePickerInput";
import SelectField from "@/src/components/forms/SelectField";
import PhotoPicker from "@/src/components/profile/PhotoPicker";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";
import { ProfileFormData } from "@/src/types/settings";
import { getPlaceholderAvatarUrl } from "@/src/config/styles";
import { useToast } from "@/src/context/ToastContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type EditBasicNav = NativeStackNavigationProp<AppStackParamList>;

// Helper to parse ISO date string to clean readable format
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return "";

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  // If already in "Month DD, YYYY" format, return as-is
  if (/^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(dateString)) {
    return dateString;
  }

  // If already in MM/DD/YYYY format, parse and convert to readable format
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    const [month, day, year] = dateString.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return "";
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  }

  // Parse ISO date string (e.g., "1948-12-13T16:30:00.000+00:00")
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  } catch {
    return "";
  }
};

// Helper to calculate age from birthday
const calculateAge = (birthday: string): string => {
  console.log("calculateAge called with:", birthday);

  if (!birthday) {
    console.log("calculateAge: empty birthday");
    return "";
  }

  let birthDate: Date;

  // Parse "Month DD, YYYY" format (e.g., "January 15, 1990")
  if (/^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/.test(birthday)) {
    console.log("calculateAge: parsing Month DD, YYYY format");
    birthDate = new Date(birthday);
  } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthday)) {
    console.log("calculateAge: parsing MM/DD/YYYY format");
    // Parse MM/DD/YYYY format
    const [month, day, year] = birthday.split("/").map(Number);
    birthDate = new Date(year, month - 1, day);
  } else {
    console.log("calculateAge: parsing as generic date");
    // Try parsing ISO format
    birthDate = new Date(birthday);
  }

  console.log("calculateAge: parsed birthDate:", birthDate);

  if (isNaN(birthDate.getTime())) {
    console.log("calculateAge: invalid date");
    return "";
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  console.log("calculateAge: calculated age:", age);

  return age >= 0 ? age.toString() : "";
};

export default function EditBasicInfoScreen() {
  const navigation = useNavigation<EditBasicNav>();

  const [profile, setProfile] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    nickName: "",
    birthday: "",
    age: "",
    country: "",
    civilStatus: "",
    city: "",
    hobby: "",
    avatar: null,
  });
  const [originalProfile, setOriginalProfile] = useState<ProfileFormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPhotoPicker, setShowPhotoPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const hasUnsavedChanges = useCallback(() => {
    if (!originalProfile) return false;
    return (
      profile.firstName !== originalProfile.firstName ||
      profile.lastName !== originalProfile.lastName ||
      profile.nickName !== originalProfile.nickName ||
      profile.birthday !== originalProfile.birthday ||
      profile.age !== originalProfile.age ||
      profile.country !== originalProfile.country ||
      profile.civilStatus !== originalProfile.civilStatus ||
      profile.city !== originalProfile.city ||
      profile.hobby !== originalProfile.hobby
    );
  }, [profile, originalProfile]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (hasUnsavedChanges()) {
        showUnsavedChangesAlert();
        return true;
      }
      return false;
    });
    return () => backHandler.remove();
  }, [hasUnsavedChanges]);

  const toast = useToast();

  const showUnsavedChangesAlert = async () => {
    const shouldLeave = await toast.confirm({
      title: "Unsaved Changes",
      message: "You have changes that are not saved.\n\nDo you want to leave without saving?",
      type: "warning",
      confirmText: "Leave",
      cancelText: "Stay Here",
    });
    if (shouldLeave) {
      navigation.goBack();
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await userApi.getCurrentUser();
      const formattedBirthday = formatDateForDisplay(userData.birthDate || "");
      const calculatedAge = calculateAge(formattedBirthday);

      console.log("Loading profile - birthDate from API:", userData.birthDate);
      console.log("Loading profile - formatted birthday:", formattedBirthday);
      console.log("Loading profile - calculated age:", calculatedAge);

      const loadedProfile: ProfileFormData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        nickName: userData.nickName || "",
        birthday: formattedBirthday,
        age: calculatedAge,
        country: userData.country || "",
        civilStatus: userData.civilStatus || "",
        city: userData.city || "",
        hobby: userData.hobby || "",
        avatar: userData.profilePhotoUrl || null,
      };
      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoSelected = async (uri: string) => {
    setIsUploading(true);
    try {
      const result = await photoApi.uploadProfilePhoto(uri);
      if (result.status === "success" && result.profilePhotoUrl) {
        setProfile(prev => ({ ...prev, avatar: result.profilePhotoUrl || null }));
        toast.success("Your profile photo has been changed successfully.");
      } else {
        toast.error("Could not upload your photo. Please try again.");
      }
    } catch (error: any) {
      console.error("Failed to upload photo:", error);
      toast.error("Could not upload your photo. Please check your internet and try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const getPhotoUrl = () => {
    if (profile.avatar) {
      return photoApi.getPhotoUrl(profile.avatar);
    }
    const displayName = profile.firstName && profile.lastName
      ? `${profile.firstName} ${profile.lastName}`
      : undefined;
    return getPlaceholderAvatarUrl(displayName);
  };

  const selectOptions = useMemo(
    () => ({
      country: ["Philippines", "USA", "Canada", "UK", "Australia"],
      civilStatus: ["Single", "Married", "Widowed", "Divorced"],
      city: ["Manila", "Cebu", "Davao", "Quezon City", "Makati"],
      hobby: ["Cooking", "Travel", "Music", "Reading", "Gardening", "Dancing"],
    }),
    []
  );

  const cycleOption = (field: keyof ProfileFormData, options: string[]) => {
    const currentIndex = options.indexOf(profile[field] as string);
    const nextValue = options[(currentIndex + 1) % options.length];
    setProfile({ ...profile, [field]: nextValue });
  };

  // Handle birthday change and auto-calculate age
  const handleBirthdayChange = (newBirthday: string) => {
    const newAge = calculateAge(newBirthday);
    setProfile({ ...profile, birthday: newBirthday, age: newAge });
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges()) {
      showUnsavedChangesAlert();
    } else {
      navigation.goBack();
    }
  };

  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        firstName: profile.firstName,
        lastName: profile.lastName,
        nickName: profile.nickName,
        age: profile.age ? parseInt(profile.age, 10) : undefined,
        birthDate: profile.birthday || undefined,
        city: profile.city,
        country: profile.country,
        civilStatus: profile.civilStatus || undefined,
        hobby: profile.hobby || undefined,
      });

      toast.success("Your information has been saved.");
      navigation.navigate("EditAboutYouScreen");
    } catch (error: any) {
      toast.error("Please check your internet connection and try again.");
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
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <AppHeader
          title="Edit Profile"
          titleAlign="left"
          onBackPress={handleGoBack}
          showLogo
        />

        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.content}
        >
          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={styles.stepActive}>
              <AppText style={styles.stepNumber}>1</AppText>
            </View>
            <View style={styles.stepLine} />
            <View style={styles.stepInactive}>
              <AppText style={styles.stepNumberInactive}>2</AppText>
            </View>
          </View>
          <AppText style={styles.stepLabel}>
            Step 1 of 2: Basic Information
          </AppText>

          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <AppText style={styles.sectionTitle}>
              Your Profile Photo
            </AppText>
            <AppText style={styles.sectionDescription}>
              Tap the photo below to change it
            </AppText>

            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={() => setShowPhotoPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Change your profile photo. Tap to select a new photo."
              accessibilityHint="Opens photo selection options"
              activeOpacity={0.7}
            >
              <Image source={{ uri: getPhotoUrl() || undefined }} style={styles.avatar} />
              {isUploading ? (
                <View style={styles.cameraBadge}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              ) : (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={32} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changePhotoButton}
              onPress={() => setShowPhotoPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Change Photo"
            >
              <Ionicons name="image-outline" size={28} color={colors.primary} />
              <AppText style={styles.changePhotoText}>
                Change Photo
              </AppText>
            </TouchableOpacity>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle" size={36} color={colors.primary} />
              <AppText style={styles.formSectionTitle}>
                Personal Details
              </AppText>
            </View>

            {/* First Name */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>First Name</AppText>
              </View>
              <TextInputField
                label=""
                value={profile.firstName}
                onChangeText={(text) => setProfile({ ...profile, firstName: text })}
                placeholder="Enter your first name"
                style={styles.inputField}
                accessibilityLabel="First Name input field"
              />
            </View>

            {/* Last Name */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="person-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Last Name</AppText>
              </View>
              <TextInputField
                label=""
                value={profile.lastName}
                onChangeText={(text) => setProfile({ ...profile, lastName: text })}
                placeholder="Enter your last name"
                style={styles.inputField}
                accessibilityLabel="Last Name input field"
              />
            </View>

            {/* Nick Name */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="happy-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Nickname (Optional)</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                What do your friends call you?
              </AppText>
              <TextInputField
                label=""
                value={profile.nickName}
                onChangeText={(text) => setProfile({ ...profile, nickName: text })}
                placeholder="Enter your nickname"
                style={styles.inputField}
                accessibilityLabel="Nickname input field"
              />
            </View>

            {/* Birthday */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="calendar-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Birthday</AppText>
              </View>
              <DatePickerInput
                label=""
                value={profile.birthday}
                onChangeText={handleBirthdayChange}
                accessibilityLabel="Birthday date picker"
              />
            </View>

            {/* Age (Read-only, calculated from birthday) */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="time-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Age</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                Automatically calculated from your birthday
              </AppText>
              <View style={styles.ageDisplay}>
                <AppText style={styles.ageValue}>
                  {profile.age && profile.age !== "" ? `${profile.age} years old` : "Select your birthday above"}
                </AppText>
              </View>
            </View>

            {/* Country */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="globe-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Country</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                Tap to select your country
              </AppText>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => cycleOption("country", selectOptions.country)}
                accessibilityRole="button"
                accessibilityLabel={`Country: ${profile.country || "Not selected"}. Tap to change.`}
              >
                <AppText style={profile.country ? styles.selectValue : styles.selectPlaceholder}>
                  {profile.country || "Select your country"}
                </AppText>
                <Ionicons name="chevron-down" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* City */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="location-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>City / Province</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                Tap to select your city
              </AppText>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => cycleOption("city", selectOptions.city)}
                accessibilityRole="button"
                accessibilityLabel={`City: ${profile.city || "Not selected"}. Tap to change.`}
              >
                <AppText style={profile.city ? styles.selectValue : styles.selectPlaceholder}>
                  {profile.city || "Select your city"}
                </AppText>
                <Ionicons name="chevron-down" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Civil Status */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="heart-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Relationship Status</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                Tap to select your status
              </AppText>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => cycleOption("civilStatus", selectOptions.civilStatus)}
                accessibilityRole="button"
                accessibilityLabel={`Relationship Status: ${profile.civilStatus || "Not selected"}. Tap to change.`}
              >
                <AppText style={profile.civilStatus ? styles.selectValue : styles.selectPlaceholder}>
                  {profile.civilStatus || "Select your status"}
                </AppText>
                <Ionicons name="chevron-down" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Hobby */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldLabelRow}>
                <Ionicons name="star-outline" size={24} color={colors.textSecondary} />
                <AppText style={styles.fieldLabel}>Favorite Hobby</AppText>
              </View>
              <AppText style={styles.fieldHint}>
                What do you enjoy doing?
              </AppText>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => cycleOption("hobby", selectOptions.hobby)}
                accessibilityRole="button"
                accessibilityLabel={`Hobby: ${profile.hobby || "Not selected"}. Tap to change.`}
              >
                <AppText style={profile.hobby ? styles.selectValue : styles.selectPlaceholder}>
                  {profile.hobby || "Select your hobby"}
                </AppText>
                <Ionicons name="chevron-down" size={28} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Help Card */}
            <View style={styles.helpCard}>
              <Ionicons name="information-circle" size={36} color={colors.accentTeal} />
              <View style={styles.helpTextContainer}>
                <AppText style={styles.helpTitle}>
                  Need Help?
                </AppText>
                <AppText style={styles.helpText}>
                  Fill in as much information as you can. This helps others get to know you better.
                </AppText>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
            onPress={handleSaveAndContinue}
            disabled={isSaving}
            accessibilityRole="button"
            accessibilityLabel={isSaving ? "Saving your information" : "Save and continue to next step"}
            accessibilityState={{ disabled: isSaving }}
          >
            {isSaving ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator size="large" color={colors.white} />
                <AppText style={styles.saveButtonText}>
                  Saving...
                </AppText>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <Ionicons name="checkmark-circle" size={32} color={colors.white} />
                <AppText style={styles.saveButtonText}>
                  Save & Continue
                </AppText>
                <Ionicons name="arrow-forward" size={32} color={colors.white} />
              </View>
            )}
          </TouchableOpacity>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>

      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onPhotoSelected={handlePhotoSelected}
        title="Change Your Photo"
      />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.white,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: 24,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    marginTop: 12,
    textAlign: "center",
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  stepActive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepInactive: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  stepNumberInactive: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textMuted,
  },
  stepLine: {
    flex: 1,
    height: 4,
    backgroundColor: colors.borderLight,
    marginHorizontal: 8,
  },
  stepLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 24,
  },

  // Photo Section
  photoSection: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: colors.backgroundLight,
    marginHorizontal: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: "center",
  },
  sectionDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 20,
  },
  avatar: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.borderLight,
    borderWidth: 5,
    borderColor: colors.white,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  changePhotoText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primary,
    marginLeft: 12,
  },

  // Form Section
  formSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.borderLight,
  },
  formSectionTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
    marginLeft: 16,
  },

  // Field Styles
  fieldContainer: {
    marginBottom: 28,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
    marginLeft: 12,
  },
  fieldHint: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 10,
    marginLeft: 36,
  },
  inputField: {
    fontSize: 20,
    minHeight: 60,
  },

  // Age Display (Read-only)
  ageDisplay: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 64,
    justifyContent: "center",
  },
  ageValue: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textPrimary,
  },

  // Select Button
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    minHeight: 64,
  },
  selectValue: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  selectPlaceholder: {
    fontSize: 20,
    color: colors.textMuted,
  },

  // Help Card
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.accentMint,
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.accentTeal + "40",
    marginTop: 16,
    marginBottom: 24,
  },
  helpTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.accentTeal,
    marginBottom: 6,
  },
  helpText: {
    fontSize: 18,
    color: colors.textPrimary,
    lineHeight: 26,
  },

  // Save Button
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    marginTop: 16,
    minHeight: 80,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
    marginHorizontal: 16,
  },

  bottomSpacer: {
    height: 40,
  },
});
