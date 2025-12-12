import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppTextInput from "@/src/components/common/AppTextInput";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { createAccountSchema } from "@/src/validation/schemas/createAccount";
import { useAuth } from "@/src/hooks/useAuth";
import { useToast } from "@/src/context/ToastContext";

type FormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

// Password strength checker for elderly-friendly feedback
const getPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passedChecks = Object.values(checks).filter(Boolean).length;
  const strength = passedChecks === 0 ? 0 : passedChecks === 1 ? 1 : passedChecks === 2 ? 2 : 3;

  return { checks, strength };
};

export default function AccountIntroScreen() {
  const [useBiometric, setUseBiometric] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, setPhase1Data } = useAuth();
  const toast = useToast();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={["#C8E6E2", "#FFE2C1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Sticky Header */}
      <SafeAreaView edges={["top"]} style={styles.headerView}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.avatarCircle}>
            <Image
              source={require("../../assets/icons/tander-logo.png")}
              style={styles.avatar}
              resizeMode="contain"
            />
          </View>
        </Animated.View>

        <AppText weight="semibold" style={styles.title}>
          Create Account
        </AppText>
        <AppText style={styles.subtitle}>
          Set up your profile to start connecting with the community.
        </AppText>
      </SafeAreaView>

      {/* Scrollable Content */}
      <View style={styles.wrapper}>
        <Formik<FormValues>
          initialValues={{
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          }}
          validationSchema={createAccountSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              const username = values.username.trim();
              const email = values.email.trim() || `${username}@tander.app`;

              const payload = {
                username,
                email,
                password: values.password,
              };

              console.log("📤 Registering user:", payload);

              await register(payload);

              // Store phase1 data for use in profile completion
              setPhase1Data({
                username: payload.username,
                email: payload.email,
                password: values.password,
              });

              toast.success(
                "Account created successfully! Please complete your profile.",
                4000
              );

              // Navigate to registration flow
              NavigationService.navigate("Auth", { screen: "Register" });
            } catch (error: any) {
              console.error("Registration error:", error);

              // Show appropriate error toast
              const errorMessage = error.message || "Unable to complete registration";

              if (errorMessage.toLowerCase().includes("username")) {
                toast.error("This username is already taken. Please choose another.");
              } else if (errorMessage.toLowerCase().includes("email")) {
                toast.error("This email is already registered. Try logging in instead.");
              } else if (errorMessage.toLowerCase().includes("network") || errorMessage.toLowerCase().includes("timeout")) {
                toast.error("Network error. Please check your connection and try again.");
              } else {
                toast.error(errorMessage);
              }
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({
            handleChange,
            handleBlur,
            handleSubmit,
            values,
            errors,
            touched,
            isValid,
            dirty,
            isSubmitting,
          }) => (
            <>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                {/* Form Card */}
                <Animated.View
                  style={[
                    styles.card,
                    { opacity: fadeAnim, transform: [{ translateY }] },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.iconCircle}>
                      <Ionicons name="person-add" size={20} color={colors.accentBlue} />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.cardTitle}>Sign up to get started</Text>
                      <Text style={styles.cardSubtitle}>
                        We keep your information private and secure.
                      </Text>
                    </View>
                  </View>

                  <AppTextInput
                    icon="person-outline"
                    placeholder="Username *"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={values.username}
                    onChangeText={handleChange("username")}
                    onBlur={handleBlur("username")}
                    error={touched.username ? errors.username : undefined}
                  />

                  <AppTextInput
                    icon="mail-outline"
                    placeholder="Email (optional)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={values.email}
                    onChangeText={handleChange("email")}
                    onBlur={handleBlur("email")}
                    error={touched.email ? errors.email : undefined}
                  />

                  {/* Password field with show/hide toggle */}
                  <View style={styles.passwordContainer}>
                    <AppTextInput
                      icon="lock-closed-outline"
                      placeholder="Create a password *"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={touched.password ? errors.password : undefined}
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowPassword(!showPassword)}
                      accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password strength indicator - elderly friendly */}
                  {values.password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBarContainer}>
                        {[1, 2, 3].map((level) => (
                          <View
                            key={level}
                            style={[
                              styles.strengthBar,
                              getPasswordStrength(values.password).strength >= level &&
                                (level === 1 ? styles.strengthWeak :
                                 level === 2 ? styles.strengthMedium :
                                 styles.strengthStrong)
                            ]}
                          />
                        ))}
                      </View>
                      <Text style={styles.strengthText}>
                        {getPasswordStrength(values.password).strength === 0 && "Too weak"}
                        {getPasswordStrength(values.password).strength === 1 && "Weak"}
                        {getPasswordStrength(values.password).strength === 2 && "Good"}
                        {getPasswordStrength(values.password).strength === 3 && "Strong"}
                      </Text>
                      {/* Requirements checklist for elderly users */}
                      <View style={styles.requirementsList}>
                        <View style={styles.requirementItem}>
                          <Ionicons
                            name={getPasswordStrength(values.password).checks.length ? "checkmark-circle" : "ellipse-outline"}
                            size={18}
                            color={getPasswordStrength(values.password).checks.length ? colors.success : colors.textMuted}
                          />
                          <Text style={[
                            styles.requirementText,
                            getPasswordStrength(values.password).checks.length && styles.requirementMet
                          ]}>
                            At least 8 characters
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons
                            name={getPasswordStrength(values.password).checks.uppercase ? "checkmark-circle" : "ellipse-outline"}
                            size={18}
                            color={getPasswordStrength(values.password).checks.uppercase ? colors.success : colors.textMuted}
                          />
                          <Text style={[
                            styles.requirementText,
                            getPasswordStrength(values.password).checks.uppercase && styles.requirementMet
                          ]}>
                            One uppercase letter (A-Z)
                          </Text>
                        </View>
                        <View style={styles.requirementItem}>
                          <Ionicons
                            name={getPasswordStrength(values.password).checks.number ? "checkmark-circle" : "ellipse-outline"}
                            size={18}
                            color={getPasswordStrength(values.password).checks.number ? colors.success : colors.textMuted}
                          />
                          <Text style={[
                            styles.requirementText,
                            getPasswordStrength(values.password).checks.number && styles.requirementMet
                          ]}>
                            One number (0-9)
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Confirm password with show/hide toggle */}
                  <View style={styles.passwordContainer}>
                    <AppTextInput
                      icon="shield-checkmark-outline"
                      placeholder="Confirm password *"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      value={values.confirmPassword}
                      onChangeText={handleChange("confirmPassword")}
                      onBlur={handleBlur("confirmPassword")}
                      error={
                        touched.confirmPassword ? errors.confirmPassword : undefined
                      }
                    />
                    <TouchableOpacity
                      style={styles.eyeButton}
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      accessibilityLabel={showConfirmPassword ? "Hide password" : "Show password"}
                      accessibilityRole="button"
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={24}
                        color={colors.textSecondary}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Password match indicator */}
                  {values.confirmPassword.length > 0 && (
                    <View style={styles.matchIndicator}>
                      <Ionicons
                        name={values.password === values.confirmPassword ? "checkmark-circle" : "close-circle"}
                        size={20}
                        color={values.password === values.confirmPassword ? colors.success : colors.error}
                      />
                      <Text style={[
                        styles.matchText,
                        values.password === values.confirmPassword ? styles.matchSuccess : styles.matchError
                      ]}>
                        {values.password === values.confirmPassword ? "Passwords match" : "Passwords do not match"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.biometricRow}>
                    <View style={styles.biometricTextContainer}>
                      <Text style={styles.biometricTitle}>Enable Biometric</Text>
                      <Text style={styles.biometricSubtitle}>
                        Use fingerprint or face ID for faster login.
                      </Text>
                    </View>
                    <Switch
                      value={useBiometric}
                      onValueChange={setUseBiometric}
                      trackColor={{
                        false: colors.borderMedium,
                        true: colors.primary,
                      }}
                      thumbColor={
                        useBiometric ? colors.white : colors.backgroundLight
                      }
                    />
                  </View>
                </Animated.View>

                {/* Spacer for bottom navigation */}
                <View style={{ height: 20 }} />
              </ScrollView>

              {/* Sticky Footer */}
              <Animated.View
                style={[
                  styles.bottomNav,
                  { opacity: fadeAnim, transform: [{ translateY }] },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isValid || !dirty || isSubmitting) && styles.submitButtonDisabled,
                  ]}
                  onPress={handleSubmit as () => void}
                  disabled={!isValid || !dirty || isSubmitting}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.submitText,
                      (!isValid || !dirty || isSubmitting) && styles.submitTextDisabled,
                    ]}
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={isValid && dirty && !isSubmitting ? colors.white : "#9CA3AF"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    NavigationService.replace("Auth", {
                      screen: "LoginScreen",
                    })
                  }
                  style={styles.footerLink}
                >
                  <Text style={styles.footerText}>
                    Already have an account?
                    <Text style={styles.footerAction}> Sign In</Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </Formik>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  headerView: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 8 : 12,
    paddingBottom: 16,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 36,
    height: 36,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    color: colors.textPrimary,
    marginTop: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.backgroundLight,
    marginTop: 8,
  },
  biometricTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  biometricTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  biometricSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === "ios" ? 30 : 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 4,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: "#E5E7EB",
    shadowOpacity: 0.05,
    elevation: 0,
  },
  submitText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "700",
  },
  submitTextDisabled: {
    color: "#9CA3AF",
  },
  footerLink: {
    marginTop: 14,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  footerAction: {
    color: colors.accentTeal,
    fontWeight: "700",
  },
  // Password visibility toggle styles
  passwordContainer: {
    position: "relative",
  },
  eyeButton: {
    position: "absolute",
    right: 16,
    top: 18,
    padding: 8,
    zIndex: 1,
  },
  // Password strength indicator styles
  strengthContainer: {
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  strengthBarContainer: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
  },
  strengthBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E5E5",
  },
  strengthWeak: {
    backgroundColor: "#EF4444",
  },
  strengthMedium: {
    backgroundColor: "#F59E0B",
  },
  strengthStrong: {
    backgroundColor: "#22C55E",
  },
  strengthText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    marginBottom: 8,
  },
  requirementsList: {
    gap: 6,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  requirementMet: {
    color: colors.success,
  },
  // Password match indicator
  matchIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -8,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  matchText: {
    fontSize: 14,
    fontWeight: "500",
  },
  matchSuccess: {
    color: colors.success,
  },
  matchError: {
    color: colors.error,
  },
});
