import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import DashboardActionsRow from "@/src/components/profile/DashboardActionsRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { Image, ImageBackground, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const profile = {
  name: "Felix Cruz",
  age: 60,
  location: "Floodway, Rizal",
  avatar:
    "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=800&q=80",
  tags: ["Travel", "Music", "Socialize", "Cooking"],
};

export default function DashboardScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "DashboardScreen">) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const goToConversation = () => navigation.navigate("ConversationScreen", { userId });
  const goToVideoCall = () => navigation.navigate("VideoCallScreen", { userId });

  return (
    <FullScreen statusBarStyle="light" style={styles.container}>
      <ImageBackground source={{ uri: profile.avatar }} style={styles.imageBg}>
        <LinearGradient
          colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.7)"]}
          style={styles.overlay}
        >
          <AppHeader
            centerContent={
              <View style={styles.logoRow}>
                <Image
                  source={require("@/src/assets/icons/tander-logo.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.logoText}>TANDER</Text>
              </View>
            }
          />

          <View style={styles.profileCard}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.age}>{profile.age}</Text>
            </View>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={16} color={colors.white} />
              <Text style={styles.location}>{profile.location}</Text>
            </View>
            <View style={styles.tags}>
              {profile.tags.map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.actionsWrapper}>
            <DashboardActionsRow
              actions={[
                { key: "chat", icon: "chatbubble-ellipses", label: "Chat", onPress: goToConversation },
                { key: "voice", icon: "mic", label: "Voice", onPress: () => {} },
                { key: "video", icon: "videocam", label: "Video", color: colors.accentTeal, onPress: goToVideoCall },
                { key: "favorite", icon: "heart", label: "Favorite", onPress: () => {} },
                { key: "close", icon: "close", label: "Close", onPress: () => navigation.goBack() },
              ]}
            />
          </View>
        </LinearGradient>
      </ImageBackground>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.black,
  },
  imageBg: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 32,
    justifyContent: "space-between",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 46,
    height: 46,
  },
  logoText: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.white,
    letterSpacing: 1,
  },
  profileCard: {
    marginTop: "auto",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 10,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.white,
  },
  age: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.white,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  location: {
    color: colors.white,
    fontSize: 14,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagChip: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  tagText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "600",
  },
  actionsWrapper: {
    alignItems: "center",
    paddingTop: 18,
  },
});
