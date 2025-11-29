import colors from "@/src/config/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Tander</Text>
        <Text style={styles.subtitle}>Your journey starts here ❤️</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.placeholder}>
          🚧 Home screen content coming soon...
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "backgroundLightest",
  },

  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: 4,
  },

  body: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  placeholder: {
    fontSize: 16,
    color: colors.textMuted,
  },
});
