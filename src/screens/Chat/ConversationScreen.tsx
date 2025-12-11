import MessageBubble from "@/src/components/chat/MessageBubble";
import MessageInputBar from "@/src/components/chat/MessageInputBar";
import AppText from "@/src/components/inputs/AppText";
import Screen from "@/src/components/layout/Screen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useChat } from "@/src/hooks/useChat";
import { useSocketConnection } from "@/src/hooks/useSocket";
import { getConversationMessages, formatMessageTime, formatMessageDate, getDateLabel } from "@/src/api/chatApi";
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
  FlatList,
  Image,
  KeyboardAvoidingView,
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
  const { onlineUsers } = useSocketConnection();

  const [messageText, setMessageText] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [initialMessages, setInitialMessages] = useState<MessageDisplay[]>([]);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = onlineUsers.has(otherUserId);

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
    error,
    roomId,
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
            <AppHeader
              onBackPress={() => navigation.goBack()}
              centerContent={
                <TouchableOpacity
                  style={styles.headerUserRow}
                  onPress={() => navigation.navigate("DashboardScreen", { userId: otherUserId.toString() })}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`${otherUserName}'s profile, ${isOnline ? "online now" : "offline"}`}
                  accessibilityHint="Double tap to view their profile"
                >
                  <View style={styles.avatarContainer}>
                    <Image
                      source={{
                        uri: avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUserName)}&background=random`,
                      }}
                      style={styles.avatar}
                    />
                    {isOnline && <View style={styles.onlineIndicator} accessibilityLabel="Online now" />}
                  </View>
                  <View>
                    <AppText
                      weight="bold"
                      size="h4"
                      color={colors.textPrimary}
                    >
                      {otherUserName}
                    </AppText>
                    <AppText size="small" color={isOnline ? colors.success : colors.textSecondary}>
                      {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
                    </AppText>
                  </View>
                </TouchableOpacity>
              }
              rightContent={
                <View style={styles.headerActions}>
                  <TouchableOpacity
                    style={styles.headerButton}
                    onPress={handleVoiceCall}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Voice call ${otherUserName}`}
                    accessibilityHint="Double tap to start a voice call"
                  >
                    <Ionicons name="call" size={22} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.headerButton, styles.videoButton]}
                    onPress={handleVideoCall}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Video call ${otherUserName}`}
                    accessibilityHint="Double tap to start a video call"
                  >
                    <Ionicons name="videocam" size={22} color={colors.white} />
                  </TouchableOpacity>
                </View>
              }
            />

            {isLoadingHistory ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <AppText size="small" color={colors.textSecondary} style={styles.loadingText}>
                  Loading messages...
                </AppText>
              </View>
            ) : (
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
                    <Ionicons name="chatbubble-ellipses-outline" size={48} color={colors.textMuted} />
                    <AppText size="body" weight="medium" color={colors.textSecondary} style={styles.emptyText}>
                      Start the conversation!
                    </AppText>
                    <AppText size="small" color={colors.textMuted} style={styles.emptySubtext}>
                      Say hello to {otherUserName}
                    </AppText>
                  </View>
                }
              />
            )}

            {isTyping && (
              <View style={styles.typingIndicator}>
                <AppText size="tiny" color={colors.textSecondary}>
                  {typingUsername || otherUserName} is typing...
                </AppText>
              </View>
            )}

            {error && (
              <View style={styles.errorBanner}>
                <AppText size="tiny" color={colors.danger}>
                  {error}
                </AppText>
              </View>
            )}

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
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Screen>
  );
}

/**
 * ConversationScreen Styles
 *
 * Accessibility Optimizations:
 * - Larger avatar (52px) for better visibility
 * - Minimum 48px touch targets for call buttons
 * - Increased spacing between messages
 * - Larger online indicator (14px)
 * - Enhanced text sizes
 */
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },

  contentWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    marginTop: 6,
  },

  headerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    // Minimum touch target
    minHeight: 48,
    paddingVertical: 4,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    // Larger avatar for better visibility
    height: 52,
    width: 52,
    borderRadius: 26,
    backgroundColor: colors.borderLight,
  },

  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    // Larger indicator for visibility
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 3,
    borderColor: colors.white,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 6,
  },

  headerButton: {
    // Minimum 48px touch target for accessibility
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.backgroundLight,
    alignItems: "center",
    justifyContent: "center",
  },

  videoButton: {
    backgroundColor: colors.accentTeal,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },

  loadingText: {
    marginTop: 12,
  },

  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12, // Increased spacing between messages
    flexGrow: 1,
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },

  emptyText: {
    marginTop: 12,
  },

  emptySubtext: {
    textAlign: "center",
    paddingHorizontal: 32,
  },

  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginVertical: 12, // More spacing around date separators
    paddingVertical: 8,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderMedium,
  },

  typingIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: colors.backgroundLight,
  },

  errorBanner: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },

  inputContainer: {
    backgroundColor: colors.white,
    paddingTop: 8,
  },
});
