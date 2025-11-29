import GradientButton from "@/src/components/buttons/GradientButton";
import SocialButton from "@/src/components/buttons/SocialButton";
import AuthFooterLink from "@/src/components/common/AuthFooterLink";
import CheckboxWithLabel from "@/src/components/common/CheckboxWithLabel";
import FullScreen from "@/src/components/layout/FullScreen";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
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
import * as LocalAuthentication from "expo-local-authentication";

export default function LoginScreen() {
  const [agree, setAgree] = useState(false);
  const [biometricType, setBiometricType] = useState<
    "face" | "touch" | "unknown"
  >("unknown");

  // ⭐ Detect biometric type
  useEffect(() => {
    (async () => {
      const types =
        await LocalAuthentication.supportedAuthenticationTypesAsync();

      if (Platform.OS === "ios") {
        if (
          types.includes(
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          )
        ) {
          setBiometricType("face");
        } else if (
          types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)
        ) {
          setBiometricType("touch");
        }
      } else {
        // ANDROID ALWAYS RETURNS FINGERPRINT (even if device has face unlock)
        setBiometricType("touch");
      }
    })();
  }, []);

  // ⭐ Unified biometric handler for both Face ID & Touch ID
  const handleBiometricLogin = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        Alert.alert("Unsupported", "Your device does not support biometrics.");
        return;
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        Alert.alert(
          "Not Setup",
          "Please register biometrics (Face ID or Fingerprint) in your device settings."
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage:
          biometricType === "face"
            ? "Login with Face ID"
            : "Login with Touch ID",
        fallbackLabel: "Use Passcode",
        cancelLabel: "Cancel",
      });

      if (result.success) {
        console.log("BIOMETRIC LOGIN SUCCESS");
        // TODO: navigate home
      } else {
        Alert.alert("Authentication Failed", "Please try again.");
      }
    } catch (err) {
      console.log("Biometric Error:", err);
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
        <AppHeaderWithLogo />
      </SafeAreaView>

      <View style={styles.body}>
        <FormCard
          title="Login to your account"
          subtitle="Welcome back, we missed you!"
          style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
        >
          <View style={styles.content}>
            <Formik
              initialValues={{ username: "", password: "" }}
              validationSchema={loginSchema}
              onSubmit={(values) => {
                console.log("LOGIN:", values);
                NavigationService.replace("LoginSuccessScreen");
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

                  <TouchableOpacity onPress={() => console.log("Forgot")}>
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>

                  {/* Login */}
                  <GradientButton
                    title="Login"
                    onPress={handleSubmit}
                    disabled={!values.username || !values.password}
                    style={{ marginTop: 5 }}
                  />

                  {/* BIOMETRIC BUTTONS — kept separate for now */}

                  <View style={styles.biometricRow}>
                    <UniversalBiometricButton
                      onAuthenticate={() => {
                        console.log("BIOMETRIC SUCCESS");
                        NavigationService.replace("LoginSuccessScreen");
                      }}
                    />
                  </View>

                  <Text style={styles.dividerText}>continue with</Text>

                  <SocialButton
                    title="Continue with Apple"
                    icon={require("../../assets/icons/apple.png")}
                    onPress={() => console.log("Apple Login")}
                    style={{ marginTop: 10 }}
                  />

                  <SocialButton
                    title="Continue with Google"
                    icon={require("../../assets/icons/google.png")}
                    light
                    onPress={() => console.log("Google Login")}
                    style={{ marginTop: 10 }}
                  />

                  <View style={{ marginTop: 10, marginBottom: 10 }}>
                    <AuthFooterLink
                      label="Don't have an account?"
                      actionText="Sign Up"
                      onPress={() => console.log("SignUp pressed")}
                    />
                  </View>

                  {/* Terms */}
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
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  headerView: {
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    flex: 1,
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
    marginBottom: 12,
  },
  biometricInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  or: {
    color: colors.textMuted,
  },
  dividerText: {
    textAlign: "center",
    color: colors.textMuted,
    marginTop: 10,
  },
});
