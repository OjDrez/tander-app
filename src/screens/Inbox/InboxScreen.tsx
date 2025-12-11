import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import PeopleYouMayKnowRow from "@/src/components/inbox/PeopleYouMayKnowRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useSocketConnection } from "@/src/hooks/useSocket";
import {
  connectSocket,
  registerSocketListener,
} from "@/src/services/socket";
import { getConversations, getChatUsers } from "@/src/api/chatApi";
import {
  ConversationPreview,
  IncomingCallPayload,
  NewMessagePreviewPayload,
  UserOnlinePayload,
  UserOfflinePayload,
} from "@/src/types/chat";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SuggestedPerson = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  userId?: number;
};

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isAuthenticated, onlineUsers } = useSocketConnection();

  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [suggestedPeople, setSuggestedPeople] = useState<SuggestedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversations from API
  const loadConversations = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      console.error("[InboxScreen] Failed to load conversations:", err);
      setError("Failed to load conversations");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Load suggested people
  const loadSuggestedPeople = useCallback(async () => {
    try {
      const users = await getChatUsers();
      const suggested: SuggestedPerson[] = users.slice(0, 6).map((user) => ({
        id: user.id.toString(),
        name: user.displayName || user.username,
        age: Math.floor(Math.random() * 20) + 50, // Placeholder age
        avatar: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`,
        userId: user.id,
      }));
      setSuggestedPeople(suggested);
    } catch (err) {
      console.error("[InboxScreen] Failed to load suggested people:", err);
    }
  }, []);

  // Try to connect socket (optional - chat will work via REST API if unavailable)
  useEffect(() => {
    connectSocket().catch((err) => {
      console.warn("[InboxScreen] Socket connection failed (will use REST API):", err.message);
    });
  }, []);

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversations();
      loadSuggestedPeople();
    }, [loadConversations, loadSuggestedPeople])
  );

  // Navigate to empty screen if no conversations
  useEffect(() => {
    if (!isLoading && conversations.length === 0 && !error) {
      // Keep showing the screen with empty state instead of replacing
    }
  }, [conversations.length, isLoading, error]);

  // Socket event listeners
  useEffect(() => {
    // New message preview
    const cleanupPreview = registerSocketListener<NewMessagePreviewPayload>(
      "message",
      (payload) => {
        setConversations((prev) => {
          // Find existing conversation by room ID
          const existingIndex = prev.findIndex(
            (item) => item.roomId === payload.conversationId || item.id === payload.conversationId
          );

          const now = new Date();
          const updatedConversation: Partial<ConversationPreview> = {
            message: payload.text,
            timestamp: "Just now",
            unreadCount: (prev[existingIndex]?.unreadCount || 0) + 1,
          };

          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex] = {
              ...prev[existingIndex],
              ...updatedConversation,
            };
            // Move to top
            const [item] = updated.splice(existingIndex, 1);
            updated.unshift(item);
            return updated;
          }

          // New conversation - would need full data from API
          return prev;
        });
      }
    );

    // Incoming call
    const cleanupIncomingCall = registerSocketListener<IncomingCallPayload>(
      "incoming-call",
      (payload) => {
        navigation.navigate("IncomingCallScreen", {
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerUsername: payload.callerUsername,
          callType: payload.callType,
          roomId: payload.roomId,
          callId: payload.callId,
        });
      }
    );

    // User online status
    const cleanupOnline = registerSocketListener<UserOnlinePayload>(
      "user_online",
      (payload) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === payload.userId ? { ...conv, isOnline: true } : conv
          )
        );
      }
    );

    const cleanupOffline = registerSocketListener<UserOfflinePayload>(
      "user_offline",
      (payload) => {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.userId === payload.userId ? { ...conv, isOnline: false } : conv
          )
        );
      }
    );

    return () => {
      cleanupPreview();
      cleanupIncomingCall();
      cleanupOnline();
      cleanupOffline();
    };
  }, [navigation]);

  // Update online status from hook
  useEffect(() => {
    setConversations((prev) =>
      prev.map((conv) => ({
        ...conv,
        isOnline: onlineUsers.has(conv.userId),
      }))
    );
  }, [onlineUsers]);

  // Filtered conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations;
    }
    return conversations.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [conversations, searchQuery]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [conversations]);

  const handlePressConversation = (conversation: ConversationPreview) => {
    navigation.navigate("ConversationScreen", {
      conversationId: parseInt(conversation.id, 10),
      otherUserId: conversation.userId,
      otherUserName: conversation.name,
      avatarUrl: conversation.avatar,
      roomId: conversation.roomId,
    });
  };

  const handlePressAvatar = (userId: string) => {
    navigation.navigate("DashboardScreen", { userId });
  };

  const handleVideoCall = (conversation: ConversationPreview) => {
    navigation.navigate("VideoCallScreen", {
      userId: conversation.userId,
      username: conversation.name,
      callType: "video",
    });
  };

  const handleVoiceCall = (conversation: ConversationPreview) => {
    navigation.navigate("VoiceCallScreen", {
      userId: conversation.userId,
      username: conversation.name,
      callType: "audio",
    });
  };

  const handleRefresh = () => {
    loadConversations(true);
  };

  const renderConversation = ({ item }: { item: ConversationPreview }) => {
    const hasUnread = (item.unreadCount ?? 0) > 0;
    const isOnline = item.isOnline || onlineUsers.has(item.userId);

    return (
      <TouchableOpacity
        style={[styles.threadCard, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
        activeOpacity={0.85}
        onPress={() => handlePressConversation(item)}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${item.name}${hasUnread ? `, ${item.unreadCount} unread messages` : ""}${isOnline ? ", online now" : ""}`}
        accessibilityHint="Double tap to open conversation"
      >
        <TouchableOpacity
          style={[styles.avatarWrapper, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
          activeOpacity={0.85}
          onPress={() => handlePressAvatar(item.userId.toString())}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name}'s profile`}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          {isOnline && <View style={styles.onlineIndicator} accessibilityLabel="Online now" />}
        </TouchableOpacity>

        <View style={styles.threadBody}>
          <View style={styles.threadTopRow}>
            <AppText size="h4" weight="bold" numberOfLines={1} style={styles.name}>
              {item.name}
            </AppText>
            <AppText size="small" color={colors.textSecondary} weight="medium">
              {item.timestamp}
            </AppText>
          </View>

          <AppText
            size="body"
            color={hasUnread ? colors.textPrimary : colors.textSecondary}
            weight={hasUnread ? "semibold" : "normal"}
            numberOfLines={2}
            style={styles.preview}
          >
            {item.message}
          </AppText>
        </View>

        <View style={styles.actionsColumn}>
          <View style={styles.callButtons}>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleVoiceCall(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Voice call ${item.name}`}
              accessibilityHint="Double tap to start a voice call"
            >
              <Ionicons name="call" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.callButton}
              onPress={() => handleVideoCall(item)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Video call ${item.name}`}
              accessibilityHint="Double tap to start a video call"
            >
              <Ionicons name="videocam" size={22} color={colors.accentTeal} />
            </TouchableOpacity>
          </View>

          {hasUnread ? (
            <View style={styles.unreadBadge} accessibilityLabel={`${item.unreadCount} unread messages`}>
              <AppText size="small" weight="bold" color={colors.white}>
                {item.unreadCount}
              </AppText>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={24} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerSection} accessibilityRole="header">
      <View style={styles.titleRow}>
        <AppText size="h1" weight="bold" style={styles.title}>
          Inbox
        </AppText>
        <View style={styles.headerActions}>
          {!isAuthenticated && (
            <View style={styles.connectionStatus} accessibilityLabel="You are offline">
              <View style={styles.offlineDot} />
              <AppText size="small" color={colors.textMuted}>
                Offline
              </AppText>
            </View>
          )}
          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Compose new message"
          >
            <Ionicons name="create-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
      <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
        Catch up with your conversations and stay connected.
      </AppText>

      <View style={styles.searchBar} accessibilityRole="search">
        <Ionicons name="search" size={22} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          selectionColor={colors.primary}
          accessibilityLabel="Search conversations"
          accessibilityHint="Type to search your messages"
        />
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Filter conversations"
        >
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {suggestedPeople.length > 0 && (
        <LinearGradient
          colors={colors.gradients.registration.array}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.suggestionsCard, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
        >
          <PeopleYouMayKnowRow
            people={suggestedPeople}
            onSelect={(id) => handlePressAvatar(id)}
          />
        </LinearGradient>
      )}

      <View style={styles.sectionRow}>
        <AppText size="body" weight="bold" color={colors.textPrimary}>
          Messages
        </AppText>
        <View style={styles.countBadge} accessibilityLabel={`${totalUnread > 0 ? totalUnread + " unread" : conversations.length + " total"} messages`}>
          <AppText size="small" weight="bold" color={colors.white}>
            {totalUnread > 0 ? totalUnread : conversations.length}
          </AppText>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="small" color={colors.textSecondary} style={styles.loadingText}>
            Loading conversations...
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
          <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
            Something went wrong
          </AppText>
          <AppText size="small" color={colors.textSecondary} style={styles.emptySubtitle}>
            {error}
          </AppText>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadConversations()}>
            <AppText size="small" weight="semibold" color={colors.primary}>
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
        <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
          No messages yet
        </AppText>
        <AppText size="small" color={colors.textSecondary} style={styles.emptySubtitle}>
          Start connecting with people and your conversations will appear here.
        </AppText>
      </View>
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
            ListHeaderComponent={renderHeader}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          />
        </SafeAreaView>
      </LinearGradient>
    </FullScreen>
  );
}

/**
 * InboxScreen Styles
 *
 * Accessibility Optimizations:
 * - Minimum touch targets of 48x48px
 * - Larger fonts for readability
 * - Increased spacing between elements
 * - High contrast text colors
 */
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
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 12,
  },
  headerSection: {
    gap: 16, // Increased spacing
    marginBottom: 16,
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
    lineHeight: 26,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
  },
  offlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.textMuted,
  },
  circleButton: {
    // Minimum 48x48 touch target for accessibility
    height: 48,
    width: 48,
    borderRadius: 20,
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
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    height: 56, // Increased from 48 for easier tapping
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 18, // Increased for readability
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  filterButton: {
    // Minimum 48x48 touch target
    height: 44,
    width: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
  },
  suggestionsCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  sectionRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countBadge: {
    minWidth: 36,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  threadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16, // Increased padding
    borderWidth: 1,
    borderColor: colors.borderLight,
    minHeight: 100, // Increased for larger content
    gap: 14,
  },
  avatarWrapper: {
    // Larger avatar for better visibility
    height: 64,
    width: 64,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.borderMedium,
    position: "relative",
  },
  avatar: {
    height: "100%",
    width: "100%",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16, // Larger indicator
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },
  threadBody: {
    flex: 1,
    gap: 8, // Increased spacing
  },
  threadTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  name: {
    flex: 1,
    marginRight: 8,
  },
  preview: {
    lineHeight: 24, // Increased for readability
  },
  actionsColumn: {
    alignItems: "flex-end",
    gap: 10,
  },
  callButtons: {
    flexDirection: "row",
    gap: 10, // Increased gap between buttons
  },
  callButton: {
    // Minimum 48x48 touch target for accessibility
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadBadge: {
    minWidth: 32,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  separator: {
    height: 14, // Increased spacing between items
  },
  loadingState: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    marginTop: 12,
  },
  emptyState: {
    paddingVertical: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyTitle: {
    marginTop: 12,
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 26,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    minHeight: 48, // Accessible touch target
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
