import GradientButton from "@/src/components/buttons/GradientButton";
import SocialButton from "@/src/components/buttons/SocialButton";
import AuthFooterLink from "@/src/components/common/AuthFooterLink";
import CheckboxWithLabel from "@/src/components/common/CheckboxWithLabel";
import FullScreen from "@/src/components/layout/FullScreen";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeaderWithLogo from "../../components/common/AppHeaderWithLogo";
import AppTextInput from "../../components/common/AppTextInput";
import FormCard from "../../components/common/FormCard";
import colors from "../../config/colors";

import { loginSchema } from "@/src/validation/schemas/login";
import { Formik } from "formik";

import UniversalBiometricButton from "@/src/components/buttons/UniversalBiometricButton";
import NavigationService from "@/src/navigation/NavigationService";

// 🔥 Our new Google login hook
import { useToast } from "@/src/context/ToastContext";
import { useAuth } from "@/src/hooks/useAuth";
import { useGoogleLogin } from "@/src/hooks/useGoogleLogin";
import biometricService from "@/src/services/biometricService";
import { isTablet, SCREEN_HEIGHT } from "@/src/utility/responsive";

export default function LoginScreen() {
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // 🎉 Import Google login handler
  const { login: googleLogin } = useGoogleLogin();

  // 🎉 Import auth handler
  const { login } = useAuth();

  // 🎉 Import toast handler
  const toast = useToast();

  // Check biometric availability on mount and when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      checkBiometricStatus();
    }, [])
  );

  const checkBiometricStatus = async () => {
    const available = await biometricService.isAvailable();
    const enabled = await biometricService.isBiometricLoginEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  // ⭐ GOOGLE LOGIN HANDLER
  const handleGoogleLogin = async () => {
    try {
      const user = await googleLogin();
      if (!user) {
        toast.error("Google login failed. Please try again.");
        return;
      }

      console.log("GOOGLE USER:", user);
      toast.success("Successfully signed in with Google!");
      NavigationService.replace("LoginSuccessScreen");
    } catch (err) {
      console.log("Google Login Error:", err);
      toast.error("Google login failed. Please try again.");
    }
  };

  // ⭐ BIOMETRIC HANDLER - Now performs actual login with stored credentials
  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);

      // Get credentials after biometric authentication
      const credentials = await biometricService.performBiometricLogin();

      if (!credentials) {
        // No credentials stored or biometric failed - show message
        const biometricType = await biometricService.getBiometricType();
        const biometricLabel =
          biometricService.getBiometricLabel(biometricType);
        toast.error(
          `${biometricLabel} authentication failed. Please try again.`
        );
        return;
      }

      // Perform actual login with stored credentials
      await login(credentials);
      toast.success("Welcome back!");
      NavigationService.replace("HomeScreen");
    } catch (error: any) {
      console.error("Biometric login error:", error);

      // Handle specific errors like profile/ID incomplete
      if (error.profileIncomplete) {
        toast.warning("Please complete your profile first.");
        setTimeout(() => {
          NavigationService.navigate("Auth", {
            screen: "Register",
            params: { screen: "Step1" },
          });
        }, 1500);
      } else if (error.idVerificationIncomplete) {
        toast.warning("Please complete ID verification first.");
        setTimeout(() => {
          NavigationService.navigate("Auth", {
            screen: "Register",
            params: { screen: "Step2" },
          });
        }, 1500);
      } else {
        toast.error("Login failed. Please try with your password.");
        // Clear stored credentials if they're invalid
        await biometricService.clearCredentials();
        setBiometricEnabled(false);
      }
    } finally {
      setIsLoading(false);
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
      {/* HEADER */}
      <SafeAreaView edges={["top"]} style={styles.headerView}>
        <View>
          <AppHeaderWithLogo />
        </View>
      </SafeAreaView>

      <SafeAreaView style={styles.safeArea}>
        {/* FORM */}
        <View style={styles.body}>
          <FormCard
            title="Login to your account"
            subtitle="Welcome back, we missed you!"
            style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
            // style={styles.formCard}
          >
            <View style={styles.content}>
              <Formik
                initialValues={{ username: "", password: "" }}
                validationSchema={loginSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    setIsLoading(true);

                    await login(values);

                    // Credentials are saved automatically in AuthProvider
                    // Show appropriate message based on biometric availability
                    if (biometricAvailable) {
                      const biometricType =
                        await biometricService.getBiometricType();
                      const biometricLabel =
                        biometricService.getBiometricLabel(biometricType);
                      setBiometricEnabled(true);
                      toast.success(
                        `Login successful! ${biometricLabel} has been enabled for faster sign-in.`
                      );
                    } else {
                      toast.success("Login successful! Welcome back.");
                    }

                    NavigationService.replace("HomeScreen");
                  } catch (error: any) {
                    console.error("Login error:", error);

                    // Check if error is due to incomplete profile (profile_completed = false)
                    if (error.profileIncomplete) {
                      toast.showToast({
                        type: "warning",
                        message: "Please complete your profile to continue.",
                        duration: 6000,
                        action: {
                          label: "Complete Profile",
                          onPress: () =>
                            NavigationService.navigate("Auth", {
                              screen: "Register",
                              params: { screen: "Step1" },
                            }),
                        },
                      });

                      // Auto-redirect to Step1 after a short delay
                      setTimeout(() => {
                        NavigationService.navigate("Auth", {
                          screen: "Register",
                          params: { screen: "Step1" },
                        });
                      }, 1500);
                    }
                    // Check if error is due to ID verification incomplete (id_verified = false)
                    else if (error.idVerificationIncomplete) {
                      const status = error.idVerificationStatus || "PENDING";
                      let message =
                        "Please complete ID verification to continue.";

                      if (status === "REJECTED") {
                        message =
                          "Your ID verification was rejected. You must be 60+ years old to use Tander.";
                      } else if (status === "FAILED") {
                        message =
                          "ID verification failed. Please try again with a clearer photo.";
                      }

                      toast.showToast({
                        type: "warning",
                        message,
                        duration: 6000,
                        action: {
                          label: "Verify ID",
                          onPress: () =>
                            NavigationService.navigate("Auth", {
                              screen: "Register",
                              params: { screen: "Step2" },
                            }),
                        },
                      });

                      // Auto-redirect to Step2 (ID Verification) after a short delay
                      setTimeout(() => {
                        NavigationService.navigate("Auth", {
                          screen: "Register",
                          params: { screen: "Step2" },
                        });
                      }, 1500);
                    } else if (error.code === "INVALID_CREDENTIALS") {
                      toast.error(
                        "Incorrect username or password. Please try again."
                      );
                    } else {
                      toast.error(
                        error.message || "An error occurred. Please try again."
                      );
                    }
                  } finally {
                    setIsLoading(false);
                    setSubmitting(false);
                  }
                }}
              >
                {({
                  handleChange,
                  handleSubmit,
                  handleBlur,
                  values,
                  errors,
                  touched,
                }) => (
                  <>
                    {/* Username */}
                    <AppTextInput
                      icon="person-outline"
                      placeholder="Email or Username"
                      autoCapitalize="none"
                      value={values.username}
                      onChangeText={handleChange("username")}
                      onBlur={handleBlur("username")}
                      error={touched.username ? errors.username : null}
                    />

                    {/* Password */}
                    <AppTextInput
                      icon="lock-closed-outline"
                      placeholder="Password"
                      secureTextEntry
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={touched.password ? errors.password : null}
                    />

                    {/* Forgot Password */}
                    <TouchableOpacity onPress={() => console.log("Forgot")}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    {/* LOGIN */}
                    <GradientButton
                      title={isLoading ? "Logging in..." : "Login"}
                      onPress={handleSubmit}
                      disabled={
                        !values.username || !values.password || isLoading
                      }
                      style={{ marginTop: 5 }}
                    />

                    {/* ⭐ BIOMETRIC LOGIN - Only show if device supports it AND user has enabled it */}
                    {biometricAvailable && biometricEnabled && (
                      <View style={styles.biometricRow}>
                        <UniversalBiometricButton
                          onAuthenticate={handleBiometricLogin}
                        />
                      </View>
                    )}

                    <Text style={styles.dividerText}>continue with</Text>

                    {/* 🍎 APPLE LOGIN (Later we implement this) */}
                    <SocialButton
                      title="Continue with Apple"
                      icon={require("../../assets/icons/apple.png")}
                      onPress={() => toast.info("Apple login coming soon!")}
                      style={{ marginTop: 5 }}
                    />

                    {/* 🔥 GOOGLE LOGIN */}
                    <SocialButton
                      title="Continue with Google"
                      icon={require("../../assets/icons/google.png")}
                      light
                      onPress={handleGoogleLogin}
                      style={{ marginTop: 10 }}
                    />

                    {/* SIGNUP LINK */}
                    <View style={{ marginTop: 0, marginBottom: 5 }}>
                      <AuthFooterLink
                        label="Don't have an account?"
                        actionText="Sign Up"
                        onPress={() =>
                          NavigationService.navigate("Onboarding", {
                            screen: "AccountIntroScreen",
                          })
                        }
                      />
                    </View>

                    {/* TERMS CHECKBOX */}
                    <CheckboxWithLabel
                      checked={agree}
                      label="I agree to the Terms and Condition and Privacy Policy"
                      onToggle={() => setAgree(!agree)}
                    />
                  </>
                )}
              </Formik>
            </View>
          </FormCard>
        </View>
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  headerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    flex: 1,
    justifyContent: "center", // vertical center
    alignItems: "center", // horizontal center
  },
  body: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
    maxWidth: 600,

    maxHeight:
      Platform.OS === "android" && isTablet ? SCREEN_HEIGHT * 0.8 : undefined,

    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    justifyContent: "flex-end",
  },

  content: {
    marginHorizontal: 24,
  },
  forgotText: {
    textAlign: "right",
    marginTop: -25,
    marginBottom: 5,
    color: colors.accentTeal,
    fontSize: 14,
    fontWeight: "500",
  },
  biometricRow: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 5,
  },
  dividerText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 5,
  },
});
