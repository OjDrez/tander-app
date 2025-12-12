import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useMemo, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PillSelector from "@/src/components/forms/PillSelector";
import TextInputField from "@/src/components/forms/TextInputField";
import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { userApi } from "@/src/api/userApi";

type EditAboutNav = NativeStackNavigationProp<AppStackParamList>;

interface AboutData {
  bio: string;
  interests: string[];
  lookingFor: string[];
}

export default function EditAboutYouScreen() {
  const navigation = useNavigation<EditAboutNav>();

  const [about, setAbout] = useState<AboutData>({
    bio: "",
    interests: [],
    lookingFor: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load profile data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  const loadProfile = async () => {
    try {
      const userData = await userApi.getCurrentUser();
      setAbout({
        bio: userData.bio || "",
        interests: userApi.parseInterests(userData.interests),
        lookingFor: userApi.parseLookingFor(userData.lookingFor),
      });
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const interestOptions = useMemo(
    () => ["Music", "Cooking", "Movies", "Travel", "Sports", "Art", "Reading", "Gardening", "Dancing", "Photography"],
    []
  );
  const lookingForOptions = useMemo(
    () => ["Connect", "Companionship", "Friendship", "Socialize", "Dating"],
    []
  );

  const toggleSelection = (field: "interests" | "lookingFor", value: string) => {
    setAbout((prev) => {
      const hasValue = prev[field].includes(value);
      const updated = hasValue
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value];
      return { ...prev, [field]: updated };
    });
  };

  const handleGoBack = () => navigation.goBack();

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        bio: about.bio,
        interests: about.interests,
        lookingFor: about.lookingFor,
      });

      Alert.alert("Success", "Your profile has been updated!", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="body" color={colors.textSecondary} style={{ marginTop: 16 }}>
            Loading profile...
          </AppText>
        </View>
      </FullScreen>
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={handleGoBack}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <AppText size="h3" weight="bold" style={styles.headerTitle}>
              Settings
            </AppText>

            <View style={styles.logoRow}>
              <Image
                source={require("@/src/assets/icons/tander-logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
              <AppText weight="bold" color={colors.accentBlue}>
                TANDER
              </AppText>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              About You
            </AppText>
          </View>

          <View style={styles.card}>
            <TextInputField
              label="Short Bio"
              value={about.bio}
              multiline
              numberOfLines={5}
              onChangeText={(text) => setAbout({ ...about, bio: text })}
              maxLength={1000}
            />
            <AppText
              size="small"
              color={colors.textSecondary}
              style={styles.counter}
            >
              {`${about.bio.length}/1000`}
            </AppText>
          </View>

          <View style={styles.card}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Interests
            </AppText>
            <PillSelector
              items={interestOptions}
              value={about.interests}
              onChange={(items) => setAbout({ ...about, interests: items })}
            />
          </View>

          <View style={styles.card}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Looking for
            </AppText>
            <View style={styles.tagGrid}>
              {lookingForOptions.map((option) => {
                const isActive = about.lookingFor.includes(option);
                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.9}
                    style={[styles.tagChip, isActive && styles.tagChipActive]}
                    onPress={() => toggleSelection("lookingFor", option)}
                  >
                    <AppText
                      weight="semibold"
                      color={isActive ? colors.primary : colors.textPrimary}
                    >
                      {option}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.updateButton, isSaving && styles.updateButtonDisabled]}
            activeOpacity={0.9}
            onPress={handleUpdateProfile}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <AppText weight="bold" color={colors.white} style={{ textAlign: "center" }}>
                Update Profile
              </AppText>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 38,
    height: 38,
  },
  sectionHeader: {
    paddingHorizontal: 2,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    gap: 8,
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  counter: {
    textAlign: "right",
  },
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.borderLight,
  },
  tagChipActive: {
    backgroundColor: colors.accentMint,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    marginTop: 4,
    minHeight: 52,
  },
  updateButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
