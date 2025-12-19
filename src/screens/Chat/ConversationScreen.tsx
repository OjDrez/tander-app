import MessageBubble from "@/src/components/chat/MessageBubble";
import MessageInputBar from "@/src/components/chat/MessageInputBar";
import ConnectionStatusBanner from "@/src/components/chat/ConnectionStatusBanner";
import MatchExpirationBanner from "@/src/components/chat/MatchExpirationBanner";
import TypingIndicator from "@/src/components/chat/TypingIndicator";
import AppText from "@/src/components/inputs/AppText";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import Screen from "@/src/components/layout/Screen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useChat } from "@/src/hooks/useChat";
import { useSocketConnection } from "@/src/hooks/useSocket";
import { useKeyboardHeight } from "@/src/hooks/useKeyboardHeight";
import {
  getConversationMessages,
  formatMessageTime,
  formatMessageDate,
  getDateLabel,
  checkMatchStatus,
  MatchInfo,
} from "@/src/api/chatApi";
import { ChatListItem, DateSeparator, MessageDisplay, ChatMessage } from "@/src/types/chat";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ConversationScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "ConversationScreen">) {
  const { conversationId, otherUserId, otherUserName, avatarUrl, roomId: providedRoomId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  // Use centralized online presence from useSocketConnection hook (single source of truth)
  const { isConnected, onlineUsers } = useSocketConnection();

  const [messageText, setMessageText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [initialMessages, setInitialMessages] = useState<MessageDisplay[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null); // Message load error state
  const [chatError, setChatError] = useState<string | null>(null); // Dismissable chat error

  // Online status derived from centralized hook - no duplicate listeners needed
  const isUserOnline = useMemo(() => onlineUsers.has(otherUserId), [onlineUsers, otherUserId]);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markAsReadCalledRef = useRef(false); // Prevent multiple markAsRead calls
  const markAsReadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIXED: Use custom keyboard hook with improved animation and LayoutAnimation
  const { keyboardHeight, isKeyboardVisible, animatedKeyboardHeight } = useKeyboardHeight({
    bottomInset: insets.bottom,
    onKeyboardShow: () => {
      // Scroll to end when keyboard opens
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Check match status when screen loads
  useEffect(() => {
    const validateMatch = async () => {
      const info = await checkMatchStatus(otherUserId);
      setMatchInfo(info);

      if (!info.isMatched) {
        setMatchError("You can only chat with users you have matched with.");
      } else if (info.status === "EXPIRED") {
        setMatchError("This match has expired. Keep swiping to find new matches!");
      } else if (info.status === "UNMATCHED") {
        setMatchError("This match is no longer active.");
      }
    };

    validateMatch();
  }, [otherUserId]);

  // Load message history from API with error handling and retry support
  const loadMessageHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      setLoadError(null); // Clear any previous error
      const messages = await getConversationMessages(conversationId);

      // Convert API messages to display format with numeric timestamp for reliable sorting
      const history: MessageDisplay[] = messages.map((msg) => ({
        id: msg.id.toString(),
        text: msg.content,
        time: formatMessageTime(msg.sentAt),
        isOwn: msg.senderId !== otherUserId,
        date: formatMessageDate(msg.sentAt),
        status: msg.status === 'READ' ? 'read' : msg.status === 'DELIVERED' ? 'delivered' : 'sent',
        senderId: msg.senderId,
        timestamp: new Date(msg.sentAt).getTime(), // Numeric timestamp for sorting
      }));

      setInitialMessages(history);
    } catch (err) {
      console.error("[ConversationScreen] Failed to load messages:", err);
      setLoadError("Couldn't load your messages. Tap to try again.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId, otherUserId]);

  useEffect(() => {
    loadMessageHistory();
  }, [loadMessageHistory]);

  // Use chat hook for real-time messaging
  const {
    messages,
    formattedMessages,
    isTyping,
    typingUsername,
    sendMessage,
    setTyping,
    markAsRead,
    retryMessage,
    deleteFailedMessage,
    error,
    roomId,
    isOnline,
    pendingCount,
    hasFailedMessages,
  } = useChat({
    conversationId,
    otherUserId,
    initialMessages,
    providedRoomId, // Pass room ID from backend
    onNewMessage: () => {
      // Scroll to bottom on new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Merge initial messages with real-time messages
  const allMessages = useMemo(() => {
    // Combine and deduplicate by ID
    const messageMap = new Map<string, MessageDisplay>();

    initialMessages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });

    messages.forEach((msg) => {
      messageMap.set(msg.id, msg);
    });

    // Sort by numeric timestamp for reliable ordering
    return Array.from(messageMap.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [initialMessages, messages]);

  // Format messages with date separators
  const displayMessages = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = [];
    let lastDate = "";

    allMessages.forEach((message) => {
      if (message.date !== lastDate) {
        items.push({
          id: `date-${message.date}`,
          type: "date",
          label: getDateLabel(message.date),
        } as DateSeparator);
        lastDate = message.date;
      }
      items.push(message);
    });

    return items;
  }, [allMessages]);

  // Scroll to end when messages change
  useEffect(() => {
    if (displayMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [displayMessages.length]);

  // FIXED: Reset markAsRead ref when conversation changes
  useEffect(() => {
    markAsReadCalledRef.current = false;
  }, [conversationId]);

  // Mark messages as read when viewing - debounced to prevent multiple API calls
  // FIXED: Also mark as read when new messages arrive (not just initial load)
  useEffect(() => {
    // Check if there are unread messages from the other user
    const hasUnreadMessages = allMessages.some(
      (msg) => !msg.isOwn && msg.status !== 'read'
    );

    if (!isLoadingHistory && allMessages.length > 0 && hasUnreadMessages) {
      // Clear any pending timeout
      if (markAsReadTimeoutRef.current) {
        clearTimeout(markAsReadTimeoutRef.current);
      }

      // Small delay ensures socket listeners are fully set up before marking as read
      markAsReadTimeoutRef.current = setTimeout(() => {
        markAsRead();
        console.log('[ConversationScreen] Marked messages as read');
      }, 500);

      return () => {
        if (markAsReadTimeoutRef.current) {
          clearTimeout(markAsReadTimeoutRef.current);
        }
      };
    }
  }, [isLoadingHistory, allMessages, markAsRead]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle text change with typing indicator
  const handleTextChange = (text: string) => {
    setMessageText(text);

    // Send typing indicator
    if (text.length > 0) {
      setTyping(true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        setTyping(false);
      }, 2000);
    } else {
      setTyping(false);
    }
  };

  const handleSend = async () => {
    const text = messageText.trim();
    if (!text) return;

    setMessageText("");
    setTyping(false);
    setChatError(null); // Clear any previous error

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const success = await sendMessage(text);
    if (!success && error) {
      setChatError(error);
      console.error("[ConversationScreen] Failed to send message:", error);
    }
  };

  // Dismiss chat error handler
  const dismissChatError = useCallback(() => {
    setChatError(null);
  }, []);

  const handleVideoCall = () => {
    navigation.navigate("VideoCallScreen", {
      userId: otherUserId,
      username: otherUserName,
      callType: "video",
    });
  };

  const handleVoiceCall = () => {
    navigation.navigate("VoiceCallScreen", {
      userId: otherUserId,
      username: otherUserName,
      callType: "audio",
    });
  };

  // Handle retry failed message
  const handleRetryMessage = useCallback(async (messageId: string) => {
    await retryMessage(messageId);
  }, [retryMessage]);

  // Handle delete failed message
  const handleDeleteMessage = useCallback((messageId: string) => {
    deleteFailedMessage(messageId);
  }, [deleteFailedMessage]);

  const renderItem = ({ item }: { item: ChatListItem }) => {
    if ((item as DateSeparator).type === "date") {
      const dateItem = item as DateSeparator;
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.separatorLine} />
          <AppText size="tiny" weight="medium" color={colors.textSecondary}>
            {dateItem.label}
          </AppText>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const msg = item as MessageDisplay;
    return (
      <MessageBubble
        text={msg.text}
        time={msg.time}
        isOwn={msg.isOwn}
        status={msg.status}
        onRetry={msg.status === "failed" ? () => handleRetryMessage(msg.id) : undefined}
        onDelete={msg.status === "failed" ? () => handleDeleteMessage(msg.id) : undefined}
      />
    );
  };

  return (
    <Screen backgroundColor={colors.white}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.flex,
            { paddingBottom: animatedKeyboardHeight },
          ]}
        >
          <View style={styles.contentWrapper}>
            {/* SENIOR-FRIENDLY: Large, clear header with user info */}
            <View style={styles.chatHeader}>
              {/* Back button - large and labeled */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Go back to messages"
              >
                <Ionicons name="arrow-back" size={28} color={colors.textPrimary} />
                <AppText size="body" weight="semibold" color={colors.textPrimary}>
                  Back
                </AppText>
              </TouchableOpacity>

              {/* User info - large avatar and name */}
              <TouchableOpacity
                style={styles.headerUserRow}
                onPress={() => navigation.navigate("ViewProfileScreen", { userId: otherUserId.toString() })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`View ${otherUserName}'s profile. They are currently ${isUserOnline ? "online" : "offline"}`}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={{
                      uri: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=random`,
                    }}
                    style={styles.avatar}
                  />
                  {isUserOnline && (
                    <View style={styles.onlineIndicator}>
                      <View style={styles.onlineDot} />
                    </View>
                  )}
                </View>
                <View style={styles.userInfoContainer}>
                  <AppText
                    weight="bold"
                    size="h3"
                    color={colors.textPrimary}
                    numberOfLines={1}
                  >
                    {otherUserName}
                  </AppText>
                  <View style={[styles.statusBadge, isUserOnline ? styles.onlineBadge : styles.offlineBadge]}>
                    <View style={[styles.statusDot, isUserOnline ? styles.statusDotOnline : styles.statusDotOffline]} />
                    <AppText size="body" weight="bold" color={isUserOnline ? colors.success : colors.textPrimary}>
                      {isTyping ? "Typing a message..." : isUserOnline ? "Online now" : "Offline"}
                    </AppText>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Call buttons - large and labeled, in a separate row */}
            <View style={styles.callActionsRow}>
              <TouchableOpacity
                style={styles.callActionButton}
                onPress={handleVoiceCall}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Call ${otherUserName} on the phone`}
              >
                <Ionicons name="call" size={26} color={colors.primary} />
                <AppText size="body" weight="semibold" color={colors.primary}>
                  Voice Call
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callActionButton, styles.videoCallAction]}
                onPress={handleVideoCall}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`Start a video call with ${otherUserName}`}
              >
                <Ionicons name="videocam" size={26} color={colors.white} />
                <AppText size="body" weight="semibold" color={colors.white}>
                  Video Call
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Match Error State */}
            {matchError && (
              <View style={styles.matchErrorContainer}>
                <Ionicons name="heart-dislike-outline" size={64} color={colors.textMuted} />
                <AppText size="h4" weight="semibold" color={colors.textPrimary} style={styles.matchErrorTitle}>
                  Cannot Start Chat
                </AppText>
                <AppText size="body" color={colors.textSecondary} style={styles.matchErrorText}>
                  {matchError}
                </AppText>
                <TouchableOpacity
                  style={styles.matchErrorButton}
                  onPress={() => navigation.goBack()}
                  accessibilityRole="button"
                  accessibilityLabel="Go back"
                >
                  <AppText size="body" weight="semibold" color={colors.primary}>
                    Go Back
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            {/* Expiration Warning Banner */}
            {!matchError && matchInfo && (
              <MatchExpirationBanner
                hoursUntilExpiration={matchInfo.hoursUntilExpiration}
                chatStarted={matchInfo.chatStarted}
              />
            )}

            {isLoadingHistory && !matchError ? (
              <LoadingIndicator
                variant="inline"
                message="Loading your messages"
                subtitle="Please wait a moment..."
              />
            ) : loadError && !matchError ? (
              // FIXED: Show error state with retry button
              <View style={styles.loadingContainer}>
                <Ionicons name="cloud-offline-outline" size={64} color={colors.textMuted} />
                <AppText size="h4" weight="medium" color={colors.textPrimary} style={styles.loadingText}>
                  Couldn't Load Messages
                </AppText>
                <AppText size="body" color={colors.textSecondary} style={styles.loadErrorText}>
                  {loadError}
                </AppText>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={loadMessageHistory}
                  accessibilityRole="button"
                  accessibilityLabel="Tap to try loading messages again"
                >
                  <Ionicons name="refresh" size={24} color={colors.white} />
                  <AppText size="body" weight="semibold" color={colors.white}>
                    Try Again
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : !matchError ? (
              <FlatList
                ref={flatListRef}
                data={displayMessages}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => {
                  flatListRef.current?.scrollToEnd({ animated: false });
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <View style={styles.emptyIconCircle}>
                      <Ionicons name="chatbubble-ellipses-outline" size={64} color={colors.accentTeal} />
                    </View>
                    <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyText}>
                      Say Hello!
                    </AppText>
                    <AppText size="body" color={colors.textSecondary} style={styles.emptySubtext}>
                      This is the start of your conversation with {otherUserName}.
                    </AppText>
                    <AppText size="body" color={colors.textSecondary} style={styles.emptyHint}>
                      Type a message below to begin chatting.
                    </AppText>
                  </View>
                }
              />
            ) : null}

            {/* Connection status banner */}
            <ConnectionStatusBanner isOnline={isOnline} pendingCount={pendingCount} />

            {/* Typing indicator - extracted to separate component */}
            <TypingIndicator
              isTyping={isTyping}
              typingUsername={typingUsername}
              otherUserName={otherUserName}
            />

            {/* FIXED: Chat error banner with working dismiss button */}
            {(chatError || error) && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={20} color={colors.danger} />
                <AppText size="body" color={colors.danger} style={styles.errorText}>
                  {chatError || error}
                </AppText>
                <TouchableOpacity
                  onPress={dismissChatError}
                  style={styles.errorDismiss}
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss error message"
                >
                  <Ionicons name="close-circle" size={24} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}

            {/* Failed messages warning */}
            {hasFailedMessages && (
              <View style={styles.failedMessagesBanner}>
                <Ionicons name="warning" size={16} color={colors.warning} />
                <AppText size="small" color={colors.textPrimary}>
                  Some messages failed to send. Tap to retry.
                </AppText>
              </View>
            )}

            {/* Only show input if match is valid */}
            {!matchError && (
              <View
                style={[
                  styles.inputContainer,
                  { paddingBottom: isKeyboardVisible ? 10 : Math.max(insets.bottom, 10) },
                ]}
              >
                <MessageInputBar
                  value={messageText}
                  onChangeText={handleTextChange}
                  onSend={handleSend}
                  placeholder={`Message ${otherUserName}...`}
                />
              </View>
            )}
          </View>
        </Animated.View>
      </LinearGradient>
    </Screen>
  );
}

/**
 * ConversationScreen Styles - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Very large avatar (72px) for clear identification
 * - Minimum 56px touch targets (larger than standard)
 * - Large, readable text throughout
 * - Clear visual separation between elements
 * - Labeled buttons (not just icons)
 * - High contrast status indicators
 * - Simple, uncluttered layout
 */
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },

  contentWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    marginTop: 8,
  },

  // Chat header - SENIOR-FRIENDLY
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: 12,
  },

  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    minHeight: 56,
  },

  headerUserRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 56,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    height: 72,
    width: 72,
    borderRadius: 36,
    backgroundColor: colors.borderLight,
  },

  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },

  onlineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
  },

  userInfoContainer: {
    flex: 1,
    gap: 6,
  },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  onlineBadge: {
    backgroundColor: colors.successLight,
  },

  offlineBadge: {
    backgroundColor: colors.backgroundLight,
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  statusDotOnline: {
    backgroundColor: colors.success,
  },

  statusDotOffline: {
    backgroundColor: colors.textMuted,
  },

  // Call actions row - SENIOR-FRIENDLY: Large labeled buttons
  callActionsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.backgroundLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },

  callActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  videoCallAction: {
    backgroundColor: colors.accentTeal,
    borderColor: colors.accentTeal,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingVertical: 60,
  },

  loadingText: {
    marginTop: 16,
  },

  loadErrorText: {
    textAlign: "center",
    paddingHorizontal: 24,
    marginTop: 8,
  },

  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 32,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 56,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 16,
    flexGrow: 1,
  },

  // Empty state - SENIOR-FRIENDLY
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    gap: 16,
  },

  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyText: {
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtext: {
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 26,
  },

  emptyHint: {
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 26,
    marginTop: 8,
    fontStyle: "italic",
  },

  // Date separator - SENIOR-FRIENDLY
  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginVertical: 20,
    paddingVertical: 12,
  },

  separatorLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderMedium,
  },

  // NOTE: Connection status banner styles moved to ConnectionStatusBanner.tsx
  // NOTE: Typing indicator styles moved to TypingIndicator.tsx
  // NOTE: Match expiration banner styles moved to MatchExpirationBanner.tsx

  // Error banner - SENIOR-FRIENDLY
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.danger,
    gap: 14,
  },

  errorText: {
    flex: 1,
  },

  errorDismiss: {
    padding: 8,
  },

  failedMessagesBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.warningLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },

  inputContainer: {
    backgroundColor: colors.white,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.borderLight,
  },

  // Match error styles - SENIOR-FRIENDLY
  matchErrorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
    gap: 20,
  },

  matchErrorTitle: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 24,
  },

  matchErrorText: {
    textAlign: "center",
    lineHeight: 28,
    fontSize: 18,
  },

  matchErrorButton: {
    marginTop: 24,
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: colors.backgroundLight,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: colors.primary,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  // NOTE: Expiration warning styles moved to MatchExpirationBanner.tsx
});
