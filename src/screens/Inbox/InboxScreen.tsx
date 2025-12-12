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
import { getConversations, getChatUsers, validateChatAccess, getFullPhotoUrl } from "@/src/api/chatApi";
import { matchingApi } from "@/src/api/matchingApi";
import { Match } from "@/src/types/matching";
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
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
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

// Props type for AnimatedConversationRow
type AnimatedConversationRowProps = {
  item: ConversationPreview;
  index: number;
  onPress: () => void;
  onAvatarPress: () => void;
  onVideoCall: () => void;
  onVoiceCall: () => void;
  isOnline: boolean;
};

// Animated conversation row component - memoized for performance
const AnimatedConversationRow = memo(({
  item,
  index,
  onPress,
  onAvatarPress,
  onVideoCall,
  onVoiceCall,
  isOnline,
}: AnimatedConversationRowProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const hasUnread = (item.unreadCount ?? 0) > 0;

  return (
    <Animated.View
      style={[
        styles.threadCard,
        Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.threadTouchable}
        activeOpacity={0.85}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Chat with ${item.name}${hasUnread ? `, ${item.unreadCount} unread messages` : ""}${isOnline ? ", online now" : ""}`}
        accessibilityHint="Double tap to open conversation"
      >
        <TouchableOpacity
          style={[styles.avatarWrapper, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
          activeOpacity={0.85}
          onPress={onAvatarPress}
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
              onPress={onVoiceCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Voice call ${item.name}`}
              accessibilityHint="Double tap to start a voice call"
            >
              <Ionicons name="call" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.callButton, styles.videoCallButton]}
              onPress={onVideoCall}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Video call ${item.name}`}
              accessibilityHint="Double tap to start a video call"
            >
              <Ionicons name="videocam" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {hasUnread ? (
            <View style={styles.unreadBadge} accessibilityLabel={`${item.unreadCount} unread messages`}>
              <AppText size="small" weight="bold" color={colors.white}>
                {item.unreadCount}
              </AppText>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={22} color={colors.textMuted} />
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

AnimatedConversationRow.displayName = "AnimatedConversationRow";

/**
 * Represents a match that can be displayed in the match queue
 * Bumble-style: shows countdown timer for 24-hour expiration
 */
type MatchQueuePerson = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  userId?: number;
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
};

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isAuthenticated, onlineUsers } = useSocketConnection();

  const [searchQuery, setSearchQuery] = useState("");
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [matchQueue, setMatchQueue] = useState<MatchQueuePerson[]>([]);
  const [urgentMatches, setUrgentMatches] = useState<Match[]>([]);
  const [matchedUserIds, setMatchedUserIds] = useState<Set<number>>(new Set());
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

  /**
   * Load matches for the match queue (Bumble-style)
   * - Only active matches can be chatted with
   * - Matches expire after 24 hours if no chat is started
   * - Sort by urgency (expiring soonest first)
   */
  const loadMatchQueue = useCallback(async () => {
    try {
      const matches = await matchingApi.getMatchesList();

      // Store matched user IDs for validation - only ACTIVE or CHAT_STARTED matches
      const activeMatchedIds = new Set(
        matches
          .filter((m) => m.status === "ACTIVE" || m.status === "CHAT_STARTED")
          .map((m) => m.matchedUserId)
      );
      setMatchedUserIds(activeMatchedIds);

      // Filter matches that haven't started chat yet - these need action
      const pendingMatches = matches
        .filter((m) => !m.chatStarted && m.status === "ACTIVE")
        .sort((a, b) => {
          // Sort by urgency: expiring soonest first
          const aHours = a.hoursUntilExpiration ?? 24;
          const bHours = b.hoursUntilExpiration ?? 24;
          return aHours - bHours;
        });

      // Track urgent matches (expiring within 6 hours) for warning banner
      const urgent = pendingMatches.filter(
        (m) => m.hoursUntilExpiration !== undefined && m.hoursUntilExpiration <= 6
      );
      setUrgentMatches(urgent);

      // Convert to match queue format
      const queue: MatchQueuePerson[] = pendingMatches.map((match) => {
        // Convert relative photo URL to full URL, fallback to UI Avatars
        const fullPhotoUrl = getFullPhotoUrl(match.matchedUserProfilePhotoUrl);
        return {
          id: match.matchedUserId.toString(),
          name: match.matchedUserDisplayName,
          age: match.matchedUserAge || 0,
          avatar:
            fullPhotoUrl ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(match.matchedUserDisplayName)}&background=random`,
          userId: match.matchedUserId,
          hoursUntilExpiration: match.hoursUntilExpiration,
          chatStarted: match.chatStarted,
        };
      });

      setMatchQueue(queue);
    } catch (err) {
      console.error("[InboxScreen] Failed to load matches:", err);
      setMatchQueue([]);
      setMatchedUserIds(new Set());
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
      loadMatchQueue();
    }, [loadConversations, loadMatchQueue])
  );


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

  // Filtered conversations - only show conversations with matched users
  const filteredConversations = useMemo(() => {
    // First filter by matched users - you can only chat with people you've matched with
    let filtered = conversations.filter((item) => matchedUserIds.has(item.userId));

    // Then apply search filter if present
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }

    return filtered;
  }, [conversations, searchQuery, matchedUserIds]);

  // Total unread count - only count from matched conversations
  const totalUnread = useMemo(() => {
    return filteredConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [filteredConversations]);

  // Validate match before opening conversation
  const handlePressConversation = useCallback(async (conversation: ConversationPreview) => {
    // Quick check using local state
    if (!matchedUserIds.has(conversation.userId)) {
      Alert.alert(
        "Cannot Open Chat",
        "You can only chat with people you have matched with.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("ConversationScreen", {
      conversationId: parseInt(conversation.id, 10),
      otherUserId: conversation.userId,
      otherUserName: conversation.name,
      avatarUrl: conversation.avatar,
      roomId: conversation.roomId,
    });
  }, [navigation, matchedUserIds]);

  const handlePressAvatar = useCallback((userId: string) => {
    navigation.navigate("ViewProfileScreen", { userId });
  }, [navigation]);

  /**
   * Start a chat with a match from the match queue
   * This is the primary action in Bumble-style matching
   */
  const handleStartChat = useCallback(async (userId: string) => {
    const numericUserId = parseInt(userId, 10);

    if (!matchedUserIds.has(numericUserId)) {
      Alert.alert(
        "Match Expired",
        "This match has expired. Keep swiping to find new matches!",
        [{ text: "OK" }]
      );
      loadMatchQueue(); // Refresh the queue
      return;
    }

    // Find the match in the queue for user details
    const matchPerson = matchQueue.find((p) => p.id === userId);

    navigation.navigate("ConversationScreen", {
      conversationId: 0, // Will be created on first message
      otherUserId: numericUserId,
      otherUserName: matchPerson?.name || "Match",
      avatarUrl: matchPerson?.avatar || "",
      roomId: undefined,
    });
  }, [navigation, matchedUserIds, matchQueue, loadMatchQueue]);

  // Validate match before video call
  const handleVideoCall = useCallback(async (conversation: ConversationPreview) => {
    if (!matchedUserIds.has(conversation.userId)) {
      Alert.alert(
        "Cannot Start Call",
        "You can only call people you have matched with.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("VideoCallScreen", {
      userId: conversation.userId,
      username: conversation.name,
      callType: "video",
    });
  }, [navigation, matchedUserIds]);

  // Validate match before voice call
  const handleVoiceCall = useCallback(async (conversation: ConversationPreview) => {
    if (!matchedUserIds.has(conversation.userId)) {
      Alert.alert(
        "Cannot Start Call",
        "You can only call people you have matched with.",
        [{ text: "OK" }]
      );
      return;
    }

    navigation.navigate("VoiceCallScreen", {
      userId: conversation.userId,
      username: conversation.name,
      callType: "audio",
    });
  }, [navigation, matchedUserIds]);

  const handleRefresh = useCallback(() => {
    loadConversations(true);
    loadMatchQueue();
  }, [loadConversations, loadMatchQueue]);

  const renderConversation = useCallback(({ item, index }: { item: ConversationPreview; index: number }) => {
    const isOnline = item.isOnline || onlineUsers.has(item.userId);

    return (
      <AnimatedConversationRow
        item={item}
        index={index}
        onPress={() => handlePressConversation(item)}
        onAvatarPress={() => handlePressAvatar(item.userId.toString())}
        onVideoCall={() => handleVideoCall(item)}
        onVoiceCall={() => handleVoiceCall(item)}
        isOnline={isOnline}
      />
    );
  }, [onlineUsers, handlePressConversation, handlePressAvatar, handleVideoCall, handleVoiceCall]);

  const renderHeader = useCallback(() => (
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
            onPress={() => navigation.navigate("MyMatchesScreen")}
            accessibilityRole="button"
            accessibilityLabel="View all matches"
          >
            <Ionicons name="heart" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
      <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
        Chat with your matches before time runs out!
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

      {/* Urgent Matches Warning - Bumble style */}
      {urgentMatches.length > 0 && (
        <TouchableOpacity
          style={styles.urgentWarning}
          onPress={() => navigation.navigate("MyMatchesScreen")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${urgentMatches.length} matches about to expire`}
        >
          <Ionicons name="warning" size={24} color={colors.error} />
          <View style={styles.urgentWarningText}>
            <AppText size="body" weight="bold" color={colors.error}>
              {urgentMatches.length} match{urgentMatches.length > 1 ? "es" : ""} expiring soon!
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Less than 6 hours left - chat now!
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.error} />
        </TouchableOpacity>
      )}

      {/* Match Queue - Bumble style with countdown timers */}
      {matchQueue.length > 0 && (
        <View>
          <View style={styles.matchesSectionHeader}>
            <View style={styles.matchesHeaderLeft}>
              <AppText size="body" weight="bold" color={colors.textPrimary}>
                Match Queue
              </AppText>
              <View style={styles.matchCountBadge}>
                <AppText size="small" weight="bold" color={colors.white}>
                  {matchQueue.length}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate("MyMatchesScreen")}
              accessibilityRole="button"
              accessibilityLabel="View all matches"
            >
              <AppText size="small" weight="semibold" color={colors.primary}>
                View All
              </AppText>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={colors.gradients.registration.array}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.matchQueueCard, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
          >
            <PeopleYouMayKnowRow
              people={matchQueue}
              onSelect={(id) => handlePressAvatar(id)}
              onStartChat={handleStartChat}
            />
          </LinearGradient>
        </View>
      )}

      {/* Empty match queue prompt */}
      {matchQueue.length === 0 && !isLoading && (
        <TouchableOpacity
          style={styles.emptyMatchPrompt}
          onPress={() => navigation.navigate("MatchesScreen")}
          activeOpacity={0.85}
        >
          <Ionicons name="heart-outline" size={32} color={colors.primary} />
          <View style={styles.emptyMatchText}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              No pending matches
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Keep swiping to find your next connection!
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </TouchableOpacity>
      )}

      <View style={styles.sectionRow}>
        <AppText size="body" weight="bold" color={colors.textPrimary}>
          Messages
        </AppText>
        <View style={styles.countBadge} accessibilityLabel={`${totalUnread > 0 ? totalUnread + " unread" : filteredConversations.length + " total"} messages`}>
          <AppText size="small" weight="bold" color={colors.white}>
            {totalUnread > 0 ? totalUnread : filteredConversations.length}
          </AppText>
        </View>
      </View>
    </View>
  ), [isAuthenticated, searchQuery, urgentMatches, matchQueue, totalUnread, filteredConversations.length, navigation, handlePressAvatar, handleStartChat, isLoading]);

  const renderEmpty = useCallback(() => {
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
  }, [isLoading, error, loadConversations]);

  const keyExtractor = useCallback((item: ConversationPreview) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={styles.separator} />, []);

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
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            renderItem={renderConversation}
            ItemSeparatorComponent={ItemSeparator}
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
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: "hidden",
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
    gap: 8,
  },
  callButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.borderLight,
  },
  videoCallButton: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  unreadBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  threadTouchable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
  // Urgent matches warning styles (Bumble-style)
  urgentWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.2)",
  },
  urgentWarningText: {
    flex: 1,
    gap: 2,
  },
  // Match Queue section
  matchesSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  matchesHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchCountBadge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  matchQueueCard: {
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  // Empty match queue prompt
  emptyMatchPrompt: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyMatchText: {
    flex: 1,
    gap: 2,
  },
});
