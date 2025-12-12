import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import TextInputField from "@/src/components/forms/TextInputField";
import FullScreen from "@/src/components/layout/FullScreen";
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

type EditBasicNav = NativeStackNavigationProp<AppStackParamList>;

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

  // Check if profile has unsaved changes
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

  // Handle hardware back button on Android
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

  // Show alert when user has unsaved changes
  const showUnsavedChangesAlert = () => {
    Alert.alert(
      "Unsaved Changes",
      "You have changes that haven't been saved. Are you sure you want to leave? Your changes will be lost.",
      [
        {
          text: "Stay",
          style: "cancel",
        },
        {
          text: "Leave Without Saving",
          style: "destructive",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Load current profile data
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await userApi.getCurrentUser();
      const loadedProfile: ProfileFormData = {
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        nickName: userData.nickName || "",
        birthday: userData.birthDate || "",
        age: userData.age?.toString() || "",
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
      } else {
        // Handle non-success response
        Alert.alert(
          "Upload Failed",
          result.message || "Could not upload photo. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error: any) {
      console.error("Failed to upload photo:", error);
      Alert.alert(
        "Upload Failed",
        error.message || "Could not upload photo. Please check your connection and try again.",
        [{ text: "OK" }]
      );
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
      navigation.navigate("EditAboutYouScreen");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => handleSaveAndContinue();

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="body" color={colors.textSecondary} style={{ marginTop: 16 }}>
            Loading profile...
          </AppText>
        </View>
      </FullScreen>
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <TouchableOpacity
            style={styles.avatarCard}
            onPress={() => setShowPhotoPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            activeOpacity={0.9}
          >
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: getPhotoUrl() || undefined }} style={styles.avatar} />
              {isUploading ? (
                <View style={styles.uploadingBadge}>
                  <ActivityIndicator size="small" color={colors.white} />
                </View>
              ) : (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera" size={14} color={colors.white} />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : "Your Name"}
              </AppText>
              <AppText size="small" color={colors.textSecondary}>
                Tap to change profile photo
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Basic Info
            </AppText>
          </View>

          <View style={styles.card}>
            <TextInputField
              label="First Name"
              value={profile.firstName}
              onChangeText={(text) => setProfile({ ...profile, firstName: text })}
            />

            <TextInputField
              label="Last Name"
              value={profile.lastName}
              onChangeText={(text) => setProfile({ ...profile, lastName: text })}
            />

            <TextInputField
              label="Nick Name"
              value={profile.nickName}
              onChangeText={(text) => setProfile({ ...profile, nickName: text })}
            />

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <DatePickerInput
                  label="Birthday"
                  value={profile.birthday}
                  onChangeText={(text) => setProfile({ ...profile, birthday: text })}
                />
              </View>
              <View style={styles.flexItem}>
                <TextInputField
                  label="Age"
                  value={profile.age}
                  onChangeText={(text) => setProfile({ ...profile, age: text })}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <SelectField
                  label="Country"
                  value={profile.country}
                  onPress={() => cycleOption("country", selectOptions.country)}
                  placeholder="Select country"
                />
              </View>
              <View style={styles.flexItem}>
                <SelectField
                  label="Civil Status"
                  value={profile.civilStatus}
                  onPress={() =>
                    cycleOption("civilStatus", selectOptions.civilStatus)
                  }
                  placeholder="Select status"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.flexItem}>
                <SelectField
                  label="City/Province"
                  value={profile.city}
                  onPress={() => cycleOption("city", selectOptions.city)}
                  placeholder="Select city"
                />
              </View>
              <View style={styles.flexItem}>
                <SelectField
                  label="Hobby"
                  value={profile.hobby}
                  onPress={() => cycleOption("hobby", selectOptions.hobby)}
                  placeholder="Select hobby"
                />
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.nextButton, isSaving && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <AppText weight="bold" color={colors.white} style={{ textAlign: "center" }}>
                  Save & Continue to About You
                </AppText>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.white}
                  style={{ marginLeft: 6 }}
                />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>

      {/* Photo Picker Modal */}
      <PhotoPicker
        visible={showPhotoPicker}
        onClose={() => setShowPhotoPicker(false)}
        onPhotoSelected={handlePhotoSelected}
        title="Update Profile Photo"
      />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 18,
  },
  avatarCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    minHeight: 100,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionHeader: {
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  flexItem: {
    flex: 1,
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    minHeight: 60,
  },
  nextButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  uploadingBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
