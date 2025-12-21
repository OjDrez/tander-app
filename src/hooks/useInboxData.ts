import { useCallback, useReducer, useRef } from 'react';
import { getConversations, getFullPhotoUrl } from '@/src/api/chatApi';
import { matchingApi } from '@/src/api/matchingApi';
import { ConversationPreview } from '@/src/types/chat';
import { Match } from '@/src/types/matching';

/**
 * Match queue person for display in the match queue
 */
export type MatchQueuePerson = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  userId?: number;
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
};

/**
 * Inbox data state shape
 */
interface InboxState {
  conversations: ConversationPreview[];
  matchQueue: MatchQueuePerson[];
  urgentMatches: Match[];
  matchedUserIds: Set<number>;
  inboxUserIds: Set<number>;
  status: 'idle' | 'loading' | 'refreshing' | 'success' | 'error';
  error: string | null;
}

/**
 * Actions for the inbox reducer
 */
type InboxAction =
  | { type: 'LOAD_START' }
  | { type: 'REFRESH_START' }
  | { type: 'LOAD_SUCCESS'; payload: LoadSuccessPayload }
  | { type: 'LOAD_ERROR'; payload: string }
  | { type: 'UPDATE_CONVERSATION'; payload: UpdateConversationPayload }
  | { type: 'ADD_CONVERSATION'; payload: ConversationPreview }
  | { type: 'CLEAR_ERROR' };

interface LoadSuccessPayload {
  conversations: ConversationPreview[];
  matchQueue: MatchQueuePerson[];
  urgentMatches: Match[];
  matchedUserIds: Set<number>;
  inboxUserIds: Set<number>;
}

interface UpdateConversationPayload {
  conversationId: string;
  roomId?: string;
  message: string;
  timestamp: string;
}

const initialState: InboxState = {
  conversations: [],
  matchQueue: [],
  urgentMatches: [],
  matchedUserIds: new Set(),
  inboxUserIds: new Set(),
  status: 'idle',
  error: null,
};

/**
 * Reducer for inbox state management
 */
function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case 'LOAD_START':
      return {
        ...state,
        status: 'loading',
        error: null,
      };

    case 'REFRESH_START':
      return {
        ...state,
        status: 'refreshing',
        error: null,
      };

    case 'LOAD_SUCCESS':
      return {
        ...state,
        status: 'success',
        error: null,
        conversations: action.payload.conversations,
        matchQueue: action.payload.matchQueue,
        urgentMatches: action.payload.urgentMatches,
        matchedUserIds: action.payload.matchedUserIds,
        inboxUserIds: action.payload.inboxUserIds,
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload,
      };

    case 'UPDATE_CONVERSATION': {
      const { conversationId, roomId, message, timestamp } = action.payload;
      const existingIndex = state.conversations.findIndex(
        (item) => item.roomId === roomId || item.id === conversationId
      );

      if (existingIndex === -1) {
        // Conversation not found - return unchanged
        // The caller should trigger a full reload for new conversations
        return state;
      }

      const updated = [...state.conversations];
      const existing = updated[existingIndex];
      updated[existingIndex] = {
        ...existing,
        message,
        timestamp,
        unreadCount: (existing.unreadCount || 0) + 1,
      };

      // Move to top
      const [item] = updated.splice(existingIndex, 1);
      updated.unshift(item);

      return {
        ...state,
        conversations: updated,
      };
    }

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
}

/**
 * Process categorized matches into match queue format
 */
function processMatchQueue(
  categorized: {
    chatStarted?: Match[];
    waitingForUserReply?: Match[];
    waitingForOtherReply?: Match[];
    newMatches?: Match[];
  },
  conversationUserIds?: Set<number>
): {
  matchQueue: MatchQueuePerson[];
  urgentMatches: Match[];
  matchedUserIds: Set<number>;
} {
  // Store all matched user IDs for validation (all non-expired categories)
  const allActiveMatches = [
    ...(categorized.chatStarted || []),
    ...(categorized.waitingForUserReply || []),
    ...(categorized.waitingForOtherReply || []),
    ...(categorized.newMatches || []),
  ];
  // Combine matchedUserIds from categorized matches with conversation user IDs
  // This handles backend bug where matchedUserId might be the current user's ID instead of the other user
  const matchedUserIds = new Set([
    ...allActiveMatches.map((m) => m.matchedUserId),
    ...(conversationUserIds || []),
  ]);

  // Combine all matches that can expire for urgency check
  const expiringMatches = [
    ...(categorized.newMatches || []),
    ...(categorized.waitingForUserReply || []),
    ...(categorized.waitingForOtherReply || []),
  ].sort((a, b) => {
    const aHours = a.hoursUntilExpiration ?? 24;
    const bHours = b.hoursUntilExpiration ?? 24;
    return aHours - bHours;
  });

  // Track urgent matches (expiring within 6 hours) for warning banner
  const urgentMatches = expiringMatches.filter(
    (m) => m.hoursUntilExpiration !== undefined && m.hoursUntilExpiration <= 6
  );

  // Prioritize matches for the queue
  const prioritizedMatches = [
    ...(categorized.waitingForUserReply || []).map((m) => ({
      ...m,
      _priority: 1,
      _label: 'Reply needed!',
    })),
    ...(categorized.newMatches || []).map((m) => ({
      ...m,
      _priority: 2,
      _label: 'New match!',
    })),
    ...(categorized.waitingForOtherReply || []).map((m) => ({
      ...m,
      _priority: 3,
      _label: 'Waiting...',
    })),
  ].sort((a, b) => {
    if (a._priority !== b._priority) return a._priority - b._priority;
    const aHours = a.hoursUntilExpiration ?? 24;
    const bHours = b.hoursUntilExpiration ?? 24;
    return aHours - bHours;
  });

  // Convert to match queue format
  const matchQueue: MatchQueuePerson[] = prioritizedMatches.map((match) => {
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

  return { matchQueue, urgentMatches, matchedUserIds };
}

/**
 * Custom hook for managing inbox data
 * Consolidates all data fetching and state management for the inbox screen
 */
export function useInboxData() {
  const [state, dispatch] = useReducer(inboxReducer, initialState);
  const loadingRef = useRef(false);

  /**
   * Load all inbox data in a single coordinated fetch
   * Uses Promise.all to avoid race conditions
   */
  const loadData = useCallback(async (isRefresh = false) => {
    // Prevent concurrent loads
    if (loadingRef.current) {
      console.log('[useInboxData] Load already in progress, skipping');
      return;
    }

    loadingRef.current = true;
    dispatch({ type: isRefresh ? 'REFRESH_START' : 'LOAD_START' });

    try {
      // Fetch all data in parallel - single coordinated request
      const [conversations, categorized, inboxMatches] = await Promise.all([
        getConversations(),
        matchingApi.getCategorizedMatches(),
        matchingApi.getInboxMatches(),
      ]);

      // Extract user IDs from conversations first (needed for processMatchQueue)
      const conversationUserIds = new Set(conversations.map((c) => c.userId));

      // Process categorized matches - pass conversation user IDs to fix backend bug
      const { matchQueue, urgentMatches, matchedUserIds } = processMatchQueue(categorized, conversationUserIds);

      // Build inbox user IDs set from inbox matches
      // Note: Backend returns matchedUserId which should be the OTHER user's ID
      // But we also need to check against conversation userIds to handle any inconsistencies
      const inboxMatchedUserIds = new Set(inboxMatches.map((m) => m.matchedUserId));

      // Combine both sets - if a conversation exists OR user is in inbox matches, show it
      // This handles the case where backend might return wrong matchedUserId
      const inboxUserIds = new Set([...inboxMatchedUserIds, ...conversationUserIds]);

      console.log(
        `[useInboxData] Loaded: ${conversations.length} conversations, ` +
        `${matchQueue.length} queue items, ${urgentMatches.length} urgent, ` +
        `${inboxUserIds.size} inbox users (matchedUserIds: ${Array.from(inboxMatchedUserIds)}, convUserIds: ${Array.from(conversationUserIds)})`
      );

      dispatch({
        type: 'LOAD_SUCCESS',
        payload: {
          conversations,
          matchQueue,
          urgentMatches,
          matchedUserIds,
          inboxUserIds,
        },
      });
    } catch (err) {
      console.error('[useInboxData] Failed to load inbox data:', err);
      dispatch({
        type: 'LOAD_ERROR',
        payload: err instanceof Error ? err.message : 'Failed to load inbox data',
      });
    } finally {
      loadingRef.current = false;
    }
  }, []);

  /**
   * Update a conversation with new message preview
   * Returns true if conversation was found and updated, false if it needs a full reload
   */
  const updateConversationPreview = useCallback(
    (conversationId: string, roomId: string | undefined, message: string): boolean => {
      const exists = state.conversations.some(
        (c) => c.id === conversationId || c.roomId === roomId
      );

      if (exists) {
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: {
            conversationId,
            roomId,
            message,
            timestamp: 'Just now',
          },
        });
        return true;
      }

      return false;
    },
    [state.conversations]
  );

  /**
   * Check if a user ID is in the matched users set
   */
  const isUserMatched = useCallback(
    (userId: number): boolean => {
      return state.matchedUserIds.has(userId);
    },
    [state.matchedUserIds]
  );

  /**
   * Check if a user ID is in the inbox users set (has full chat started)
   */
  const isUserInInbox = useCallback(
    (userId: number): boolean => {
      return state.inboxUserIds.has(userId);
    },
    [state.inboxUserIds]
  );

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return {
    // State
    conversations: state.conversations,
    matchQueue: state.matchQueue,
    urgentMatches: state.urgentMatches,
    matchedUserIds: state.matchedUserIds,
    inboxUserIds: state.inboxUserIds,
    isLoading: state.status === 'loading',
    isRefreshing: state.status === 'refreshing',
    error: state.error,
    status: state.status,

    // Actions
    loadData,
    updateConversationPreview,
    isUserMatched,
    isUserInInbox,
    clearError,
  };
}

export default useInboxData;
