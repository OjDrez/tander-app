import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import DashboardActionsRow from "@/src/components/profile/DashboardActionsRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { startConversation, getChatUser } from "@/src/api/chatApi";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * DashboardScreen - User profile view with actions
 *
 * Accessibility Features:
 * - Large, readable text (32px name, 28px age, 18px location)
 * - 64px action buttons with clear labels
 * - High contrast text on gradient overlay
 * - 18px minimum font size for all text
 * - Screen reader labels for profile information
 * - Larger tag chips with 16px text
 */

// Default profile data (used when user data is loading)
const defaultProfile = {
  name: "Loading...",
  age: 0,
  location: "Loading location...",
  avatar:
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80",
  tags: [] as string[],
};

export default function DashboardScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "DashboardScreen">) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [userInfo, setUserInfo] = useState<{
    username: string;
    avatarUrl?: string;
    age?: number;
    location?: string;
    tags?: string[];
  } | null>(null);

  // Load user info on mount
  useEffect(() => {
    const loadUserInfo = async () => {
      setIsLoadingProfile(true);
      try {
        const user = await getChatUser(parseInt(userId, 10));
        setUserInfo({
          username: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
          age: user.age,
          location: user.location,
          tags: user.tags || [],
        });
      } catch (err) {
        console.error("[DashboardScreen] Failed to load user info:", err);
      } finally {
        setIsLoadingProfile(false);
      }
    };
    loadUserInfo();
  }, [userId]);

  // Get display values from userInfo or fallback to defaults
  const displayName = userInfo?.username || defaultProfile.name;
  const displayAge = userInfo?.age || defaultProfile.age;
  const displayLocation = userInfo?.location || defaultProfile.location;
  const displayAvatar = userInfo?.avatarUrl || defaultProfile.avatar;
  const displayTags = userInfo?.tags?.length ? userInfo.tags : ["Travel", "Music", "Socialize", "Cooking"];

  const goToConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      // Create or get existing conversation via API
      const conversation = await startConversation(parseInt(userId, 10));

      navigation.navigate("ConversationScreen", {
        conversationId: conversation.id,
        otherUserId: conversation.otherUserId,
        otherUserName: conversation.otherUserUsername,
        roomId: conversation.roomId,
        avatarUrl: userInfo?.avatarUrl,
      });
    } catch (err) {
      console.error("[DashboardScreen] Failed to start conversation:", err);
      Alert.alert("Error", "Failed to start conversation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigation, userInfo]);

  const goToVideoCall = useCallback(() => {
    navigation.navigate("VideoCallScreen", {
      userId: parseInt(userId, 10),
      username: displayName,
      callType: "video",
    });
  }, [userId, navigation, displayName]);

  const goToVoiceCall = useCallback(() => {
    navigation.navigate("VoiceCallScreen", {
      userId: parseInt(userId, 10),
      username: displayName,
      callType: "audio",
    });
  }, [userId, navigation, displayName]);

  return (
    <FullScreen statusBarStyle="light" style={styles.container}>
      <ImageBackground
        source={{ uri: displayAvatar }}
        style={styles.imageBg}
        accessibilityLabel={`Profile photo of ${displayName}`}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.75)"]}
          style={styles.overlay}
        >
          <AppHeader
            centerContent={
              <View style={styles.logoRow} accessibilityLabel="Tander app">
                <Image
                  source={require("@/src/assets/icons/tander-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                  accessibilityElementsHidden={true}
                />
                <Text style={styles.logoText} accessibilityElementsHidden={true}>
                  TANDER
                </Text>
              </View>
            }
          />

          {isLoadingProfile ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.white} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : (
            <View
              style={styles.profileCard}
              accessibilityRole="summary"
              accessibilityLabel={`${displayName}, ${displayAge} years old, from ${displayLocation}. Interests: ${displayTags.join(", ")}`}
            >
              <View style={styles.nameRow}>
                <Text
                  style={styles.name}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.3}
                >
                  {displayName}
                </Text>
                {displayAge > 0 && (
                  <Text
                    style={styles.age}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={1.3}
                  >
                    {displayAge}
                  </Text>
                )}
              </View>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={20} color={colors.white} />
                <Text
                  style={styles.location}
                  allowFontScaling={true}
                  maxFontSizeMultiplier={1.3}
                >
                  {displayLocation}
                </Text>
              </View>
              <View style={styles.tags} accessibilityLabel={`Interests: ${displayTags.join(", ")}`}>
                {displayTags.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text
                      style={styles.tagText}
                      allowFontScaling={true}
                      maxFontSizeMultiplier={1.3}
                    >
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.actionsWrapper}>
            {isLoading ? (
              <View style={styles.loadingActions}>
                <ActivityIndicator size="large" color={colors.white} />
                <Text style={styles.loadingText}>Starting...</Text>
              </View>
            ) : (
              <DashboardActionsRow
                userName={displayName}
                actions={[
                  { key: "chat", icon: "chatbubble-ellipses", label: "Chat", onPress: goToConversation },
                  { key: "voice", icon: "mic", label: "Voice", onPress: goToVoiceCall },
                  { key: "video", icon: "videocam", label: "Video", color: colors.accentTeal, onPress: goToVideoCall },
                  { key: "favorite", icon: "heart", label: "Favorite", onPress: () => {} },
                  { key: "close", icon: "close", label: "Close", onPress: () => navigation.goBack() },
                ]}
              />
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </FullScreen>
  );
}

/**
 * DashboardScreen Styles
 *
 * Accessibility Optimizations:
 * - Name: 32px for high visibility
 * - Age: 28px for clear reading
 * - Location: 18px (meets minimum)
 * - Tags: 16px (meets minimum)
 * - Increased padding and spacing
 * - Higher contrast overlay for text readability
 */
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
  },
  imageBg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 36,
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    width: 50,
    height: 50,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1.2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "600",
  },
  loadingActions: {
    alignItems: "center",
    gap: 12,
  },
  profileCard: {
    marginTop: "auto",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 14,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 12,
  },
  name: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 0.3,
  },
  age: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.white,
    opacity: 0.95,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  location: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "500",
    opacity: 0.95,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",
  },
  tagText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  actionsWrapper: {
    alignItems: "center",
    paddingTop: 24,
  },
});
