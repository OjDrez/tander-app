import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Formik } from "formik";
import React, { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import GradientButton from "@/src/components/buttons/GradientButton";
import SocialButton from "@/src/components/buttons/SocialButton";
import UniversalBiometricButton from "@/src/components/buttons/UniversalBiometricButton";
import AppHeaderWithLogo from "@/src/components/common/AppHeaderWithLogo";
import AppTextInput from "@/src/components/common/AppTextInput";
import AuthFooterLink from "@/src/components/common/AuthFooterLink";
import CheckboxWithLabel from "@/src/components/common/CheckboxWithLabel";
import FormCard from "@/src/components/common/FormCard";
import FullScreen from "@/src/components/layout/FullScreen";

import colors from "@/src/config/colors";
import { loginSchema } from "@/src/validation/schemas/login";

import NavigationService from "@/src/navigation/NavigationService";
import biometricService from "@/src/services/biometricService";

import { useToast } from "@/src/context/ToastContext";
import { useAuth } from "@/src/hooks/useAuth";
import { useGoogleLogin } from "@/src/hooks/useGoogleLogin";

export default function LoginScreen() {
  const [agree, setAgree] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const toast = useToast();
  const { login } = useAuth();
  const { login: googleLogin } = useGoogleLogin();

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  useFocusEffect(
    useCallback(() => {
      checkBiometricStatus();
    }, [])
  );

  const checkBiometricStatus = async () => {
    const available = await biometricService.isAvailable();
    const enabled = await biometricService.isBiometricLoginEnabled();
    setBiometricAvailable(available);
    setBiometricEnabled(enabled);
  };

  const handleGoogleLogin = async () => {
    try {
      const user = await googleLogin();
      if (!user) {
        toast.error("Google login failed. Please try again.");
        return;
      }
      toast.success("Successfully signed in with Google!");
      NavigationService.replace("LoginSuccessScreen");
    } catch {
      toast.error("Google login failed. Please try again.");
    }
  };

  const handleBiometricLogin = async () => {
    try {
      setIsLoading(true);
      const credentials = await biometricService.performBiometricLogin();
      if (!credentials) {
        toast.error("Biometric authentication failed.");
        return;
      }
      await login(credentials);
      toast.success("Welcome back!");
      NavigationService.replace("HomeScreen");
    } catch {
      toast.error("Login failed. Please try with your password.");
      await biometricService.clearCredentials();
      setBiometricEnabled(false);
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
        <AppHeaderWithLogo />
      </SafeAreaView>

      {/* FORM */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentLarge,
            { paddingBottom: insets.bottom + 16 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.cardWrapper,
              isLargeScreen && styles.cardWrapperLarge,
            ]}
          >
            <FormCard
              title="Login to your account"
              subtitle="Welcome back, we missed you!"
            >
              <Formik
                initialValues={{ username: "", password: "" }}
                validationSchema={loginSchema}
                validateOnChange={false}
                validateOnBlur
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    setIsLoading(true);
                    await login(values);
                    toast.success("Login successful!");
                    NavigationService.replace("HomeScreen");
                  } catch (error: any) {
                    toast.error(
                      error.code === "INVALID_CREDENTIALS"
                        ? "Incorrect username or password."
                        : "Login failed."
                    );
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
                    <AppTextInput
                      icon="person-outline"
                      placeholder="Email or Username"
                      autoCapitalize="none"
                      value={values.username}
                      onChangeText={handleChange("username")}
                      onBlur={handleBlur("username")}
                      error={touched.username ? errors.username : null}
                    />

                    <AppTextInput
                      icon="lock-closed-outline"
                      placeholder="Password"
                      secureTextEntry
                      value={values.password}
                      onChangeText={handleChange("password")}
                      onBlur={handleBlur("password")}
                      error={touched.password ? errors.password : null}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        NavigationService.navigate("ForgotPasswordScreen")
                      }
                    >
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>

                    <GradientButton
                      title={isLoading ? "Logging in..." : "Login"}
                      onPress={handleSubmit}
                      disabled={
                        !values.username || !values.password || isLoading
                      }
                    />

                    {biometricAvailable && biometricEnabled && (
                      <View style={styles.biometricRow}>
                        <UniversalBiometricButton
                          onAuthenticate={handleBiometricLogin}
                        />
                      </View>
                    )}

                    <Text style={styles.dividerText}>continue with</Text>

                    <View style={styles.socialRow}>
                      <View style={styles.leftButton}>
                        <SocialButton
                          title="Apple"
                          icon={require("../../assets/icons/apple.png")}
                          onPress={() => toast.info("Apple login coming soon!")}
                        />
                      </View>
                      <View style={styles.rightButton}>
                        <SocialButton
                          title="Google"
                          icon={require("../../assets/icons/google.png")}
                          light
                          onPress={handleGoogleLogin}
                        />
                      </View>
                    </View>

                    <AuthFooterLink
                      label="Don't have an account?"
                      actionText="Sign Up"
                      onPress={() =>
                        NavigationService.navigate("Onboarding", {
                          screen: "AccountIntroScreen",
                        })
                      }
                    />

                    <View style={styles.checkboxInCard}>
                      <CheckboxWithLabel
                        checked={agree}
                        label="I agree to the Terms and Privacy Policy"
                        onToggle={() => setAgree(!agree)}
                      />
                    </View>
                  </>
                )}
              </Formik>
            </FormCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerView: { alignItems: "center" },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  scrollContentLarge: {
    justifyContent: "center",
  },

  cardWrapper: { width: "100%" },
  cardWrapperLarge: {
    maxWidth: 440,
    alignSelf: "center",
  },

  forgotText: {
    textAlign: "right",
    marginVertical: 6,
    color: colors.accentTeal,
    fontSize: 14,
    fontWeight: "500",
  },

  biometricRow: {
    alignItems: "center",
    marginVertical: 20,
  },

  dividerText: {
    textAlign: "center",
    color: colors.textMuted,
    marginVertical: 8,
  },

  socialRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  leftButton: { flex: 1, marginRight: 8 },
  rightButton: { flex: 1, marginLeft: 8 },

  checkboxInCard: {
    alignItems: "center",
    marginTop: 8,
  },
});
