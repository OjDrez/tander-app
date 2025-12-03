import React from "react";
import { StyleSheet, View } from "react-native";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";

export default function ProfileScreen() {
  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <View style={styles.content}>
        <AppText size="h3" weight="bold" style={styles.title}>
          My Profile
        </AppText>
        <AppText color={colors.textSecondary}>
          Manage your profile details here.
        </AppText>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  content: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
  },
});

