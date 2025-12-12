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
import {
  CIVIL_STATUS_OPTIONS,
  COUNTRIES,
  HOBBY_OPTIONS,
  PHILIPPINES_CITIES,
} from "../../constants/formData";
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
    validateField,
    setTouched,
  } = useFormikContext<any>();
  const toast = useToast();
  const { completeProfile, phase1Data, registrationFlow } = useAuth();
  const [isSaving, setIsSaving] = React.useState(false);

  // Animations
  const headerAnim = useSlideUp(500, 0, 30);
  const cardAnim = useSlideUp(600, 100, 40);
  const buttonAnim = useSlideUp(600, 200, 30);

  // Picker modal states
  const [countryPickerVisible, setCountryPickerVisible] = React.useState(false);
  const [civilStatusPickerVisible, setCivilStatusPickerVisible] =
    React.useState(false);
  const [cityPickerVisible, setCityPickerVisible] = React.useState(false);
  const [hobbyPickerVisible, setHobbyPickerVisible] = React.useState(false);

  // Auto-calculate age from birthday
  React.useEffect(() => {
    if (values.birthday) {
      const age = calculateAge(values.birthday);
      if (age !== null && age !== values.age) {
        setFieldValue("age", age.toString());
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

  // Calculate field completion for progress indicator
  // Note: Email removed - already collected in AccountIntroScreen
  const calculateCompletion = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "nickName",
      "birthday",
      "age",
      "country",
      "civilStatus",
      "city",
      "hobby",
    ];
    const completedFields = requiredFields.filter(
      (field) => values[field] && values[field].toString().trim() !== ""
    ).length;
    return { completed: completedFields, total: requiredFields.length };
  };

  const completion = calculateCompletion();
  const isFormComplete = completion.completed === completion.total;

  const handleNext = async () => {
    // First, mark all fields as touched so errors show
    const touchedFields = {
      firstName: true,
      lastName: true,
      nickName: true,
      birthday: true,
      age: true,
      country: true,
      civilStatus: true,
      city: true,
      hobby: true,
    };
    setTouched(touchedFields);

    // Validate the form
    const formErrors = await validateForm();

    // Get step1 specific errors (email removed - already collected in AccountIntroScreen)
    const step1Fields = ['firstName', 'lastName', 'nickName', 'birthday', 'age', 'country', 'civilStatus', 'city', 'hobby'];
    const step1Errors = step1Fields.filter(field => formErrors[field]);

    if (step1Errors.length > 0) {
      // Show ALL errors for better user feedback (elderly users need clear guidance)
      const errorMessages = step1Errors
        .map((field) => {
          const msg = formErrors[field];
          return typeof msg === 'string' ? msg : null;
        })
        .filter(Boolean);

      if (errorMessages.length > 0) {
        // Show count and first few errors
        if (errorMessages.length === 1) {
          toast.error(errorMessages[0] as string);
        } else {
          toast.error(
            `Please fix ${errorMessages.length} errors:\n• ${errorMessages.slice(0, 3).join('\n• ')}${errorMessages.length > 3 ? `\n• ...and ${errorMessages.length - 3} more` : ''}`
          );
        }
      } else {
        toast.warning("Please complete all required fields correctly.");
      }
      return;
    }

    // Check if form is complete
    if (!isFormComplete) {
      toast.warning("Please complete all required fields before continuing.");
      return;
    }

    // Validate age is 60 or older (extra check)
    const age = parseInt(values.age);
    if (isNaN(age) || age < 60) {
      toast.error("You must be 60 years or older to register for Tander.");
      return;
    }

    // Get username from phase1Data or registrationFlow
    const username = phase1Data?.username || registrationFlow?.username;

    if (!username) {
      toast.error("Session expired. Please start registration again.");
      return;
    }

    // Save progress to backend using completeProfile (sets profile_completed = true)
    setIsSaving(true);
    try {
      // Ensure date is in MM/dd/yyyy format for backend (already in this format from DatePicker)
      const formatDateForBackend = (dateStr: string): string => {
        // DatePicker outputs MM/DD/YYYY - backend expects MM/dd/yyyy
        // Just ensure proper padding
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const [month, day, year] = parts;
          return `${month.padStart(2, '0')}/${day.padStart(2, '0')}/${year}`;
        }
        return dateStr;
      };

      const formattedBirthDate = formatDateForBackend(values.birthday);
      console.log('📅 Original birthday:', values.birthday);
      console.log('📅 Formatted birthDate for backend:', formattedBirthDate);

      // Email is already collected in AccountIntroScreen, use it from phase1Data
      const profileData = {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || '',
        nickName: values.nickName,
        email: phase1Data?.email || '', // Use email from AccountIntroScreen
        birthDate: formattedBirthDate,
        age: parseInt(values.age),
        country: values.country,
        city: values.city,
        civilStatus: values.civilStatus,
        hobby: values.hobby || '',
        phone: values.phone || '',
        address: values.address || '',
      };

      console.log('📤 Sending profile data:', JSON.stringify(profileData, null, 2));

      await completeProfile(username, profileData);

      toast.success("Profile saved! Continuing to ID verification...");

      // Navigate to Step 2
      navigation.navigate("Step2");
    } catch (error: any) {
      console.error("Failed to save profile:", error);
      toast.error(error.message || "Failed to save profile. Please try again.");
    } finally {
      setIsSaving(false);
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
        <ProgressBar step={1} total={4} />

        {/* ANIMATED HEADER & LOGO */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerAnim.opacity,
              transform: [{ translateY: headerAnim.translateY }],
            },
          ]}
        >
          <Image
            source={require("../../assets/icons/tander-logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Welcome to Tander</Text>
          <Text style={styles.subtitle}>
            Complete your registration to join Tander for social connections,
            companionship, and dating.
          </Text>
        </Animated.View>
        {/* Completion Indicator */}
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
              name={
                isFormComplete
                  ? "checkmark-circle"
                  : "information-circle-outline"
              }
              size={18}
              color={isFormComplete ? colors.success : colors.textSecondary}
            />
            <Text style={styles.completionText}>
              {completion.completed} of {completion.total} fields completed
            </Text>
          </View>
          {!isFormComplete && (
            <Text style={styles.completionHint}>All fields are required</Text>
          )}
        </Animated.View>
      </SafeAreaView>
      <View style={styles.wrapper}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ANIMATED BASIC INFO CARD */}
          <Animated.View
            style={[
              styles.card,
              {
                opacity: cardAnim.opacity,
                transform: [{ translateY: cardAnim.translateY }],
              },
            ]}
          >
            <Text style={styles.cardTitle}>Basic Info</Text>

            {/* FIRST NAME */}
            <TextInputField
              label="First Name *"
              placeholder="Enter your first name"
              value={values.firstName}
              touched={!!touched.firstName}
              error={getErrorString(errors.firstName)}
              onChangeText={(t) => setFieldValue("firstName", t, true)}
              onBlur={() => setFieldTouched("firstName", true, false)}
            />

            {/* LAST NAME */}
            <TextInputField
              label="Last Name *"
              placeholder="Enter your last name"
              value={values.lastName}
              touched={!!touched.lastName}
              error={getErrorString(errors.lastName)}
              onChangeText={(t) => setFieldValue("lastName", t, true)}
              onBlur={() => setFieldTouched("lastName", true, false)}
            />

            {/* NICKNAME */}
            <TextInputField
              label="Nickname *"
              placeholder="How should we call you?"
              value={values.nickName}
              touched={!!touched.nickName}
              error={getErrorString(errors.nickName)}
              onChangeText={(t) => setFieldValue("nickName", t, true)}
              onBlur={() => setFieldTouched("nickName", true, false)}
            />

            {/* BIRTHDAY + AGE (2-column layout) */}
            <View style={styles.row}>
              <View style={styles.col}>
                <DatePickerInput
                  label="Birthday *"
                  placeholder="Select date"
                  value={values.birthday}
                  touched={!!touched.birthday}
                  error={touched.birthday && !values.birthday ? getErrorString(errors.birthday) : undefined}
                  onChangeText={async (date) => {
                    await setFieldValue("birthday", date, true);
                    setFieldTouched("birthday", true, false);
                  }}
                />
              </View>

              <View style={styles.col}>
                <View style={styles.ageContainer}>
                  <Text style={styles.label}>Age</Text>
                  <View style={[
                    styles.ageDisplay,
                    values.age && parseInt(values.age) < 60 && touched.birthday && styles.ageDisplayError
                  ]}>
                    <Text style={[
                      styles.ageText,
                      values.age && parseInt(values.age) < 60 && styles.ageTextError
                    ]}>
                      {values.age || "—"}
                    </Text>
                    {values.age && <Text style={styles.ageUnit}>years</Text>}
                  </View>
                  {values.age && parseInt(values.age) >= 60 && (
                    <Text style={styles.autoCalculated}>Auto-calculated</Text>
                  )}
                  {values.age && parseInt(values.age) < 60 && touched.birthday && (
                    <Text style={styles.ageError}>Must be 60+ years</Text>
                  )}
                </View>
              </View>
            </View>

            {/* COUNTRY + CIVIL STATUS */}
            <View style={styles.row}>
              <View style={styles.col}>
                <SelectField
                  label="Country *"
                  placeholder="Select country"
                  value={values.country}
                  touched={!!touched.country}
                  error={getErrorString(errors.country)}
                  onPress={() => setCountryPickerVisible(true)}
                />
              </View>

              <View style={styles.col}>
                <SelectField
                  label="Civil Status *"
                  placeholder="Select status"
                  value={values.civilStatus}
                  touched={!!touched.civilStatus}
                  error={getErrorString(errors.civilStatus)}
                  onPress={() => setCivilStatusPickerVisible(true)}
                />
              </View>
            </View>

            {/* CITY + HOBBY */}
            <View style={styles.row}>
              <View style={styles.col}>
                <SelectField
                  label="City/Province *"
                  placeholder="Select city"
                  value={values.city}
                  touched={!!touched.city}
                  error={getErrorString(errors.city)}
                  onPress={() => setCityPickerVisible(true)}
                />
              </View>

              <View style={styles.col}>
                <SelectField
                  label="Hobby *"
                  placeholder="Select hobby"
                  value={values.hobby}
                  touched={!!touched.hobby}
                  error={getErrorString(errors.hobby)}
                  onPress={() => setHobbyPickerVisible(true)}
                />
              </View>
            </View>
          </Animated.View>

          {/* Spacer for bottom navigation */}
          <View style={{ height: 20 }} />
        </ScrollView>

        {/* ANIMATED Bottom Navigation */}
        <Animated.View
          style={[
            styles.bottomNav,
            {
              opacity: buttonAnim.opacity,
              transform: [{ translateY: buttonAnim.translateY }],
            },
          ]}
        >
          {/* Next Button (no back button on step 1) */}
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!isFormComplete || isSaving) && styles.nextButtonMuted,
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
                  style={[styles.nextText, !isFormComplete && styles.nextTextMuted]}
                >
                  {isFormComplete ? "Continue to ID Verification" : "Complete All Fields"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={isFormComplete ? colors.white : "#9CA3AF"}
                />
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* PICKER MODALS */}
        <PickerModal
          visible={countryPickerVisible}
          title="Select Country"
          options={COUNTRIES}
          selectedValue={values.country}
          onSelect={async (value) => {
            await setFieldValue("country", value, true);
            setFieldTouched("country", true, false);
          }}
          onClose={() => setCountryPickerVisible(false)}
          searchPlaceholder="Search country..."
        />

        <PickerModal
          visible={civilStatusPickerVisible}
          title="Select Civil Status"
          options={CIVIL_STATUS_OPTIONS}
          selectedValue={values.civilStatus}
          onSelect={async (value) => {
            await setFieldValue("civilStatus", value, true);
            setFieldTouched("civilStatus", true, false);
          }}
          onClose={() => setCivilStatusPickerVisible(false)}
          enableSearch={false}
        />

        <PickerModal
          visible={cityPickerVisible}
          title="Select City/Province"
          options={PHILIPPINES_CITIES}
          selectedValue={values.city}
          onSelect={async (value) => {
            await setFieldValue("city", value, true);
            setFieldTouched("city", true, false);
          }}
          onClose={() => setCityPickerVisible(false)}
          searchPlaceholder="Search city..."
        />

        <PickerModal
          visible={hobbyPickerVisible}
          title="Select Hobby"
          options={HOBBY_OPTIONS}
          selectedValue={values.hobby}
          onSelect={async (value) => {
            await setFieldValue("hobby", value, true);
            setFieldTouched("hobby", true, false);
          }}
          onClose={() => setHobbyPickerVisible(false)}
          searchPlaceholder="Search hobby..."
        />
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    // backgroundColor: colors.backgroundLight,
  },

  container: {
    flex: 1,
    padding: 20,
    // backgroundColor: colors.backgroundLight,
  },
  headerView: {
    padding: 20,
    // backgroundColor: colors.backgroundLight,
  },

  header: {
    alignItems: "center",
    marginBottom: 16,
  },

  logo: {
    width: 36,
    height: 36,
    marginBottom: 10,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 6,
    color: colors.textPrimary,
  },

  subtitle: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    width: "95%",
    fontSize: 16, // Increased for elderly users
  },

  completionIndicator: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 0,
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
    fontSize: 14, // Increased for elderly users
    color: colors.textSecondary,
    marginTop: 4,
    marginLeft: 26,
  },

  card: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    color: colors.textPrimary,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  col: {
    flex: 1,
  },

  ageContainer: {
    marginBottom: 18,
  },

  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 14,
    color: colors.textPrimary,
  },

  ageDisplay: {
    backgroundColor: colors.backgroundLight,
    borderWidth: 1.5,
    borderColor: colors.borderMedium,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 6,
  },

  ageText: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary,
  },

  ageUnit: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  autoCalculated: {
    fontSize: 13, // Increased for elderly users
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  ageDisplayError: {
    borderColor: "#D9534F",
    backgroundColor: "#FEF2F2",
  },

  ageTextError: {
    color: "#D9534F",
  },

  ageError: {
    fontSize: 14, // Increased for elderly users
    color: "#D9534F",
    marginTop: 4,
    textAlign: "center",
    fontWeight: "600",
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

  nextButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 16,
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

  nextButtonMuted: {
    backgroundColor: colors.borderMedium,
    shadowOpacity: 0.05,
    elevation: 0,
  },

  nextText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },

  nextTextMuted: {
    color: "#9CA3AF",
  },
});
