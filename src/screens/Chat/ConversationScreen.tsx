import colors from "@/src/config/colors";
import MessageBubble from "@/src/components/chat/MessageBubble";
import AppHeader from "@/src/components/navigation/AppHeader";
import FullScreen from "@/src/components/layout/FullScreen";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import React from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const messages = [
  { id: "1", text: "Kamusta po?", time: "5:58 PM", isOwn: false },
  {
    id: "2",
    text: "Hello! Ok naman, eto nagluluto ng Adobo Baboy.",
    time: "5:59 PM",
    isOwn: true,
  },
  {
    id: "3",
    text: "Wow! Gusto ko matikman yan next time magkita tayo!",
    time: "5:59 PM",
    isOwn: false,
  },
  {
    id: "4",
    text: "Sure, magaya kita tayo sa Rainforest, papakain ko sa iyo yung niluto ko. Tapos lakad tayo sa park!",
    time: "6:00 PM",
    isOwn: true,
  },
  {
    id: "5",
    text: "Sige, sige, Faye. Kita Kits tayo kapag natapos ko na itong niluluto ko. See you!",
    time: "6:01 PM",
    isOwn: false,
  },
  {
    id: "6",
    text: "Ok cge! Enjoy mo pagluluto mo, message mo lang ako pag tapos ka na!",
    time: "6:02 PM",
    isOwn: true,
  },
];

export default function ConversationScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "ConversationScreen">) {
  const { userId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const handleVideoCall = () => {
    navigation.navigate("VideoCallScreen", { userId });
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <LinearGradient
        colors={["#FFFFFF", "#F3FBF9"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <AppHeader
          onBackPress={() => navigation.goBack()}
          centerContent={
            <View style={styles.headerUserRow}>
              <View style={styles.avatarPlaceholder} />
              <View>
                <Text style={styles.headerName}>Felix</Text>
                <Text style={styles.headerStatus}>Active now</Text>
              </View>
            </View>
          }
          rightContent={
            <TouchableOpacity
              style={styles.videoButton}
              onPress={handleVideoCall}
              activeOpacity={0.92}
            >
              <Ionicons name="videocam" size={18} color={colors.white} />
              <Text style={styles.videoButtonText}>Video Call ❤️</Text>
            </TouchableOpacity>
          }
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={12}
        >
          <FlatList
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <MessageBubble text={item.text} time={item.time} isOwn={item.isOwn} />
            )}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.85}>
              <Ionicons name="attach" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              placeholder="Type a message..."
              placeholderTextColor={colors.textMuted}
              style={styles.textInput}
            />
            <TouchableOpacity style={styles.sendButton} activeOpacity={0.9}>
              <Ionicons name="send" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
  },
  gradient: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  headerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarPlaceholder: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: colors.borderMedium,
  },
  headerName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderMedium,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    height: 46,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 16,
    color: colors.textPrimary,
  },
  sendButton: {
    height: 46,
    width: 46,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  videoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  videoButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
});
