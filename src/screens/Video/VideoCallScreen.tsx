import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const sampleImage =
  "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=800&q=80";

export default function VideoCallScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "VideoCallScreen">) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <FullScreen statusBarStyle="light" style={styles.container}>
      <ImageBackground source={{ uri: sampleImage }} style={styles.image}>
        <LinearGradient
          colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.6)"]}
          style={styles.overlay}
        >
          <AppHeader
            onBackPress={() => navigation.goBack()}
            centerContent={<Text style={styles.headerTitle}>Video Call</Text>}
            rightContent={<View style={{ width: 1 }} />}
          />

          <View style={styles.userLabel}>
            <Text style={styles.userText}>Calling {userId}</Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.9}>
              <Ionicons name="mic" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.9}>
              <Ionicons name="videocam" size={22} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.endButton]}
              activeOpacity={0.9}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="call" size={22} color={colors.white} />
            </TouchableOpacity>
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
  image: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
  userLabel: {
    alignItems: "center",
  },
  userText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginHorizontal: 28,
    marginBottom: 24,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  iconButton: {
    height: 56,
    width: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  endButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});
