import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const profile = {
  id: "profile-001",
  name: "Gloria Ramos",
  age: 70,
  location: "Quezon City, Philippines",
  about: "I enjoy gardening, reading and playing with my grandchildren.",
  avatar:
    // "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
    require("../../assets/images/SampleProfile.png"),
};

const suggestions = [
  {
    name: "Gloria Ramos",
    age: 70,
    location: "Quezon City",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Mila Santos",
    age: 68,
    location: "Quezon City",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Linda Cruz",
    age: 66,
    location: "Quezon City",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
  },
  {
    name: "Maria Lee",
    age: 69,
    location: "Quezon City",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80",
  },
];

export default function HomeScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handleTabPress = (tab: MainNavigationTab) => {
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
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}>
                <Ionicons name="heart" size={18} color={colors.white} />
              </View>
              <AppText weight="semibold" size="body">
                TANDER
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate("InboxScreen")}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={18}
                color={colors.accentBlue}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.greetingBlock}>
            <AppText weight="semibold" size="h3" style={styles.greetingTitle}>
              Hello, {profile.name.split(" ")[0]}!
            </AppText>
            <AppText color={colors.textSecondary}>
              Here are new people to discover and ways to keep your profile
              fresh.
            </AppText>
          </View>

          <LinearGradient
            colors={colors.gradients.registration.array}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroContent}>
              <AppText weight="semibold" size="h4" style={styles.heroTitle}>
                Ready for your next conversation?
              </AppText>
              <AppText color={colors.textSecondary} style={styles.heroSubtitle}>
                We found people who share your interests and values.
              </AppText>
            </View>

            <GradientButton
              title="Start Video Call"
              onPress={() => navigation.navigate("InboxScreen")}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          </LinearGradient>

          <View style={styles.card}>
            <View style={styles.profileRow}>
              {/* <Image source={{ uri: profile.avatar }} style={styles.avatar} /> */}
              <Image
                source={
                  typeof profile.avatar === "string"
                    ? { uri: profile.avatar }
                    : profile.avatar
                }
                style={styles.avatar}
              />
              <View style={styles.profileTextGroup}>
                <View style={styles.nameRow}>
                  <AppText weight="semibold" size="h4" style={styles.name}>
                    {profile.name}, {profile.age}
                  </AppText>
                  <MaterialCommunityIcons
                    name="shield-check"
                    size={18}
                    color={colors.accentTeal}
                    style={styles.verifiedIcon}
                  />
                </View>

                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <AppText size="caption" color={colors.textSecondary}>
                    {profile.location}
                  </AppText>
                </View>
              </View>
            </View>

            <View style={styles.aboutBox}>
              <AppText
                size="small"
                color={colors.textSecondary}
                weight="semibold"
              >
                About Me
              </AppText>
              <AppText style={styles.aboutText}>{profile.about}</AppText>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <AppText
                  size="small"
                  color={colors.textSecondary}
                  weight="semibold"
                >
                  New to our community
                </AppText>
              </View>
            </View>

            <AppText weight="semibold" size="h4" style={styles.cardTitle}>
              Complete your Profile
            </AppText>
            <AppText color={colors.textSecondary} style={styles.cardSubtitle}>
              Add your photos and details to get better matches.
            </AppText>

            <GradientButton
              title="Complete Profile"
              onPress={() =>
                navigation.navigate("ProfileViewScreen", { userId: profile.id })
              }
              style={styles.secondaryButton}
            />
          </View>

          <View style={styles.sectionHeader}>
            <View>
              <AppText weight="semibold" size="h4" style={styles.sectionTitle}>
                People You May Know!
              </AppText>
              <AppText size="caption" color={colors.textSecondary}>
                Fresh picks curated for you
              </AppText>
            </View>
            <TouchableOpacity style={styles.filterPill} activeOpacity={0.9}>
              <Ionicons
                name="options-outline"
                size={16}
                color={colors.accentBlue}
              />
              <AppText
                weight="semibold"
                color={colors.accentBlue}
                size="caption"
              >
                Filters
              </AppText>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsRow}
          >
            {suggestions.map((person) => (
              <View key={person.name} style={styles.suggestionCard}>
                <Image
                  source={{ uri: person.avatar }}
                  style={styles.suggestionAvatar}
                />
                <AppText weight="semibold" style={styles.suggestionName}>
                  {person.name}
                </AppText>
                <AppText
                  size="caption"
                  color={colors.textSecondary}
                  style={styles.suggestionMeta}
                >
                  {person.age}, {person.location}
                </AppText>
              </View>
            ))}
          </ScrollView>
        </ScrollView>
      </SafeAreaView>

      <MainNavigationBar activeTab="Home" onTabPress={handleTabPress} />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },

  safeArea: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 20,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowMedium,
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 3,
      },
    }),
  },

  iconButton: {
    height: 40,
    width: 40,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowLight,
        shadowOpacity: 0.15,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
      },
      android: {
        elevation: 2,
      },
    }),
  },

  greetingBlock: {
    gap: 6,
  },

  greetingTitle: {
    color: colors.textPrimary,
  },

  heroCard: {
    borderRadius: 24,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowMedium,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 4,
      },
    }),
  },

  heroContent: {
    gap: 8,
    marginBottom: 12,
  },

  heroTitle: {
    color: colors.textPrimary,
  },

  heroSubtitle: {
    lineHeight: 20,
  },

  primaryButton: {
    width: "100%",
  },

  primaryButtonText: {
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowLight,
        shadowOpacity: 0.14,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },

  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  profileTextGroup: {
    flex: 1,
    gap: 6,
  },

  avatar: {
    height: 78,
    width: 78,
    borderRadius: 20,
    backgroundColor: colors.borderMedium,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  name: {
    color: colors.textPrimary,
  },

  verifiedIcon: {
    marginTop: 2,
  },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  aboutBox: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },

  aboutText: {
    color: colors.textPrimary,
    lineHeight: 20,
  },

  badgeRow: {
    flexDirection: "row",
  },

  badge: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  cardTitle: {
    color: colors.textPrimary,
  },

  cardSubtitle: {
    lineHeight: 20,
  },

  secondaryButton: {
    width: "100%",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionTitle: {
    color: colors.textPrimary,
  },

  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },

  suggestionsRow: {
    gap: 14,
    paddingRight: 8,
  },

  suggestionCard: {
    width: 150,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 6,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowLight,
        shadowOpacity: 0.12,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },

  suggestionAvatar: {
    height: 84,
    width: 84,
    borderRadius: 14,
    backgroundColor: colors.borderMedium,
  },

  suggestionName: {
    textAlign: "center",
    color: colors.textPrimary,
  },

  suggestionMeta: {
    textAlign: "center",
  },
});
