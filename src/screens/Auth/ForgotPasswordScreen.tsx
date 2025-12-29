import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppTextInput from "@/src/components/common/AppTextInput";
import FormCard from "@/src/components/common/FormCard";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768;

  const handleSubmit = () => {
    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    setError("");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) {
      setError("");
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
        <AppHeader title="Forgot Password" onBackPress={NavigationService.goBack} />
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.scrollContentLarge,
            { paddingBottom: Math.max(insets.bottom, 24) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.cardWrapper, isLargeScreen && styles.cardWrapperLarge]}>
            <FormCard>
              <AppText style={styles.description} color={colors.textSecondary}>
                Enter your email address and we’ll send you a link to reset your password.
              </AppText>

              <AppTextInput
                label="Email Address"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={handleEmailChange}
              />

              {error ? (
                <AppText size="small" color={colors.errorText} style={styles.errorText}>
                  {error}
                </AppText>
              ) : null}

              <GradientButton
                title="Send Reset Link"
                onPress={handleSubmit}
                disabled={!email.trim()}
                style={styles.primaryButton}
              />

              <TouchableOpacity
                onPress={NavigationService.goBack}
                style={styles.secondaryButton}
                accessibilityRole="button"
              >
                <AppText size="small" weight="semibold" color={colors.accentTeal}>
                  Back to Login
                </AppText>
              </TouchableOpacity>
            </FormCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerView: {
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  scrollContentLarge: {
    justifyContent: "center",
  },
  cardWrapper: {
    width: "100%",
  },
  cardWrapperLarge: {
    maxWidth: 440,
    alignSelf: "center",
  },
  description: {
    marginBottom: 16,
    lineHeight: 22,
  },
  errorText: {
    marginTop: -8,
    marginBottom: 12,
  },
  primaryButton: {
    marginTop: 8,
  },
  secondaryButton: {
    marginTop: 16,
    alignItems: "center",
  },
});
