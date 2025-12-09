import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MyProfileScreen() {
  const navigation = useNavigation();

  // 🔥 Replace with real logged-in user data later
  const me = {
    id: "currentUser",
    name: "My Name",
    age: 65,
    location: "Philippines",
    about: "This is my personal about section.",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <SafeAreaView
            edges={["top", "left", "right"]}
            style={styles.safeArea}
          >
            <View style={styles.headerRow}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.8}
                style={styles.iconButton}
                // onPress={() => navigation.navigate("SettingsScreen" as never)}
                onPress={() => navigation.navigate("Settings" as never)}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.photoCard}>
              <Image source={{ uri: me.photo }} style={styles.photo} />
            </View>

            <View style={styles.card}>
              <AppText size="h3" weight="bold">
                {me.name}, {me.age}
              </AppText>
              <AppText size="body" weight="medium" color={colors.textSecondary}>
                {me.location}
              </AppText>
            </View>

            <View style={styles.card}>
              <AppText size="h4" weight="bold">
                About Me
              </AppText>
              <AppText size="body" color={colors.textSecondary}>
                {me.about}
              </AppText>
            </View>

            <GradientButton
              title="Edit Profile"
              style={{ marginTop: 20 }}
              onPress={() =>
                NavigationService.navigate("Settings", {
                  screen: "EditBasicInfoScreen",
                })
              }
            />
          </SafeAreaView>
        </ScrollView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    width: "100%",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  photoCard: {
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: colors.white,
  },
  photo: {
    width: "100%",
    height: 360,
  },
  card: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
  },
});
