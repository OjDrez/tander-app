import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppStackParamList } from "@/src/navigation/NavigationTypes";

interface Viewer {
  id: string;
  name: string;
  age: number;
  city: string;
  photo: string;
  tags: string[];
}

export default function PeopleViewedMeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const viewers = useMemo<Viewer[]>(
    () => [
      {
        id: "felix",
        name: "Felix Javier",
        age: 78,
        city: "Davao City",
        photo:
          "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=400&q=80",
        tags: ["Friendship", "Companionship", "Socialize"],
      },
      {
        id: "grace",
        name: "Grace Tandoc",
        age: 65,
        city: "Pasig City",
        photo:
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=400&q=80",
        tags: ["Connect", "Companionship"],
      },
      {
        id: "jaime",
        name: "Jaime Cruz",
        age: 68,
        city: "Taguig City",
        photo:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
        tags: ["Friendship", "Companionship"],
      },
      {
        id: "james",
        name: "James Macamot",
        age: 70,
        city: "Quezon City",
        photo:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80",
        tags: ["Socialize", "Companionship"],
      },
    ],
    []
  );

  const handleCardPress = (userId: string) => {
    navigation.navigate("ProfileViewScreen", { userId });
  };

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
      navigation.navigate("ProfileViewScreen", { userId: viewers[0].id });
    }
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={styles.titleIcon}>
                <Ionicons name="heart" size={14} color={colors.primary} />
              </View>
              <AppText size="h3" weight="bold" style={styles.titleText}>
                People Who Viewed Me
              </AppText>
            </View>
            <AppText size="body" color={colors.textSecondary}>
              Your Viewers
            </AppText>
          </View>

          <View style={styles.grid}>
            {viewers.map((viewer) => (
              <TouchableOpacity
                key={viewer.id}
                style={styles.card}
                activeOpacity={0.9}
                onPress={() => handleCardPress(viewer.id)}
              >
                <View style={styles.imageWrapper}>
                  <Image source={{ uri: viewer.photo }} style={styles.image} />
                  <View style={styles.imageHeart}>
                    <Ionicons name="heart" size={16} color={colors.white} />
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <AppText size="h5" weight="bold" color={colors.textPrimary}>
                    {viewer.name}, {viewer.age}
                  </AppText>
                  <View style={styles.locationRow}>
                    <Ionicons
                      name="location"
                      size={14}
                      color={colors.accentTeal}
                    />
                    <AppText
                      size="small"
                      weight="medium"
                      color={colors.textSecondary}
                      style={styles.locationText}
                    >
                      {viewer.city}
                    </AppText>
                  </View>

                  <View style={styles.tagRow}>
                    {viewer.tags.map((tag) => (
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
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
    </FullScreen>
  );
}

const CARD_WIDTH = "48%";

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  titleIcon: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  titleText: {
    color: colors.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 14,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 5,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 170,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageHeart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 4,
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: 4,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.accentMint,
    borderRadius: 12,
  },
});
