import React, { useMemo } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";

const PROFILE_IMAGES = {
  user1:
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  user2:
    "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=600&q=80",
};

type MatchCelebrationRouteProp = RouteProp<
  AppStackParamList,
  "MatchCelebrationScreen"
>;

type MatchCelebrationNavProp = NativeStackNavigationProp<
  AppStackParamList,
  "MatchCelebrationScreen"
>;

export default function MatchCelebrationScreen() {
  const navigation = useNavigation<MatchCelebrationNavProp>();
  const route = useRoute<MatchCelebrationRouteProp>();

  const { user1, user2 } = route.params;

  const profiles = useMemo(
    () => [
      {
        name: user1 || "Camille Reyes",
        avatar: PROFILE_IMAGES.user1,
      },
      {
        name: user2 || "Felix Javier",
        avatar: PROFILE_IMAGES.user2,
      },
    ],
    [user1, user2]
  );

  const handleChatPress = () => {
    navigation.navigate("InboxScreen");
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.backgroundCircleLarge} />
          <View style={styles.backgroundCircleSmall} />

          <View style={styles.topSection}>
            <Image
              source={require("@/src/assets/icons/tander-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <AppText size="h3" weight="bold" style={styles.brandTitle}>
              Tander
            </AppText>
          </View>

          <View style={styles.centerSection}>
            <View style={styles.heartWrapper}>
              <View style={styles.heartContainer}>
                <Ionicons name="heart" size={96} color={colors.primary} />
              </View>

              <View style={[styles.profileBadge, styles.profileLeft]}>
                <Image
                  source={{ uri: profiles[0].avatar }}
                  style={styles.profileImage}
                />
              </View>

              <View style={[styles.profileBadge, styles.profileRight]}>
                <Image
                  source={{ uri: profiles[1].avatar }}
                  style={styles.profileImage}
                />
              </View>
            </View>
          </View>

          <View style={styles.textSection}>
            <AppText size="h3" weight="bold" color={colors.success}>
              It&apos;s a Match!
            </AppText>

            <View style={styles.namesWrapper}>
              <AppText size="h3" weight="bold" style={styles.name}>
                {profiles[0].name}
              </AppText>
              <AppText size="h3" weight="bold" style={styles.name}>
                {profiles[1].name}
              </AppText>
            </View>

            <AppText
              size="small"
              weight="medium"
              color={colors.textSecondary}
              style={styles.subtitle}
            >
              Congratulations
            </AppText>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.9}
            style={styles.chatButton}
            onPress={handleChatPress}
          >
            <AppText
              size="button"
              weight="semibold"
              color={colors.white}
              style={styles.chatButtonText}
            >
              Chat Now
            </AppText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </FullScreen>
  );
}

const CONTAINER_RADIUS = 28;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
    alignItems: "stretch",
  },
  container: {
    flex: 1,
    backgroundColor: colors.white,
    borderBottomLeftRadius: CONTAINER_RADIUS,
    borderBottomRightRadius: CONTAINER_RADIUS,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 32,
    overflow: "hidden",
    justifyContent: "space-between",
  },
  backgroundCircleLarge: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(51, 169, 162, 0.06)",
    top: 120,
    alignSelf: "center",
  },
  backgroundCircleSmall: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(245, 161, 75, 0.08)",
    top: 80,
    right: -40,
  },
  topSection: {
    alignItems: "center",
    marginTop: 4,
  },
  logo: {
    width: 80,
    height: 40,
    marginBottom: 2,
  },
  brandTitle: {
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  centerSection: {
    alignItems: "center",
    marginTop: 10,
  },
  heartWrapper: {
    width: 260,
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  heartContainer: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  profileBadge: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
    overflow: "hidden",
  },
  profileLeft: {
    left: 12,
    top: 52,
  },
  profileRight: {
    right: 12,
    top: 24,
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  textSection: {
    alignItems: "center",
    marginTop: 4,
  },
  namesWrapper: {
    marginTop: 8,
    alignItems: "center",
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: 8,
  },
  chatButton: {
    backgroundColor: colors.accentTeal,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  chatButtonText: {
    letterSpacing: 0.2,
  },
});
