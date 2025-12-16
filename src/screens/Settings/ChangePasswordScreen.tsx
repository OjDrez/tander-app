import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { PasswordErrors } from "@/src/types/settings";

type ChangePasswordNav = NativeStackNavigationProp<AppStackParamList>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordNav>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleValidate = () => {
    const validation: PasswordErrors = {};

    if (!currentPassword.trim()) {
      validation.current = "Please enter your current password";
    }

    if (!newPassword.trim()) {
      validation.new = "Please enter a new password";
    } else if (newPassword.length < 8) {
      validation.new = "Your new password must be at least 8 characters long";
    }

    if (!confirmPassword.trim()) {
      validation.confirm = "Please confirm your new password";
    }

    if (newPassword.trim() && confirmPassword.trim() && newPassword !== confirmPassword) {
      validation.confirm = "The passwords you entered don't match. Please try again.";
    }

    if (newPassword.trim() && currentPassword.trim() && newPassword === currentPassword) {
      validation.new = "Your new password must be different from your current password";
    }

    setErrors(validation);

    return Object.keys(validation).length === 0;
  };

  const handleUpdate = async () => {
    const isValid = handleValidate();

    if (!isValid) return;

    setIsSubmitting(true);
    try {
      await userApi.changePassword({
        currentPassword: currentPassword,
        newPassword: newPassword,
      });

      Alert.alert(
        "Password Changed Successfully!",
        "Your password has been updated. Please use your new password the next time you log in.",
        [
          {
            text: "OK, Got It",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      // Clear password fields on error for security
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (error.message?.toLowerCase().includes("incorrect") ||
          error.message?.toLowerCase().includes("wrong") ||
          error.message?.toLowerCase().includes("invalid")) {
        setErrors({ current: "The current password you entered is not correct. Please try again." });
      } else {
        Alert.alert(
          "Could Not Change Password",
          error.message || "Something went wrong. Please check your information and try again.",
          [{ text: "OK, I'll Try Again" }]
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (currentPassword || newPassword || confirmPassword) {
      Alert.alert(
        "Discard Changes?",
        "You have entered some information. Are you sure you want to go back without saving?",
        [
          { text: "Stay Here", style: "cancel" },
          { text: "Yes, Go Back", style: "destructive", onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const renderPasswordInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error: string | undefined,
    errorKey: keyof PasswordErrors,
    placeholder: string,
    helpText: string,
    showPassword: boolean,
    setShowPassword: (show: boolean) => void
  ) => (
    <View style={styles.inputGroup}>
      <AppText size="body" weight="semibold" color={colors.textPrimary}>
        {label}
      </AppText>
      <AppText size="small" color={colors.textMuted}>
        {helpText}
      </AppText>
      <View style={[styles.inputContainer, error && styles.inputError]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => {
            onChange(text);
            if (errors[errorKey]) setErrors({ ...errors, [errorKey]: undefined });
          }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isSubmitting}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={() => setShowPassword(!showPassword)}
          accessibilityLabel={showPassword ? "Hide password" : "Show password"}
        >
          <Ionicons
            name={showPassword ? "eye-off-outline" : "eye-outline"}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <AppText size="small" color={colors.danger} style={styles.errorText}>
            {error}
          </AppText>
        </View>
      )}
    </View>
  );

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.85}
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Back
            </AppText>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <Image
              source={require("@/src/assets/icons/tander-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleIcon}>
              <Ionicons name="key" size={36} color={colors.primary} />
            </View>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Change Password
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              Keep your account safe by using a strong password that you don't use elsewhere.
            </AppText>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Enter Your Passwords
            </AppText>

            {renderPasswordInput(
              "Current Password",
              currentPassword,
              setCurrentPassword,
              errors.current,
              "current",
              "Enter your current password",
              "The password you use to log in now",
              showCurrentPassword,
              setShowCurrentPassword
            )}

            <View style={styles.divider} />

            {renderPasswordInput(
              "New Password",
              newPassword,
              setNewPassword,
              errors.new,
              "new",
              "Enter your new password",
              "Choose a password with at least 8 characters",
              showNewPassword,
              setShowNewPassword
            )}

            {renderPasswordInput(
              "Confirm New Password",
              confirmPassword,
              setConfirmPassword,
              errors.confirm,
              "confirm",
              "Type your new password again",
              "Make sure it matches what you typed above",
              showConfirmPassword,
              setShowConfirmPassword
            )}
          </View>

          {/* Password Tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={24} color={colors.accentBlue} />
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Tips for a Strong Password
              </AppText>
            </View>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Use at least 8 characters
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Mix letters, numbers, and symbols
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Don't use personal information
                </AppText>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <AppText size="body" color={colors.textSecondary}>
                  Don't reuse passwords from other sites
                </AppText>
              </View>
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              activeOpacity={0.85}
              onPress={handleUpdate}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Save new password"
            >
              {isSubmitting ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color={colors.white} />
                  <AppText size="h4" weight="bold" color={colors.white}>
                    Updating Password...
                  </AppText>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Ionicons name="checkmark-circle" size={26} color={colors.white} />
                  <AppText size="h4" weight="bold" color={colors.white}>
                    Update Password
                  </AppText>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={handleCancel}
              disabled={isSubmitting}
              accessibilityRole="button"
              accessibilityLabel="Cancel and go back"
            >
              <AppText size="h4" weight="semibold" color={colors.textSecondary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  titleSection: {
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    gap: 20,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  inputGroup: {
    gap: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.textPrimary,
    minHeight: 56,
  },
  eyeButton: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.danger + '10',
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    flex: 1,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginVertical: 4,
  },
  tipsCard: {
    backgroundColor: colors.accentMint,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.accentBlue + '30',
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  tipsList: {
    gap: 10,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },
});
