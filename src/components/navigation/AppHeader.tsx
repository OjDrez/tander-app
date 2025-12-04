import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
};

export default function AppHeader({
  title,
  subtitle,
  onBackPress,
  rightContent,
  centerContent,
}: AppHeaderProps) {
  return (
    <View style={styles.container}>
      {onBackPress ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onBackPress}
          style={styles.iconButton}
          activeOpacity={0.85}
        >
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={styles.center}>
        {centerContent}
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{rightContent}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  spacer: {
    width: 42,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  right: {
    width: 86,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
