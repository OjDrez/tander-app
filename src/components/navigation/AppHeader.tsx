import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AppHeaderProps = {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
  rightContent?: React.ReactNode;
  centerContent?: React.ReactNode;
  /** Show the Tander logo on the right side */
  showLogo?: boolean;
  /** Align title to left (default is center) */
  titleAlign?: "left" | "center";
};

export default function AppHeader({
  title,
  subtitle,
  onBackPress,
  rightContent,
  centerContent,
  showLogo = false,
  titleAlign = "center",
}: AppHeaderProps) {
  const renderRightContent = () => {
    if (rightContent) return rightContent;
    if (showLogo) {
      return (
        <View style={styles.logoRow}>
          <Image
            source={require("@/src/assets/icons/tander-logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>TANDER</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {onBackPress ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Returns to the previous screen"
          onPress={onBackPress}
          style={styles.iconButton}
          activeOpacity={0.85}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}

      <View style={[styles.center, titleAlign === "left" && styles.centerLeft]}>
        {centerContent}
        {title ? (
          <Text
            style={[styles.title, titleAlign === "left" && styles.titleLeft]}
            accessibilityRole="header"
          >
            {title}
          </Text>
        ) : null}
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.right}>{renderRightContent()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 12,
  },
  iconButton: {
    height: 48,
    width: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  spacer: {
    width: 48,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  centerLeft: {
    alignItems: "flex-start",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  titleLeft: {
    textAlign: "left",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  right: {
    minWidth: 90,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 34,
    height: 34,
  },
  logoText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accentBlue,
  },
});
