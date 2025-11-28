import BiometricButton from "@/src/components/buttons/BiometricButton";
import GradientButton from "@/src/components/buttons/GradientButton";
import SocialButton from "@/src/components/buttons/SocialButton";
import AuthFooterLink from "@/src/components/common/AuthFooterLink";
import CheckboxWithLabel from "@/src/components/common/CheckboxWithLabel";
import FullScreen from "@/src/components/layout/FullScreen";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeaderWithLogo from "../../components/common/AppHeaderWithLogo";
import AppTextInput from "../../components/common/AppTextInput";
import FormCard from "../../components/common/FormCard";
import colors from "../../config/colors";

export default function LoginScreen() {
  const [agree, setAgree] = useState(false);

  return (
    <FullScreen statusBarStyle="dark">
      {/* ⭐ FULLSCREEN BACKGROUND */}
      <LinearGradient
        colors={["#C8E6E2", "#FFE2C1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* ⭐ FIXED HEADER (View1) */}
      <SafeAreaView edges={["top"]} style={styles.headerView}>
        <AppHeaderWithLogo />
      </SafeAreaView>

      {/* ⭐ FORM SECTION (View2) */}
      <View style={styles.body}>
        <FormCard
          style={{
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          }}
          title="Login to your account"
          subtitle="Welcome back, we missed you!"
        >
          <View style={styles.content}>
            {/* Username */}
            <AppTextInput
              icon="person-outline"
              placeholder="Email or Username"
              autoCapitalize="none"
            />

            {/* Password */}
            <AppTextInput
              icon="lock-closed-outline"
              placeholder="Password"
              secureTextEntry
            />

            {/* Forgot Password */}
            <TouchableOpacity
              //   onPress={() => NavigationService.navigate("ForgotPasswordScreen")}
              onPress={() => console.log("Forgot pressed")}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login CTA */}
            <GradientButton
              title="Login"
              onPress={() => console.log("Login pressed")}
              style={{ marginTop: 5 }}
            />

            {/* Biometric Row */}
            <View style={styles.biometricRow}>
              <View style={styles.biometricInner}>
                <BiometricButton
                  label="Touch ID"
                  icon={require("../../assets/icons/touchId.png")}
                />

                <Text style={styles.or}>or</Text>

                <BiometricButton
                  label="Face ID"
                  icon={require("../../assets/icons/faceId.png")}
                />
              </View>
            </View>

            {/* Divider */}
            <Text style={styles.dividerText}>continue with</Text>

            {/* Social Buttons */}
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
              style={{ marginTop: 20 }}
            />

            {/* Footer Sign Up */}
            <View style={{ marginTop: 10, marginBottom: 10 }}>
              <AuthFooterLink
                label="Don't have an account?"
                actionText="Sign Up"
                // onPress={() => NavigationService.navigate("RegisterScreen")}
                onPress={() => console.log("SignUp pressed")}
              />
            </View>

            {/* Terms Checkbox */}
            <View style={{ marginBottom: 40 }}>
              <CheckboxWithLabel
                checked={agree}
                label="I agree to the Terms and Condition and Privacy Policy"
                onToggle={() => setAgree(!agree)}
              />
            </View>
          </View>
        </FormCard>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  /* Header (View1) */
  headerView: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "center",
    // paddingTop: 10,
    // paddingBottom: 10,
  },

  /* Body (View2) */
  body: {
    flex: 1,
    justifyContent: "flex-end",
  },

  /* Inside FormCard */
  content: {
    marginHorizontal: 24,
  },

  forgotText: {
    textAlign: "right",
    marginTop: -10,
    marginBottom: 15,
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
    justifyContent: "center",
    gap: 16,
  },

  or: {
    marginHorizontal: 8,
    color: colors.textMuted,
    fontSize: 13,
  },

  dividerText: {
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 13,
    // marginBottom: 5,
  },
});
