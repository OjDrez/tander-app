import { ChatUser, ConversationPreview } from '../types/chat';
import apiClient, { API_BASE_URL, getCurrentUsernameFromToken } from './config';
import { getCurrentUserId, getCurrentUsername } from '../services/chatService';
import { matchingApi } from './matchingApi';

/**
 * Convert a relative photo URL to a full URL
 * Backend returns relative paths like /uploads/profile-photos/username/photo.jpg
 * We need to prepend the API base URL for the Image component to load them
 */
export const getFullPhotoUrl = (relativeUrl: string | null | undefined): string | null => {
  if (!relativeUrl) return null;

  // If already a full URL (http/https), return as-is
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }

  // Prepend the API base URL to relative paths
  return `${API_BASE_URL}${relativeUrl}`;
};

// ==================== TYPES ====================

// Response type from backend /chat/conversations endpoint
export interface ConversationResponse {
  id: number;
  roomId: string;
  otherUserId: number;
  otherUserUsername: string;
  otherUserEmail?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Response type from backend /chat/conversations and /chat/users/{id}/start-conversation endpoints
export interface StartConversationResponse {
  id: number;
  user1Id: number;
  user1Username: string;
  user1DisplayName?: string;
  user1ProfilePhotoUrl?: string;
  user2Id: number;
  user2Username: string;
  user2DisplayName?: string;
  user2ProfilePhotoUrl?: string;
  createdAt: string;
  lastMessageAt: string;
  lastMessage: string | null;
  unreadCount: number;
  active: boolean;
}

// Normalized conversation data for frontend use
export interface NormalizedConversation {
  id: number;
  roomId: string;
  otherUserId: number;
  otherUserUsername: string;
  lastMessage: string | null;
  unreadCount: number;
}

export interface MessageResponse {
  id: number;
  conversationId?: number;
  senderId: number;
  senderUsername: string;
  receiverId: number;
  receiverUsername: string;
  content: string;
  sentAt: string; // Backend uses "sentAt" not "timestamp"
  status?: string; // Backend uses status field (SENT, DELIVERED, READ)
  read?: boolean;
  delivered?: boolean;
}

export interface UserResponse {
  id: number;
  username: string;
  email?: string;
  isOnline: boolean;
}

// ==================== UTILITY HELPERS ====================

/**
 * Helper to generate room ID matching backend format
 */
const generateRoomId = (userId1: number, userId2: number): string => {
  const minId = Math.min(userId1, userId2);
  const maxId = Math.max(userId1, userId2);
  return `dm_${minId}_${maxId}`;
};

// ==================== CONVERSATION API ====================

/**
 * Get all conversations for the current user
 * Backend returns user1Id/user2Id format, we need to determine which is "other" user
 */
export const getConversations = async (): Promise<ConversationPreview[]> => {
  try {
    // Backend returns StartConversationResponse[] format
    const response = await apiClient.get<StartConversationResponse[]>('/chat/conversations');

    // Get current user info - try socket first, then decode from JWT
    const myUserId = getCurrentUserId();
    const myUsername = getCurrentUsername() || await getCurrentUsernameFromToken();
    console.log('[ChatAPI] getConversations - myUserId:', myUserId, 'myUsername:', myUsername);

    return response.data.map((conv) => {
      // Determine which user is the "other" user (not me)
      // First try to match by userId (if socket is connected)
      // Then fall back to matching by username (from JWT)
      let isUser1Me = false;
      if (myUserId) {
        isUser1Me = conv.user1Id === myUserId;
      } else if (myUsername) {
        isUser1Me = conv.user1Username === myUsername;
      }

      const otherUserId = isUser1Me ? conv.user2Id : conv.user1Id;
      const otherUsername = isUser1Me ? conv.user2Username : conv.user1Username;
      const otherDisplayName = isUser1Me ? conv.user2DisplayName : conv.user1DisplayName;
      const otherProfilePhotoUrl = isUser1Me ? conv.user2ProfilePhotoUrl : conv.user1ProfilePhotoUrl;

      // Generate room ID from user IDs
      const roomId = generateRoomId(conv.user1Id, conv.user2Id);

      // Use display name if available, fallback to username
      const displayName = otherDisplayName || otherUsername;

      // Convert relative photo URL to full URL, fallback to UI Avatars
      const fullPhotoUrl = getFullPhotoUrl(otherProfilePhotoUrl);
      const avatarUrl = fullPhotoUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;

      console.log('[ChatAPI] Conversation mapping:', {
        convId: conv.id,
        otherUserId,
        otherUsername,
        otherDisplayName,
        otherProfilePhotoUrl,
        avatarUrl,
        roomId,
      });

      return {
        id: conv.id.toString(),
        name: displayName,
        message: conv.lastMessage || 'No messages yet',
        timestamp: conv.lastMessageAt ? formatTimestamp(conv.lastMessageAt) : '',
        avatar: avatarUrl,
        unreadCount: conv.unreadCount,
        isOnline: false, // Will be updated via socket
        userId: otherUserId,
        roomId: roomId,
      };
    });
  } catch (error) {
    console.error('[ChatAPI] Failed to get conversations:', error);
    throw error;
  }
};

/**
 * Get or create a conversation with another user
 * Normalizes the backend response to a consistent format
 * @param targetUserId - The ID of the user we want to chat with (the OTHER user)
 */
export const startConversation = async (targetUserId: number): Promise<NormalizedConversation> => {
  try {
    const response = await apiClient.get<StartConversationResponse>(`/chat/users/${targetUserId}/start-conversation`);
    const data = response.data;

    console.log('[ChatAPI] Start conversation raw response:', data);
    console.log('[ChatAPI] targetUserId (person we want to chat with):', targetUserId);

    // The targetUserId IS the other user - that's who we're trying to chat with
    // Find which user in the response matches the targetUserId
    const isTargetUser1 = data.user1Id === targetUserId;
    const otherUserId = targetUserId; // The target IS the other user
    const otherUserUsername = isTargetUser1 ? data.user1Username : data.user2Username;

    // Generate room ID from user IDs
    const roomId = generateRoomId(data.user1Id, data.user2Id);

    const normalized: NormalizedConversation = {
      id: data.id,
      roomId,
      otherUserId,
      otherUserUsername,
      lastMessage: data.lastMessage,
      unreadCount: data.unreadCount,
    };

    console.log('[ChatAPI] Normalized conversation:', normalized);
    console.log('[ChatAPI] Generated roomId:', roomId, 'from user1Id:', data.user1Id, 'user2Id:', data.user2Id);

    return normalized;
  } catch (error) {
    console.error('[ChatAPI] Failed to start conversation:', error);
    throw error;
  }
};

// ==================== MESSAGE API ====================

/**
 * Get messages for a conversation with pagination support
 * @param conversationId - The conversation ID
 * @param page - Page number (0-indexed), defaults to 0
 * @param size - Number of messages per page, defaults to 50
 * @returns Array of messages for the requested page
 */
export const getConversationMessages = async (
  conversationId: number,
  page: number = 0,
  size: number = 50
): Promise<MessageResponse[]> => {
  try {
    const response = await apiClient.get<MessageResponse[]>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { page, size } }
    );
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get messages:', error);
    throw error;
  }
};

/**
 * Send a message via REST API (backup for socket failures)
 */
export const sendMessageRest = async (receiverId: number, content: string): Promise<MessageResponse> => {
  try {
    const response = await apiClient.post<MessageResponse>('/chat/messages', {
      receiverId,
      content,
    });
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to send message:', error);
    throw error;
  }
};

/**
 * Mark conversation as read
 */
export const markConversationRead = async (conversationId: number): Promise<void> => {
  try {
    await apiClient.post(`/chat/conversations/${conversationId}/mark-read`);
  } catch (error) {
    console.error('[ChatAPI] Failed to mark conversation as read:', error);
    throw error;
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (messageId: number): Promise<void> => {
  try {
    await apiClient.delete(`/chat/messages/${messageId}`);
  } catch (error) {
    console.error('[ChatAPI] Failed to delete message:', error);
    throw error;
  }
};

// ==================== USER API ====================

/**
 * Get all available users for chat
 */
export const getChatUsers = async (): Promise<ChatUser[]> => {
  try {
    const response = await apiClient.get<UserResponse[]>('/chat/users');
    return response.data.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      isOnline: user.isOnline,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`,
      displayName: user.username,
    }));
  } catch (error) {
    console.error('[ChatAPI] Failed to get chat users:', error);
    throw error;
  }
};

/**
 * Get a specific user by ID
 */
export const getChatUser = async (userId: number): Promise<ChatUser> => {
  try {
    const response = await apiClient.get<UserResponse>(`/chat/users/${userId}`);
    const user = response.data;
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      isOnline: user.isOnline,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=random`,
      displayName: user.username,
    };
  } catch (error) {
    console.error('[ChatAPI] Failed to get user:', error);
    throw error;
  }
};

// ==================== CALL API ====================

/**
 * Get call history
 */
export const getCallHistory = async (): Promise<CallHistoryItem[]> => {
  try {
    const response = await apiClient.get<CallHistoryItem[]>('/calls/history');
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get call history:', error);
    return [];
  }
};

/**
 * Get call details
 */
export const getCallDetails = async (callId: number): Promise<CallDetails | null> => {
  try {
    const response = await apiClient.get<CallDetails>(`/calls/${callId}`);
    return response.data;
  } catch (error) {
    console.error('[ChatAPI] Failed to get call details:', error);
    return null;
  }
};

// ==================== TYPES FOR CALLS ====================

export interface CallHistoryItem {
  id: number;
  roomId: string;
  callerId: number;
  callerUsername: string;
  receiverId: number;
  receiverUsername: string;
  callType: 'video' | 'audio';
  status: string;
  initiatedAt: string;
  answeredAt?: string;
  endedAt?: string;
  durationSeconds?: number;
  endReason?: string;
}

export interface CallDetails extends CallHistoryItem {
  callerAvatarUrl?: string;
  receiverAvatarUrl?: string;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }

  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }

  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }

  // Otherwise, show date
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format message time for display
 */
export const formatMessageTime = (timestamp: string | number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format date for message grouping
 */
export const formatMessageDate = (timestamp: string | number): string => {
  return new Date(timestamp).toISOString().slice(0, 10);
};

/**
 * Get date label for message separators
 */
export const getDateLabel = (dateString: string): string => {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateObj = new Date(dateString);

  if (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  ) {
    return 'Today';
  }

  if (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  ) {
    return 'Yesterday';
  }

  return dateObj.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
};

// ==================== MATCH VALIDATION ====================

export interface MatchInfo {
  isMatched: boolean;
  matchId?: number;
  status?: string;
  chatStarted?: boolean;
  hoursUntilExpiration?: number;
  expiresAt?: string;
}

/**
 * Check if current user is matched with another user
 * Returns match info including expiration status
 * Uses checkMatch for quick boolean check, then getMatchesList for full details if matched
 */
export const checkMatchStatus = async (otherUserId: number): Promise<MatchInfo> => {
  try {
    // First do a quick check if users are matched
    const checkResult = await matchingApi.checkMatch(otherUserId);

    if (!checkResult.isMatched) {
      return { isMatched: false };
    }

    // If matched, get full match details from matches list
    const matches = await matchingApi.getMatchesList();
    const match = matches.find(m => m.matchedUserId === otherUserId);

    if (!match) {
      // Match exists but couldn't find details - still allow chat
      return { isMatched: true };
    }

    return {
      isMatched: true,
      matchId: match.id,
      status: match.status,
      chatStarted: match.chatStarted,
      hoursUntilExpiration: match.hoursUntilExpiration,
      expiresAt: match.expiresAt,
    };
  } catch (error) {
    console.error('[ChatAPI] Failed to check match status:', error);
    return { isMatched: false };
  }
};

/**
 * Validate that a chat can proceed (users are matched and match is active)
 * Returns error message if chat is not allowed, null if allowed
 */
export const validateChatAccess = async (otherUserId: number): Promise<string | null> => {
  try {
    const matchInfo = await checkMatchStatus(otherUserId);

    if (!matchInfo.isMatched) {
      return 'You can only chat with users you have matched with.';
    }

    if (matchInfo.status === 'EXPIRED') {
      return 'This match has expired. Keep swiping to find new matches!';
    }

    if (matchInfo.status === 'UNMATCHED') {
      return 'This match is no longer active.';
    }

    return null; // Chat is allowed
  } catch (error) {
    console.error('[ChatAPI] Failed to validate chat access:', error);
    return 'Unable to verify match status. Please try again.';
  }
};

/**
 * Format expiration warning message (Bumble-style 24-hour expiration)
 */
export const getExpirationWarning = (hoursUntilExpiration?: number): string | null => {
  if (hoursUntilExpiration === undefined || hoursUntilExpiration < 0) {
    return null;
  }

  if (hoursUntilExpiration <= 1) {
    return 'Less than 1 hour left! Start chatting now or this match will expire.';
  }

  if (hoursUntilExpiration <= 3) {
    return `Only ${Math.ceil(hoursUntilExpiration)} hours left! Send a message to keep this match.`;
  }

  if (hoursUntilExpiration <= 6) {
    return `${Math.ceil(hoursUntilExpiration)} hours remaining. Say hello before time runs out!`;
  }

  if (hoursUntilExpiration <= 12) {
    return `${Math.ceil(hoursUntilExpiration)} hours left to start a conversation.`;
  }

  // For 12-24 hours, show a gentle reminder
  if (hoursUntilExpiration <= 24) {
    return `Match expires in ${Math.ceil(hoursUntilExpiration)} hours. Don't miss out!`;
  }

  return null;
};
