import React, { useState } from "react";
import {
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

const FIELD_LABELS = {
  current: "Current Password",
  new: "New Password",
  confirm: "Confirm New Password",
};

type ChangePasswordNav = NativeStackNavigationProp<AppStackParamList>;

type ErrorState = {
  current?: string;
  new?: string;
  confirm?: string;
};

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordNav>();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<ErrorState>({});

  const handleValidate = () => {
    const validation: ErrorState = {};

    if (!currentPassword.trim()) {
      validation.current = `${FIELD_LABELS.current} is required`;
    }

    if (!newPassword.trim()) {
      validation.new = `${FIELD_LABELS.new} is required`;
    }

    if (!confirmPassword.trim()) {
      validation.confirm = `${FIELD_LABELS.confirm} is required`;
    }

    if (newPassword.trim() && confirmPassword.trim() && newPassword !== confirmPassword) {
      validation.confirm = "New passwords must match";
    }

    setErrors(validation);

    return Object.keys(validation).length === 0;
  };

  const handleUpdate = () => {
    const isValid = handleValidate();

    if (!isValid) return;

    // UI-only: future password update logic goes here
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
            />

            <View style={styles.buttonGroup}>
              <GradientButton title="Update Password" onPress={handleUpdate} />
              <OutlineButton title="Cancel" onPress={handleCancel} style={styles.cancel} />
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
});
