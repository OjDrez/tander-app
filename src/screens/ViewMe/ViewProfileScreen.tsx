import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppStackParamList } from "@/src/navigation/NavigationTypes";

type ViewProfileRouteProp = RouteProp<AppStackParamList, "ViewProfileScreen">;

export default function ViewProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<ViewProfileRouteProp>();
  const { userId } = route.params;

  const profile = useMemo(
    () => ({
      id: userId,
      name: "Felix Javier",
      age: 78,
      city: "Davao City",
      photo:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=800&q=80",
      tags: ["Companionship", "Friendship"],
    }),
    [userId]
  );

  const handleTabPress = (tab: MainNavigationTab) => {
    if (tab === "Home") {
      navigation.navigate("HomeScreen");
    }

    if (tab === "Inbox") {
      navigation.navigate("InboxScreen");
    }

    if (tab === "Matches") {
      navigation.navigate("MyMatchesScreen");
    }

    if (tab === "Profile") {
      navigation.navigate("ProfileViewScreen", { userId: profile.id });
    }
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
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

            <View style={styles.titleRow}>
              <View style={styles.logoBadge}>
                <Ionicons name="heart" size={14} color={colors.primary} />
              </View>
              <AppText size="h4" weight="bold" style={styles.titleText}>
                People Who Viewed Me
              </AppText>
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              style={styles.iconButton}
              onPress={() => navigation.navigate("HomeScreen")}
            >
              <Ionicons
                name="ellipsis-horizontal"
                size={20}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.photoWrapper}>
              <Image source={{ uri: profile.photo }} style={styles.photo} />
              <LinearGradient
                colors={["transparent", "rgba(0, 0, 0, 0.35)"]}
                start={{ x: 0, y: 0.4 }}
                end={{ x: 0, y: 1 }}
                style={styles.photoOverlay}
              />

              <View style={styles.infoOverlay}>
                <AppText size="h1" weight="bold" color={colors.white}>
                  {profile.name}, {profile.age}
                </AppText>
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={16} color={colors.white} />
                  <AppText
                    size="body"
                    weight="medium"
                    color={colors.white}
                    style={styles.locationText}
                  >
                    {profile.city}
                  </AppText>
                </View>

                <View style={styles.tagRow}>
                  {profile.tags.map((tag) => (
                    <View key={tag} style={styles.tagBadge}>
                      <AppText
                        size="tiny"
                        weight="semibold"
                        color={colors.primary}
                      >
                        {tag}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.9}
                style={[styles.actionButton, styles.dislikeButton]}
              >
                <Ionicons name="close" size={24} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.9}
                style={[styles.actionButton, styles.favoriteButton]}
              >
                <Ionicons name="heart" size={22} color={colors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                activeOpacity={0.9}
                style={[styles.actionButton, styles.connectButton]}
              >
                <MaterialCommunityIcons
                  name="chat"
                  size={22}
                  color={colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
    </FullScreen>
  );
}

const PHOTO_HEIGHT = 500;
const CARD_RADIUS = 28;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: colors.textPrimary,
  },
  card: {
    marginTop: 6,
  },
  photoWrapper: {
    position: "relative",
    height: PHOTO_HEIGHT,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    overflow: "hidden",
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.16,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 20,
    elevation: 8,
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoOverlay: {
    position: "absolute",
    left: 18,
    bottom: 18,
    gap: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 6,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: colors.accentMint,
    borderRadius: 14,
  },
  actionRow: {
    marginTop: -34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  actionButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 6,
  },
  dislikeButton: {
    backgroundColor: colors.danger,
  },
  favoriteButton: {
    backgroundColor: colors.primary,
  },
  connectButton: {
    backgroundColor: colors.accentTeal,
  },
});
