import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import GradientButton from "@/src/components/buttons/GradientButton";
import OutlineButton from "@/src/components/buttons/OutlineButton";
import AppHeader from "@/src/components/navigation/AppHeader";
import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import AppTextInput from "@/src/components/common/AppTextInput";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";
import { PasswordErrors } from "@/src/types/settings";

const FIELD_LABELS = {
  current: "Current Password",
  new: "New Password",
  confirm: "Confirm New Password",
};

type ChangePasswordNav = NativeStackNavigationProp<AppStackParamList>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordNav>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleValidate = () => {
    const validation: PasswordErrors = {};

    if (!currentPassword.trim()) {
      validation.current = `${FIELD_LABELS.current} is required`;
    }

    if (!newPassword.trim()) {
      validation.new = `${FIELD_LABELS.new} is required`;
    } else if (newPassword.length < 8) {
      validation.new = "Password must be at least 8 characters";
    }

    if (!confirmPassword.trim()) {
      validation.confirm = `${FIELD_LABELS.confirm} is required`;
    }

    if (newPassword.trim() && confirmPassword.trim() && newPassword !== confirmPassword) {
      validation.confirm = "New passwords must match";
    }

    if (newPassword.trim() && currentPassword.trim() && newPassword === currentPassword) {
      validation.new = "New password must be different from current password";
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
        "Success",
        "Your password has been changed successfully.",
        [
          {
            text: "OK",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      // Security: Clear password fields on error to prevent exposure
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      if (error.message?.toLowerCase().includes("incorrect") ||
          error.message?.toLowerCase().includes("wrong") ||
          error.message?.toLowerCase().includes("invalid")) {
        setErrors({ current: "Current password is incorrect" });
      } else {
        Alert.alert("Error", error.message || "Failed to change password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigation.goBack();

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <AppHeader title="Change Password" onBackPress={navigation.goBack} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Security
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Keep your account protected by using a strong password.
            </AppText>
          </View>

          <View style={styles.card}>
            <AppTextInput
              placeholder={FIELD_LABELS.current}
              value={currentPassword}
              onChangeText={(text) => {
                setCurrentPassword(text);
                if (errors.current) setErrors({ ...errors, current: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.current}
              editable={!isSubmitting}
            />

            <AppTextInput
              placeholder={FIELD_LABELS.new}
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (errors.new) setErrors({ ...errors, new: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.new}
              editable={!isSubmitting}
            />

            <AppTextInput
              placeholder={FIELD_LABELS.confirm}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (errors.confirm) setErrors({ ...errors, confirm: undefined });
              }}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.confirm}
              editable={!isSubmitting}
            />

            <View style={styles.passwordHints}>
              <AppText size="tiny" color={colors.textMuted}>
                Password requirements:
              </AppText>
              <AppText size="tiny" color={colors.textMuted}>
                • At least 8 characters long
              </AppText>
              <AppText size="tiny" color={colors.textMuted}>
                • Mix of letters, numbers, and symbols recommended
              </AppText>
            </View>

            <View style={styles.buttonGroup}>
              {isSubmitting ? (
                <View style={styles.loadingButton}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText size="body" color={colors.primary}>Updating...</AppText>
                </View>
              ) : (
                <>
                  <GradientButton title="Update Password" onPress={handleUpdate} />
                  <OutlineButton title="Cancel" onPress={handleCancel} style={styles.cancel} />
                </>
              )}
            </View>
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
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 14,
  },
  sectionHeader: {
    gap: 6,
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonGroup: {
    gap: 12,
    marginTop: 8,
  },
  cancel: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  passwordHints: {
    backgroundColor: colors.backgroundLight,
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
  },
});
