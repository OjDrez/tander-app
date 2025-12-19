import colors from '@/src/config/colors';
import FullScreen from '@/src/components/layout/FullScreen';
import AppText from '@/src/components/inputs/AppText';
import LoadingIndicator from '@/src/components/common/LoadingIndicator';
import PeopleYouMayKnowRow from '@/src/components/inbox/PeopleYouMayKnowRow';
import AnimatedConversationRow from '@/src/components/inbox/AnimatedConversationRow';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { useSocketConnection } from '@/src/hooks/useSocket';
import { useInboxData } from '@/src/hooks/useInboxData';
import { registerSocketListener } from '@/src/services/callService';
import { wsService } from '@/src/services/websocket';
import {
  ConversationPreview,
  IncomingCallPayload,
  NewMessagePreviewPayload,
} from '@/src/types/chat';
import { useToast } from '@/src/context/ToastContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isAuthenticated, onlineUsers } = useSocketConnection();
  const { warning } = useToast();

  // Use the consolidated hook for all inbox data - fixes race condition
  const {
    conversations,
    matchQueue,
    urgentMatches,
    matchedUserIds,
    inboxUserIds,
    isLoading,
    isRefreshing,
    error,
    loadData,
    updateConversationPreview,
    isUserMatched,
  } = useInboxData();

  const [searchQuery, setSearchQuery] = useState('');

  // Ref to track if we need to reload due to new conversation
  const needsReloadRef = useRef(false);

  // WebSocket connection is now handled globally by RealTimeProvider
  // No need to connect here - wsService is already managed

  // Load data when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadData();

      // If we had a flag for needing reload (from new conversation), clear it
      if (needsReloadRef.current) {
        needsReloadRef.current = false;
      }
    }, [loadData])
  );

  // WebSocket event listeners
  useEffect(() => {
    // New message preview - update conversation or trigger reload for new conversations
    // Uses wsService.onMessage for global message listening
    const cleanupPreview = wsService.onMessage((payload: any) => {
      if (payload.type !== 'message') return;

      const wasUpdated = updateConversationPreview(
        payload.conversationId,
        payload.conversationId, // roomId might be same as conversationId
        payload.text || payload.content
      );

      // FIX: If conversation wasn't found, it's a new conversation - trigger reload
      if (!wasUpdated) {
        console.log('[InboxScreen] New conversation detected, reloading data');
        needsReloadRef.current = true;
        loadData();
      }
    });

    // Incoming call - FIX: validate match before navigating
    // Uses callService.registerSocketListener which maps to wsService.onCall
    const cleanupIncomingCall = registerSocketListener<IncomingCallPayload>(
      'incoming-call',
      (payload) => {
        // SECURITY FIX: Validate caller is a matched user before showing call UI
        if (!isUserMatched(payload.callerId)) {
          console.warn(
            '[InboxScreen] Incoming call from non-matched user ignored:',
            payload.callerId
          );
          return;
        }

        navigation.navigate('IncomingCallScreen', {
          callerId: payload.callerId,
          callerName: payload.callerName,
          callerUsername: payload.callerUsername,
          callType: payload.callType,
          roomId: payload.roomId,
          callId: payload.callId,
        });
      }
    );

    return () => {
      cleanupPreview();
      cleanupIncomingCall();
    };
  }, [navigation, updateConversationPreview, loadData, isUserMatched]);

  // Filtered conversations - only show conversations where BOTH users have messaged
  const filteredConversations = useMemo(() => {
    // Only show conversations for matches where chat is fully started
    let filtered = conversations.filter((item) => inboxUserIds.has(item.userId));

    // Then apply search filter if present
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [conversations, searchQuery, inboxUserIds]);

  // Total unread count - only count from matched conversations
  const totalUnread = useMemo(() => {
    return filteredConversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  }, [filteredConversations]);

  // Validate match before opening conversation
  const handlePressConversation = useCallback(
    (conversation: ConversationPreview) => {
      // Quick check using local state
      if (!matchedUserIds.has(conversation.userId)) {
        warning('You can only chat with people you have matched with.');
        return;
      }

      navigation.navigate('ConversationScreen', {
        conversationId: parseInt(conversation.id, 10),
        otherUserId: conversation.userId,
        otherUserName: conversation.name,
        avatarUrl: conversation.avatar,
        roomId: conversation.roomId,
      });
    },
    [navigation, matchedUserIds, warning]
  );

  const handlePressAvatar = useCallback(
    (userId: string) => {
      navigation.navigate('ViewProfileScreen', { userId });
    },
    [navigation]
  );

  // Start a chat with a match from the match queue
  const handleStartChat = useCallback(
    (userId: string) => {
      const numericUserId = parseInt(userId, 10);

      if (!matchedUserIds.has(numericUserId)) {
        warning('This match has expired. Keep swiping to find new matches!');
        loadData(); // Refresh the queue
        return;
      }

      // Find the match in the queue for user details
      const matchPerson = matchQueue.find((p) => p.id === userId);

      navigation.navigate('ConversationScreen', {
        conversationId: 0, // Will be created on first message
        otherUserId: numericUserId,
        otherUserName: matchPerson?.name || 'Match',
        avatarUrl: matchPerson?.avatar || '',
        roomId: undefined,
      });
    },
    [navigation, matchedUserIds, matchQueue, loadData, warning]
  );

  // Validate match before video call
  const handleVideoCall = useCallback(
    (conversation: ConversationPreview) => {
      if (!matchedUserIds.has(conversation.userId)) {
        warning('You can only call people you have matched with.');
        return;
      }

      navigation.navigate('VideoCallScreen', {
        userId: conversation.userId,
        username: conversation.name,
        callType: 'video',
      });
    },
    [navigation, matchedUserIds, warning]
  );

  // Validate match before voice call
  const handleVoiceCall = useCallback(
    (conversation: ConversationPreview) => {
      if (!matchedUserIds.has(conversation.userId)) {
        warning('You can only call people you have matched with.');
        return;
      }

      navigation.navigate('VoiceCallScreen', {
        userId: conversation.userId,
        username: conversation.name,
        callType: 'audio',
      });
    },
    [navigation, matchedUserIds, warning]
  );

  const handleRefresh = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const renderConversation = useCallback(
    ({ item, index }: { item: ConversationPreview; index: number }) => {
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
    },
    [onlineUsers, handlePressConversation, handlePressAvatar, handleVideoCall, handleVoiceCall]
  );

  const renderHeader = useCallback(
    () => (
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
              onPress={() => setSearchQuery('')}
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
            onPress={() => navigation.navigate('MyMatchesScreen')}
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
                {urgentMatches.length} {urgentMatches.length > 1 ? 'people are' : 'person is'}{' '}
                waiting to hear from you
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
                onPress={() => navigation.navigate('MyMatchesScreen')}
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
              style={[
                styles.matchQueueCard,
                Platform.OS === 'ios' ? styles.iosShadow : styles.androidShadow,
              ]}
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
            onPress={() => navigation.navigate('MatchesScreen')}
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
    ),
    [
      isAuthenticated,
      searchQuery,
      urgentMatches,
      matchQueue,
      totalUnread,
      navigation,
      handlePressAvatar,
      handleStartChat,
      isLoading,
    ]
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <LoadingIndicator
          variant="inline"
          message="Loading your messages..."
          subtitle="Please wait a moment"
        />
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
            onPress={() => loadData()}
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
          onPress={() => navigation.navigate('MatchesScreen')}
          accessibilityLabel="Find people to chat with"
        >
          <Ionicons name="heart" size={24} color={colors.white} />
          <AppText size="h4" weight="bold" color={colors.white}>
            Find People
          </AppText>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, error, loadData, navigation]);

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
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
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
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    height: 56,
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
  },

  // Urgent warning - very prominent
  urgentWarningLarge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMatchTextLarge: {
    flex: 1,
    gap: 6,
  },

  // Conversations section header
  conversationsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  unreadCountBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
  },

  // Separator
  separator: {
    height: 16,
  },

  // Loading state
  loadingStateLarge: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  loadingText: {
    marginTop: 16,
  },

  // Empty state - large and friendly
  emptyStateLarge: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 24,
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 28,
    fontSize: 17,
  },
  retryButtonLarge: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: colors.primary,
    borderRadius: 20,
    minHeight: 64,
  },
  findPeopleButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
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
