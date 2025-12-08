import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import PeopleYouMayKnowRow from "@/src/components/inbox/PeopleYouMayKnowRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { ensureSocketConnection, registerSocketListener } from "@/src/services/socket";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Conversation = {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  avatar: string;
  unreadCount?: number;
};

type NewMessagePreviewPayload = {
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  unreadCount?: number;
  name?: string;
  avatar?: string;
};

type IncomingCallPayload = {
  callerId: string;
  roomId: string;
};

const suggestedPeople = [
  {
    id: "ramon",
    name: "Ramon",
    age: 70,
    avatar:
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "gloria",
    name: "Gloria",
    age: 69,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "faye",
    name: "Faye",
    age: 65,
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "mike",
    name: "Mike",
    age: 68,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
  },
];

const mockConversations: Conversation[] = [
  {
    id: "felix",
    name: "Felix",
    message: "Kamusta po?",
    timestamp: "2m ago",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    unreadCount: 2,
  },
  {
    id: "jericho",
    name: "Jericho Ramos",
    message: "Hello, Felix, kamusta po?",
    timestamp: "5m ago",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    unreadCount: 0,
  },
  {
    id: "lydia",
    name: "Lydia Gomez",
    message: "Hello, Felix, kamusta po?",
    timestamp: "10m ago",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80",
    unreadCount: 1,
  },
];

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>(
    mockConversations
  );

  useEffect(() => {
    if (conversations.length === 0) {
      navigation.replace("InboxEmptyScreen");
    }
  }, [conversations.length, navigation]);

  useEffect(() => {
    ensureSocketConnection();

    const cleanupPreviewListener = registerSocketListener<NewMessagePreviewPayload>(
      "newMessagePreview",
      (payload) => {
        setConversations((prev) => {
          const existingIndex = prev.findIndex(
            (item) => item.id === payload.conversationId
          );

          const updatedConversation: Conversation = {
            id: payload.conversationId,
            name: payload.name ?? prev[existingIndex]?.name ?? "", // fallback to existing name
            avatar: payload.avatar ?? prev[existingIndex]?.avatar ?? "",
            message: payload.text,
            timestamp: payload.timestamp,
            unreadCount: payload.unreadCount ?? prev[existingIndex]?.unreadCount ?? 0,
          };

          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...prev[existingIndex],
              ...updatedConversation,
            };
            return updated;
          }

          return [updatedConversation, ...prev];
        });
      }
    );

    const cleanupIncomingCall = registerSocketListener<IncomingCallPayload>(
      "incomingCall",
      ({ callerId, roomId }) => {
        navigation.navigate("VideoCallScreen", { callerId, roomId, userId: callerId });
      }
    );

    return () => {
      cleanupPreviewListener();
      cleanupIncomingCall();
    };
  }, [navigation]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }

    return conversations.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handlePressConversation = (userId: string) => {
    navigation.navigate("ConversationScreen", { userId });
  };

  const handlePressAvatar = (userId: string) => {
    navigation.navigate("DashboardScreen", { userId });
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const hasUnread = (item.unreadCount ?? 0) > 0;

    return (
      <TouchableOpacity
        style={[styles.threadCard, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
        activeOpacity={0.9}
        onPress={() => handlePressConversation(item.id)}
      >
        <TouchableOpacity
          style={[styles.avatarWrapper, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
          activeOpacity={0.9}
          onPress={() => handlePressAvatar(item.id)}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        </TouchableOpacity>

        <View style={styles.threadBody}>
          <View style={styles.threadTopRow}>
            <AppText size="h4" weight="semibold" numberOfLines={1} style={styles.name}>
              {item.name}
            </AppText>
            <AppText size="tiny" color={colors.textMuted} weight="semibold">
              {item.timestamp}
            </AppText>
          </View>

          <AppText
            size="small"
            color={colors.textSecondary}
            numberOfLines={1}
            style={styles.preview}
          >
            {item.message}
          </AppText>
        </View>

        {hasUnread ? (
          <View style={styles.unreadBadge}>
            <AppText size="tiny" weight="bold" color={colors.white}>
              {item.unreadCount}
            </AppText>
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.fullScreen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderConversation}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View style={styles.headerSection}>
                <View style={styles.titleRow}>
                  <AppText size="h2" weight="bold" style={styles.title}>
                    Inbox
                  </AppText>
                  <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.circleButton} activeOpacity={0.88}>
                      <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.circleButton} activeOpacity={0.88}>
                      <Ionicons name="videocam" size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <AppText size="small" color={colors.textSecondary} style={styles.subtitle}>
                  Catch up with your conversations and stay connected.
                </AppText>

                <View style={styles.searchBar}>
                  <Ionicons name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search conversations"
                    placeholderTextColor={colors.textMuted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    selectionColor={colors.primary}
                  />
                  <TouchableOpacity style={styles.filterButton} activeOpacity={0.85}>
                    <Ionicons name="options-outline" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>

                <LinearGradient
                  colors={colors.gradients.registration.array}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.suggestionsCard, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
                >
                  <PeopleYouMayKnowRow people={suggestedPeople} onSelect={handlePressAvatar} />
                </LinearGradient>

                <View style={styles.sectionRow}>
                  <AppText size="small" weight="semibold" color={colors.textPrimary}>
                    Messages
                  </AppText>
                  <View style={styles.countBadge}>
                    <AppText size="tiny" weight="bold" color={colors.white}>
                      {conversations.length}
                    </AppText>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <AppText size="h4" weight="bold" color={colors.textPrimary}>
                  No messages yet
                </AppText>
                <AppText
                  size="small"
                  color={colors.textSecondary}
                  style={styles.emptySubtitle}
                >
                  Start connecting with people and your conversations will appear here.
                </AppText>
              </View>
            }
          />
        </SafeAreaView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 28,
    paddingTop: 10,
  },
  headerSection: {
    gap: 12,
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    letterSpacing: -0.4,
  },
  subtitle: {
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circleButton: {
    height: 40,
    width: 40,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderMedium,
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowLight,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    height: 36,
    width: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
  },
  suggestionsCard: {
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  sectionRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countBadge: {
    minWidth: 28,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 76,
    gap: 12,
  },
  avatarWrapper: {
    height: 56,
    width: 56,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.borderMedium,
  },
  avatar: {
    height: "100%",
    width: "100%",
  },
  threadBody: {
    flex: 1,
    gap: 6,
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  preview: {
    lineHeight: 20,
  },
  unreadBadge: {
    minWidth: 26,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  separator: {
    height: 12,
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: 12,
  },
  iosShadow: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  androidShadow: {
    elevation: 3,
  },
});
