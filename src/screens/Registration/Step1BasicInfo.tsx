import ProgressBar from "@/src/components/ui/ProgressBar";
import { getErrorString } from "@/src/utility/helpers";
import { Ionicons } from "@expo/vector-icons";
import { useFormikContext } from "formik";
import React from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import FullScreen from "@/src/components/layout/FullScreen";
import { Step1Nav } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import SelectField from "../../components/forms/SelectField";
import TextInputField from "../../components/forms/TextInputField";
import DatePickerInput from "../../components/inputs/DatePickerInput";
import PickerModal from "../../components/modals/PickerModal";
import colors from "../../config/colors";
import { PHILIPPINES_CITIES } from "../../constants/formData";
import { useSlideUp } from "../../hooks/useFadeIn";
import { useToast } from "@/src/context/ToastContext";
import { useAuth } from "@/src/hooks/useAuth";

interface Props {
  navigation: Step1Nav;
}

export default function Step1BasicInfo({ navigation }: Props) {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    setTouched,
  } = useFormikContext<any>();
  const toast = useToast();
  const { completeProfile, phase1Data, registrationFlow } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 100, 40);
  const buttonAnim = useSlideUp(600, 200, 30);

  // Picker modal state
  const [cityPickerVisible, setCityPickerVisible] = React.useState(false);

  // Auto-calculate age from birthday
  React.useEffect(() => {
    if (values.birthday) {
      const age = calculateAge(values.birthday);
      if (age !== null && age !== values.age) {
        setFieldValue("age", age.toString());
        // Auto-set country to Philippines (app is PH-only)
        if (!values.country) {
          setFieldValue("country", "Philippines");
        }
      }
    }
  }, [values.birthday]);

  const calculateAge = (dateString: string): number | null => {
    if (!dateString) return null;

    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(dateString)) return null;

    const [month, day, year] = dateString.split("/").map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age >= 0 ? age : null;
  };

  // Simplified field completion - only 4 visible fields + auto-filled country
  const calculateCompletion = () => {
    const requiredFields = ["firstName", "lastName", "nickName", "birthday", "city"];
    const completedFields = requiredFields.filter(
      (field) => values[field] && values[field].toString().trim() !== ""
    ).length;
    return { completed: completedFields, total: requiredFields.length };
  };

  const completion = calculateCompletion();
  const isFormComplete = completion.completed === completion.total;
  const age = values.age ? parseInt(values.age) : null;
  const isAgeValid = age !== null && age >= 60;

  const handleNext = async () => {
    // Mark all fields as touched
    const touchedFields = {
      firstName: true,
      lastName: true,
      nickName: true,
      birthday: true,
      age: true,
      city: true,
    };
    setTouched(touchedFields);

    // Validate the form
    const formErrors = await validateForm();

    // Check for step1 specific errors
    const step1Fields = ["firstName", "lastName", "nickName", "birthday", "age", "city"];
    const step1Errors = step1Fields.filter((field) => formErrors[field]);

    if (step1Errors.length > 0) {
      const errorMessages = step1Errors
        .map((field) => {
          const msg = formErrors[field];
          return typeof msg === "string" ? msg : null;
        })
        .filter(Boolean);

      if (errorMessages.length > 0) {
        if (errorMessages.length === 1) {
          toast.error(errorMessages[0] as string);
        } else {
          toast.error(
            `Please fix ${errorMessages.length} errors:\n• ${errorMessages.slice(0, 3).join("\n• ")}`
          );
        }
      } else {
        toast.warning("Please complete all fields.");
      }
      return;
    }

    // Check age requirement
    if (!isAgeValid) {
      toast.error("Tander is for seniors 60 years and above.");
      return;
    }

    // Get username
    const username = phase1Data?.username || registrationFlow?.username;

    if (!username) {
      toast.error("Session expired. Please start registration again.");
      return;
    }

    // Save to backend
    setIsSaving(true);
    try {
      const formatDateForBackend = (dateStr: string): string => {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const [month, day, year] = parts;
          return `${month.padStart(2, "0")}/${day.padStart(2, "0")}/${year}`;
        }
        return dateStr;
      };

      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || "",
        nickName: values.nickName,
        email: phase1Data?.email || "",
        birthDate: formatDateForBackend(values.birthday),
        age: parseInt(values.age),
        country: "Philippines", // Hard-coded: PH-only app
        city: values.city,
        civilStatus: values.civilStatus || "", // Will be filled in Step 4
        hobby: "", // Removed - replaced by interests in Step 4
        phone: values.phone || "",
        address: values.address || "",
      };

      await completeProfile(username, profileData);
      toast.success("Profile saved!");
      navigation.navigate("Step2");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
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
        <ProgressBar step={1} total={4} />

        {/* Header */}
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
            <Ionicons name="person" size={28} color={colors.primary} />
            <Text style={styles.title}>Basic Information</Text>
          </View>
          <Text style={styles.subtitle}>
            Tell us about yourself. This helps others get to know you.
          </Text>
        </Animated.View>

        {/* Progress Indicator */}
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
            <View style={styles.progressDots}>
              {[...Array(completion.total)].map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i < completion.completed && styles.progressDotFilled,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>
              {completion.completed} of {completion.total} completed
            </Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Form Card */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim.opacity,
                transform: [{ translateY: cardAnim.translateY }],
              },
            ]}
          >
            {/* First Name - Full Width */}
            <View style={styles.fieldContainer}>
              <TextInputField
                label="First Name"
                placeholder="Enter your first name"
                value={values.firstName}
                touched={!!touched.firstName}
                error={getErrorString(errors.firstName)}
                onChangeText={(t) => setFieldValue("firstName", t, true)}
                onBlur={() => setFieldTouched("firstName", true, false)}
              />
            </View>

            {/* Last Name - Full Width */}
            <View style={styles.fieldContainer}>
              <TextInputField
                label="Last Name"
                placeholder="Enter your last name"
                value={values.lastName}
                touched={!!touched.lastName}
                error={getErrorString(errors.lastName)}
                onChangeText={(t) => setFieldValue("lastName", t, true)}
                onBlur={() => setFieldTouched("lastName", true, false)}
              />
            </View>

            {/* Nickname - Full Width */}
            <View style={styles.fieldContainer}>
              <TextInputField
                label="Nickname"
                placeholder="What should we call you?"
                value={values.nickName}
                touched={!!touched.nickName}
                error={getErrorString(errors.nickName)}
                onChangeText={(t) => setFieldValue("nickName", t, true)}
                onBlur={() => setFieldTouched("nickName", true, false)}
              />
              <Text style={styles.fieldHint}>
                This is what others will see on your profile
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Birthday - Full Width with large display */}
            <View style={styles.fieldContainer}>
              <DatePickerInput
                label="Birthday"
                placeholder="Tap to select your birthday"
                value={values.birthday}
                touched={!!touched.birthday}
                error={
                  touched.birthday && !values.birthday
                    ? getErrorString(errors.birthday)
                    : undefined
                }
                onChangeText={async (date) => {
                  await setFieldValue("birthday", date, true);
                  setFieldTouched("birthday", true, false);
                }}
              />
            </View>

            {/* Age Display - Large and Clear */}
            {values.birthday && (
              <View style={styles.ageCard}>
                <View style={styles.ageContent}>
                  <Ionicons
                    name={isAgeValid ? "checkmark-circle" : "alert-circle"}
                    size={32}
                    color={isAgeValid ? colors.success : colors.error}
                  />
                  <View style={styles.ageTextContainer}>
                    <Text style={styles.ageLabel}>Your Age</Text>
                    <Text
                      style={[
                        styles.ageValue,
                        !isAgeValid && styles.ageValueError,
                      ]}
                    >
                      {age} years old
                    </Text>
                  </View>
                </View>
                {!isAgeValid && (
                  <Text style={styles.ageWarning}>
                    Tander is for seniors 60 years and above
                  </Text>
                )}
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* City - Full Width */}
            <View style={styles.fieldContainer}>
              <SelectField
                label="City / Province"
                placeholder="Select your location"
                value={values.city}
                touched={!!touched.city}
                error={getErrorString(errors.city)}
                onPress={() => setCityPickerVisible(true)}
              />
            </View>
          </Animated.View>

          <View style={styles.bottomSpacer} />
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
            style={[
              styles.nextButton,
              (!isFormComplete || !isAgeValid || isSaving) && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <ActivityIndicator size="small" color={colors.white} />
                <Text style={styles.nextText}>Saving...</Text>
              </>
            ) : (
              <>
                <Text
                  style={[
                    styles.nextText,
                    (!isFormComplete || !isAgeValid) && styles.nextTextDisabled,
                  ]}
                >
                  {!isFormComplete
                    ? "Complete All Fields"
                    : !isAgeValid
                    ? "Must be 60+ Years Old"
                    : "Next: ID Verification"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    isFormComplete && isAgeValid ? colors.white : colors.disabledText
                  }
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* City Picker Modal */}
        <PickerModal
          visible={cityPickerVisible}
          title="Select City / Province"
          options={PHILIPPINES_CITIES}
          selectedValue={values.city}
          onSelect={async (value) => {
            await setFieldValue("city", value, true);
            setFieldTouched("city", true, false);
          }}
          onClose={() => setCityPickerVisible(false)}
          searchPlaceholder="Search for a city..."
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
    paddingBottom: 120,
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
    justifyContent: "space-between",
  },
  progressDots: {
    flexDirection: "row",
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.borderMedium,
  },
  progressDotFilled: {
    backgroundColor: colors.success,
  },
  progressText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  // Form Card
  card: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 20,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  fieldContainer: {
    marginBottom: 8,
  },
  fieldHint: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: -12,
    marginBottom: 8,
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 16,
  },

  // Age Card
  ageCard: {
    backgroundColor: colors.backgroundCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  ageContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ageTextContainer: {
    flex: 1,
  },
  ageLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  ageValue: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.success,
  },
  ageValueError: {
    color: colors.error,
  },
  ageWarning: {
    fontSize: 14,
    color: colors.error,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },

  // Bottom Navigation
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
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
  nextButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
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
  nextText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
  },
  nextTextDisabled: {
    color: colors.disabledText,
  },
  bottomSpacer: {
    height: 20,
  },
});
