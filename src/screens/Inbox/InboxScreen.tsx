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
// SENIOR-FRIENDLY: Large touch targets, clear text, simple layout
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
        hasUnread && styles.threadCardUnread,
        Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.threadTouchable}
        activeOpacity={0.7}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${item.name}${hasUnread ? `. You have ${item.unreadCount} new message${item.unreadCount > 1 ? 's' : ''}` : ""}${isOnline ? ". They are online now" : ""}`}
        accessibilityHint="Tap to read and reply to messages"
      >
        {/* Large avatar with online status */}
        <TouchableOpacity
          style={[styles.avatarWrapper, Platform.OS === "ios" ? styles.iosShadow : styles.androidShadow]}
          activeOpacity={0.7}
          onPress={onAvatarPress}
          accessibilityRole="button"
          accessibilityLabel={`View ${item.name}'s profile photo`}
        >
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          {isOnline && (
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineDot} />
            </View>
          )}
        </TouchableOpacity>

        {/* Name and message preview */}
        <View style={styles.threadBody}>
          <View style={styles.threadTopRow}>
            <View style={styles.nameRow}>
              <AppText size="h3" weight="bold" numberOfLines={1} style={styles.name}>
                {item.name}
              </AppText>
              {isOnline && (
                <AppText size="small" weight="semibold" color={colors.success} style={styles.onlineText}>
                  Online
                </AppText>
              )}
            </View>
            <AppText size="body" color={colors.textSecondary} weight="medium">
              {item.timestamp}
            </AppText>
          </View>

          <AppText
            size="body"
            color={hasUnread ? colors.textPrimary : colors.textSecondary}
            weight={hasUnread ? "bold" : "normal"}
            numberOfLines={2}
            style={styles.preview}
          >
            {hasUnread ? "● " : ""}{item.message}
          </AppText>

          {/* Unread count badge - more prominent */}
          {hasUnread && (
            <View style={styles.unreadRow}>
              <View style={styles.unreadBadgeLarge}>
                <AppText size="body" weight="bold" color={colors.white}>
                  {item.unreadCount} NEW
                </AppText>
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Call buttons - larger and clearly labeled */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.callButtonLarge}
          onPress={onVoiceCall}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Call ${item.name}`}
          accessibilityHint="Tap to make a voice call"
        >
          <Ionicons name="call" size={24} color={colors.primary} />
          <AppText size="small" weight="semibold" color={colors.primary}>
            Call
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.callButtonLarge, styles.videoCallButtonLarge]}
          onPress={onVideoCall}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Video call ${item.name}`}
          accessibilityHint="Tap to make a video call"
        >
          <Ionicons name="videocam" size={24} color={colors.white} />
          <AppText size="small" weight="semibold" color={colors.white}>
            Video
          </AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.messageButton}
          onPress={onPress}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Message ${item.name}`}
        >
          <Ionicons name="chatbubble" size={24} color={colors.accentTeal} />
          <AppText size="small" weight="semibold" color={colors.accentTeal}>
            Message
          </AppText>
        </TouchableOpacity>
      </View>
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
      {/* Welcome section - clear and friendly */}
      <View style={styles.welcomeSection}>
        <AppText size="h1" weight="bold" style={styles.title}>
          Your Messages
        </AppText>
        <AppText size="h4" color={colors.textSecondary} style={styles.subtitle}>
          Tap on a person to chat with them
        </AppText>
      </View>

      {/* Connection status - very visible */}
      {!isAuthenticated && (
        <View style={styles.connectionStatusLarge}>
          <Ionicons name="cloud-offline" size={28} color={colors.error} />
          <View style={styles.connectionTextContainer}>
            <AppText size="h4" weight="bold" color={colors.error}>
              You are offline
            </AppText>
            <AppText size="body" color={colors.textSecondary}>
              Messages will send when you reconnect
            </AppText>
          </View>
        </View>
      )}

      {/* Simple search bar */}
      <View style={styles.searchBar} accessibilityRole="search">
        <Ionicons name="search" size={26} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          selectionColor={colors.primary}
          accessibilityLabel="Search for a person"
          accessibilityHint="Type a name to find their conversation"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchQuery("")}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Urgent Matches Warning - very prominent for seniors */}
      {urgentMatches.length > 0 && (
        <TouchableOpacity
          style={styles.urgentWarningLarge}
          onPress={() => navigation.navigate("MyMatchesScreen")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Important: ${urgentMatches.length} matches expiring soon. Tap to view.`}
        >
          <View style={styles.urgentIconContainer}>
            <Ionicons name="alert-circle" size={36} color={colors.white} />
          </View>
          <View style={styles.urgentWarningTextLarge}>
            <AppText size="h4" weight="bold" color={colors.error}>
              ⏰ Time is running out!
            </AppText>
            <AppText size="body" weight="medium" color={colors.textPrimary}>
              {urgentMatches.length} {urgentMatches.length > 1 ? "people are" : "person is"} waiting to hear from you
            </AppText>
            <AppText size="body" color={colors.textSecondary}>
              Tap here to start chatting
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={28} color={colors.error} />
        </TouchableOpacity>
      )}

      {/* New Matches Section - clearer for seniors */}
      {matchQueue.length > 0 && (
        <View style={styles.newMatchesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="heart" size={24} color={colors.primary} />
              <AppText size="h3" weight="bold" color={colors.textPrimary}>
                New Matches
              </AppText>
              <View style={styles.matchCountBadgeLarge}>
                <AppText size="body" weight="bold" color={colors.white}>
                  {matchQueue.length}
                </AppText>
              </View>
            </View>
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => navigation.navigate("MyMatchesScreen")}
              accessibilityRole="button"
              accessibilityLabel="View all your matches"
            >
              <AppText size="body" weight="bold" color={colors.primary}>
                See All
              </AppText>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <AppText size="body" color={colors.textSecondary} style={styles.sectionHint}>
            These people want to talk to you! Tap to start chatting.
          </AppText>
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

      {/* Empty state - friendly and encouraging */}
      {matchQueue.length === 0 && !isLoading && (
        <TouchableOpacity
          style={styles.emptyMatchPromptLarge}
          onPress={() => navigation.navigate("MatchesScreen")}
          activeOpacity={0.7}
          accessibilityLabel="Find new people to match with"
        >
          <View style={styles.emptyMatchIconContainer}>
            <Ionicons name="heart-outline" size={48} color={colors.primary} />
          </View>
          <View style={styles.emptyMatchTextLarge}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              Looking for someone to chat with?
            </AppText>
            <AppText size="body" color={colors.textSecondary}>
              Tap here to find new people
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={28} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Conversations section header */}
      <View style={styles.conversationsSectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Ionicons name="chatbubbles" size={24} color={colors.accentTeal} />
          <AppText size="h3" weight="bold" color={colors.textPrimary}>
            Your Conversations
          </AppText>
        </View>
        {totalUnread > 0 && (
          <View style={styles.unreadCountBadge}>
            <AppText size="body" weight="bold" color={colors.white}>
              {totalUnread} new
            </AppText>
          </View>
        )}
      </View>
    </View>
  ), [isAuthenticated, searchQuery, urgentMatches, matchQueue, totalUnread, filteredConversations.length, navigation, handlePressAvatar, handleStartChat, isLoading]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingStateLarge}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="h4" weight="medium" color={colors.textSecondary} style={styles.loadingText}>
            Loading your messages...
          </AppText>
          <AppText size="body" color={colors.textMuted}>
            Please wait a moment
          </AppText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateLarge}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={64} color={colors.error} />
          </View>
          <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
            Something went wrong
          </AppText>
          <AppText size="body" color={colors.textSecondary} style={styles.emptySubtitle}>
            We couldn't load your messages. Please try again.
          </AppText>
          <TouchableOpacity
            style={styles.retryButtonLarge}
            onPress={() => loadConversations()}
            accessibilityLabel="Try loading messages again"
          >
            <Ionicons name="refresh" size={24} color={colors.white} />
            <AppText size="h4" weight="bold" color={colors.white}>
              Try Again
            </AppText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateLarge}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="chatbubbles-outline" size={80} color={colors.accentTeal} />
        </View>
        <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
          No messages yet
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.emptySubtitle}>
          When you match with someone and start chatting, your conversations will appear here.
        </AppText>
        <TouchableOpacity
          style={styles.findPeopleButton}
          onPress={() => navigation.navigate("MatchesScreen")}
          accessibilityLabel="Find people to chat with"
        >
          <Ionicons name="heart" size={24} color={colors.white} />
          <AppText size="h4" weight="bold" color={colors.white}>
            Find People
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, error, loadConversations, navigation]);

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
 * InboxScreen Styles - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Minimum touch targets of 56x56px (larger than standard 48px)
 * - Large, readable fonts (minimum 18px)
 * - High contrast colors with clear visual hierarchy
 * - Generous spacing between interactive elements
 * - Clear labels on all buttons (icons + text)
 * - Simple, uncluttered layout
 * - Obvious visual feedback on interactions
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
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  headerSection: {
    gap: 20,
    marginBottom: 20,
  },

  // Welcome section - clear and prominent
  welcomeSection: {
    gap: 8,
    paddingBottom: 8,
  },
  title: {
    letterSpacing: -0.5,
    fontSize: 32,
  },
  subtitle: {
    lineHeight: 28,
    fontSize: 18,
  },

  // Connection status - very visible for offline state
  connectionStatusLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.errorLight,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.error,
  },
  connectionTextContainer: {
    flex: 1,
    gap: 4,
  },

  // Search bar - larger and simpler
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    height: 64,
    gap: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 20,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearSearchButton: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  // Urgent warning - very prominent
  urgentWarningLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.errorLight,
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.error,
  },
  urgentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
  },
  urgentWarningTextLarge: {
    flex: 1,
    gap: 6,
  },

  // New matches section
  newMatchesSection: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionHint: {
    lineHeight: 24,
    marginBottom: 8,
  },
  matchCountBadgeLarge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.accentPeach,
    borderRadius: 16,
  },
  matchQueueCard: {
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },

  // Empty match prompt - larger and clearer
  emptyMatchPromptLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },
  emptyMatchIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentPeach,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyMatchTextLarge: {
    flex: 1,
    gap: 6,
  },

  // Conversations section header
  conversationsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  unreadCountBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },

  // Thread card - much larger and clearer
  threadCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.borderLight,
    overflow: "hidden",
    gap: 16,
  },
  threadCardUnread: {
    borderColor: colors.primary,
    borderWidth: 3,
    backgroundColor: colors.accentPeach,
  },
  threadTouchable: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },

  // Avatar - much larger
  avatarWrapper: {
    height: 80,
    width: 80,
    borderRadius: 40,
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
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },
  onlineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.success,
  },

  // Thread body - larger text
  threadBody: {
    flex: 1,
    gap: 10,
  },
  threadTopRow: {
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 22,
  },
  onlineText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.successLight,
    borderRadius: 10,
    overflow: "hidden",
  },
  preview: {
    lineHeight: 26,
    fontSize: 17,
  },
  unreadRow: {
    marginTop: 8,
  },
  unreadBadgeLarge: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },

  // Action buttons row - large labeled buttons
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 16,
    marginTop: 4,
  },
  callButtonLarge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  videoCallButtonLarge: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },
  messageButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentMint,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },

  // Separator
  separator: {
    height: 16,
  },

  // Loading state
  loadingStateLarge: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  loadingText: {
    marginTop: 16,
  },

  // Empty state - large and friendly
  emptyStateLarge: {
    paddingVertical: 80,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: "center",
    fontSize: 24,
  },
  emptySubtitle: {
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 28,
    fontSize: 17,
  },
  retryButtonLarge: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: colors.primary,
    borderRadius: 20,
    minHeight: 64,
  },
  findPeopleButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: colors.accentTeal,
    borderRadius: 20,
    minHeight: 64,
  },

  // Shadows
  iosShadow: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  androidShadow: {
    elevation: 4,
  },
});
