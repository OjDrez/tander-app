import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo } from "react";
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
import { AppStackParamList } from "@/src/navigation/NavigationTypes";

// Route params for this screen
type ProfileViewRouteProp = RouteProp<AppStackParamList, "ProfileViewScreen">;

type ProfileViewNav = NativeStackNavigationProp<
  AppStackParamList,
  "ProfileViewScreen"
>;

export default function ProfileViewScreen() {
  const navigation = useNavigation<ProfileViewNav>();
  const route = useRoute<ProfileViewRouteProp>();
  const { userId } = route.params;

  const profile = useMemo(
    () => ({
      id: userId,
      name: "Faye Castro",
      age: 68,
      location: "Manila, Philippines",
      about:
        "I love morning walks, good coffee, and discovering new local cafés. Looking for meaningful conversations and plenty of laughter.",
      interests: [
        "Cooking",
        "Gardening",
        "Travel",
        "Music",
        "Reading",
        "Art Museums",
        "Beach Walks",
      ],
      photo:
        "https://images.generated.photos/4bhk0YZ39Vnu6zfRCVCrOfZyao8RzWPr6Kz-cueETMo/rs:fit:512:512/czM6Ly9p/ZGVudGl0eS5j/LmNvbS9pLzAwLzA2LzEyLzMzLzAwMDYxMjMzNi5qcGc.jpg",
    }),
    [userId]
  );

  const handleChatPress = useCallback(() => {
    navigation.navigate("ConversationScreen", { userId: profile.id });
  }, [navigation, profile.id]);

  const handleVideoPress = useCallback(() => {
    navigation.navigate("VideoCallScreen", { userId: profile.id });
  }, [navigation, profile.id]);

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.iconButton}
            onPress={() => navigation.navigate("HomeScreen" as never)}
          >
            <Ionicons name="home" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.photoCard}>
          <Image source={{ uri: profile.photo }} style={styles.photo} />
          <LinearGradient
            colors={["transparent", "rgba(3, 2, 19, 0.28)"]}
            start={{ x: 0, y: 0.4 }}
            end={{ x: 0, y: 1 }}
            style={styles.photoOverlay}
          />
          <View style={styles.infoOverlay}>
            <View style={styles.nameRow}>
              <AppText size="h2" weight="bold" color={colors.white}>
                {profile.name}
              </AppText>
              <View style={styles.ageBadge}>
                <AppText size="body" weight="semibold" color={colors.white}>
                  {profile.age}
                </AppText>
              </View>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={colors.white} />
              <AppText
                size="body"
                weight="medium"
                color={colors.white}
                style={styles.locationText}
              >
                {profile.location}
              </AppText>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <AppText size="h4" weight="bold" style={styles.cardTitle}>
            About
          </AppText>
          <AppText size="body" weight="normal" color={colors.textSecondary}>
            {profile.about}
          </AppText>
        </View>

        <View style={styles.card}>
          <View style={styles.interestsHeader}>
            <AppText size="h4" weight="bold" style={styles.cardTitle}>
              Interests
            </AppText>
            <MaterialCommunityIcons
              name="heart-multiple"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.interestWrap}>
            {profile.interests.map((interest) => (
              <View key={interest} style={styles.interestPill}>
                <AppText size="small" weight="semibold" color={colors.primary}>
                  {interest}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <GradientButton
            title="Chat Now"
            onPress={handleChatPress}
            style={styles.button}
          />
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={[styles.button, styles.videoButton]}
            onPress={handleVideoPress}
          >
            <LinearGradient
              colors={colors.gradients.softAqua.array}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.videoGradient}
            >
              <View style={styles.videoContent}>
                <MaterialCommunityIcons
                  name="video-outline"
                  size={20}
                  color={colors.accentBlue}
                />
                <AppText
                  size="body"
                  weight="semibold"
                  color={colors.accentBlue}
                >
                  Video Call
                </AppText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },
  photoCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 28,
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    elevation: 8,
  },
  photo: {
    width: "100%",
    height: 360,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoOverlay: {
    position: "absolute",
    left: 16,
    bottom: 16,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(51, 169, 162, 0.85)",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  locationText: {
    marginLeft: 6,
  },
  card: {
    marginTop: 20,
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 18,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 6,
  },
  cardTitle: {
    marginBottom: 8,
    color: colors.textPrimary,
  },
  interestsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  interestWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  interestPill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.accentMint,
    borderRadius: 18,
  },
  actionsRow: {
    marginTop: 24,
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
  },
  videoButton: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
    borderRadius: 40,
    overflow: "hidden",
  },
  videoGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  videoContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
