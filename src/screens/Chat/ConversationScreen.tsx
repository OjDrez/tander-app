import MessageBubble from "@/src/components/chat/MessageBubble";
import MessageInputBar from "@/src/components/chat/MessageInputBar";
import AppText from "@/src/components/inputs/AppText";
import Screen from "@/src/components/layout/Screen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useChat } from "@/src/hooks/useChat";
import { useSocketConnection } from "@/src/hooks/useSocket";
import {
  getConversationMessages,
  formatMessageTime,
  formatMessageDate,
  getDateLabel,
  checkMatchStatus,
  getExpirationWarning,
  MatchInfo,
} from "@/src/api/chatApi";
import { ChatListItem, DateSeparator, MessageDisplay } from "@/src/types/chat";
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
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Connection status banner component - SENIOR-FRIENDLY: Larger, clearer messaging
const ConnectionStatusBanner = ({ isOnline, pendingCount }: { isOnline: boolean; pendingCount: number }) => {
  const slideAnim = useRef(new Animated.Value(isOnline ? -80 : 0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline && pendingCount === 0 ? -80 : 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isOnline, pendingCount, slideAnim]);

  if (isOnline && pendingCount === 0) return null;

  return (
    <Animated.View
      style={[
        styles.connectionBanner,
        { transform: [{ translateY: slideAnim }] },
        !isOnline ? styles.offlineBanner : styles.pendingBanner,
      ]}
      accessibilityRole="alert"
      accessibilityLabel={!isOnline ? "You are offline. Your messages will be sent when you reconnect to the internet." : `${pendingCount} messages are waiting to be sent.`}
    >
      <View style={styles.connectionIconContainer}>
        <Ionicons
          name={!isOnline ? "cloud-offline" : "time-outline"}
          size={28}
          color={colors.white}
        />
      </View>
      <View style={styles.connectionTextContainer}>
        <AppText size="body" weight="bold" color={colors.white}>
          {!isOnline ? "You're offline" : "Sending messages..."}
        </AppText>
        <AppText size="body" weight="medium" color={colors.white}>
          {!isOnline
            ? "Messages will send when you're back online"
            : `${pendingCount} message${pendingCount > 1 ? "s" : ""} waiting`}
        </AppText>
      </View>
    </Animated.View>
  );
};

// Match expiration warning banner - SENIOR-FRIENDLY: Larger, clearer warning
const MatchExpirationBanner = ({
  hoursUntilExpiration,
  chatStarted,
}: {
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
}) => {
  const warningMessage = getExpirationWarning(hoursUntilExpiration);

  // Don't show warning if chat has started (match won't expire)
  if (chatStarted || !warningMessage) return null;

  const isUrgent = hoursUntilExpiration !== undefined && hoursUntilExpiration <= 6;

  return (
    <View
      style={[styles.expirationBanner, isUrgent && styles.expirationBannerUrgent]}
      accessibilityRole="alert"
      accessibilityLabel={`Time reminder: ${warningMessage}`}
    >
      <View style={[styles.expirationIconContainer, isUrgent && styles.expirationIconUrgent]}>
        <Ionicons name="time" size={28} color={isUrgent ? colors.white : colors.warning} />
      </View>
      <View style={styles.expirationTextContainer}>
        <AppText size="body" weight="bold" color={isUrgent ? colors.error : colors.textPrimary}>
          {isUrgent ? "⏰ Time running out!" : "Reminder"}
        </AppText>
        <AppText size="body" color={colors.textPrimary} style={styles.expirationText}>
          {warningMessage}
        </AppText>
      </View>
    </View>
  );
};

export default function ConversationScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "ConversationScreen">) {
  const { conversationId, otherUserId, otherUserName, avatarUrl, roomId: providedRoomId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();
  const { onlineUsers } = useSocketConnection();

  const [messageText, setMessageText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [initialMessages, setInitialMessages] = useState<MessageDisplay[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isUserOnline = onlineUsers.has(otherUserId);

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

  // Load message history from API
  const loadMessageHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const messages = await getConversationMessages(conversationId);

      // Get current user ID from the first message comparison or default to checking isOwn
      const history: MessageDisplay[] = messages.map((msg) => ({
        id: msg.id.toString(),
        text: msg.content,
        time: formatMessageTime(msg.sentAt),
        isOwn: msg.senderId !== otherUserId,
        date: formatMessageDate(msg.sentAt),
        status: msg.status === 'READ' ? 'read' : msg.status === 'DELIVERED' ? 'delivered' : 'sent',
        senderId: msg.senderId,
      }));

      setInitialMessages(history);
    } catch (err) {
      console.error("[ConversationScreen] Failed to load messages:", err);
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

    return Array.from(messageMap.values()).sort(
      (a, b) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
    );
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

  // Mark messages as read when viewing
  useEffect(() => {
    if (!isLoadingHistory && allMessages.length > 0) {
      markAsRead();
    }
  }, [isLoadingHistory, markAsRead]);

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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const success = await sendMessage(text);
    if (!success) {
      console.error("[ConversationScreen] Failed to send message");
    }
  };

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
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top + 8}
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
                    <AppText size="small" weight="semibold" color={isUserOnline ? colors.success : colors.textSecondary}>
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
                  Can't Start Chat
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
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText size="small" color={colors.textSecondary} style={styles.loadingText}>
                  Loading messages...
                </AppText>
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

            {/* Typing indicator - SENIOR-FRIENDLY: Larger and clearer */}
            {isTyping && (
              <View style={styles.typingIndicatorLarge}>
                <View style={styles.typingDots}>
                  <View style={[styles.typingDot, styles.typingDot1]} />
                  <View style={[styles.typingDot, styles.typingDot2]} />
                  <View style={[styles.typingDot, styles.typingDot3]} />
                </View>
                <AppText size="body" weight="medium" color={colors.textPrimary}>
                  {typingUsername || otherUserName} is typing a message...
                </AppText>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                <AppText size="small" color={colors.danger} style={styles.errorText}>
                  {error}
                </AppText>
                <TouchableOpacity
                  onPress={() => {/* Could add a dismiss or retry action */}}
                  style={styles.errorDismiss}
                >
                  <Ionicons name="close" size={18} color={colors.danger} />
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
                  { paddingBottom: Math.max(insets.bottom, 10) },
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
        </KeyboardAvoidingView>
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

  // Connection status banner - SENIOR-FRIENDLY
  connectionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
  },

  connectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  connectionTextContainer: {
    flex: 1,
    gap: 4,
  },

  offlineBanner: {
    backgroundColor: colors.textSecondary,
  },

  pendingBanner: {
    backgroundColor: colors.accentTeal,
  },

  // Typing indicator - SENIOR-FRIENDLY
  typingIndicatorLarge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: colors.accentMint,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },

  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  typingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentTeal,
  },

  typingDot1: {
    opacity: 0.4,
  },

  typingDot2: {
    opacity: 0.6,
  },

  typingDot3: {
    opacity: 0.8,
  },

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

  // Expiration warning styles - SENIOR-FRIENDLY
  expirationBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: colors.warningLight,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.warning,
  },

  expirationBannerUrgent: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },

  expirationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.warningLight,
    alignItems: "center",
    justifyContent: "center",
  },

  expirationIconUrgent: {
    backgroundColor: colors.error,
  },

  expirationTextContainer: {
    flex: 1,
    gap: 4,
  },

  expirationText: {
    lineHeight: 24,
  },
});
