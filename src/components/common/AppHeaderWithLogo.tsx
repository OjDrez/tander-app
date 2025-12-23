import { getResponsiveValue, scaleFontSize } from "@/src/utility/responsive";
import React from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";

export default function AppHeaderWithLogo() {
  return (
    <View style={styles.logoRow}>
      <Image
        source={require("../../assets/icons/tander-logo.png")}
        resizeMode="contain"
        style={styles.logo}
      />
      <Text style={styles.title}>Tander</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    height: getResponsiveValue(
      100, // tiny
      110, // small
      120, // medium
      130, // large
      Platform.OS === "android" ? 150 : 140 // tablet
    ),
    paddingTop:
      Platform.OS === "android"
        ? getResponsiveValue(4, 5, 6, 8, 12) // tablet gets more space
        : getResponsiveValue(8, 10, 12, 14, 16),

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: getResponsiveValue(6, 8, 10, 12, 16),
  },

  logo: {
    width: getResponsiveValue(64, 72, 80, 88, 96),
    height: getResponsiveValue(64, 72, 80, 88, 96),
  },

  title: {
    fontSize: scaleFontSize(getResponsiveValue(32, 36, 40, 44, 48)),
    fontWeight: "700",
    color: "#000",
  },
});
