/**
 * Chat & Call Types
 * Shared types for real-time communication features
 */

// ==================== USER TYPES ====================

export interface ChatUser {
  id: number;
  username: string;
  email?: string;
  isOnline: boolean;
  avatarUrl?: string;
  displayName?: string;
}

// ==================== CONVERSATION TYPES ====================

export interface Conversation {
  id: number;
  roomId: string;
  otherUser: ChatUser;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isTyping?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationPreview {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  avatar: string;
  unreadCount: number;
  isOnline?: boolean;
  userId: number;
  roomId: string;
}

// ==================== MESSAGE TYPES ====================

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  senderUsername: string;
  text: string;
  timestamp: number;
  messageId?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isOwn?: boolean;
}

export interface MessageDisplay {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
  date: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  senderId: number;
  timestamp: number; // Numeric timestamp for reliable sorting
}

export interface DateSeparator {
  id: string;
  type: 'date';
  label: string;
}

export type ChatListItem = MessageDisplay | DateSeparator;

// ==================== SOCKET EVENT PAYLOADS ====================

export interface SocketAuthData {
  token: string;
}

export interface AuthenticatedPayload {
  success: boolean;
  username: string;
  userId: number;
  serverTime: number;
}

export interface SendMessagePayload {
  roomId?: string;
  receiverId?: number;
  text: string;
  timestamp?: number;
}

export interface MessageReceivedPayload {
  roomId: string;
  senderId: number;
  senderUsername: string;
  text: string;
  timestamp: number;
  messageId: string;
}

export interface TypingPayload {
  conversationId: string;
  receiverId: number;
  isTyping: boolean;
}

export interface UserTypingPayload {
  conversationId: string;
  userId: number;
  username: string;
  isTyping: boolean;
  timestamp: number;
}

export interface MarkReadPayload {
  conversationId: string;
}

export interface MessageDeliveredPayload {
  messageId: string;
  conversationId: string;
  timestamp: number;
}

export interface MessagesReadPayload {
  conversationId: string;
  messageIds: string[];
  readBy: number;
  timestamp: number;
}

export interface NewMessagePreviewPayload {
  conversationId: string;
  senderId: number;
  text: string;
  timestamp: string;
  unreadCount?: number;
  name?: string;
  avatar?: string;
}

export interface UserOnlinePayload {
  username: string;
  userId: number;
  timestamp: number;
}

export interface UserOfflinePayload {
  username: string;
  userId: number;
  timestamp: number;
}

// ==================== CALL TYPES ====================

export type CallType = 'video' | 'audio';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended' | 'rejected' | 'missed' | 'busy';

export interface CallData {
  targetUserId: number;
  callType: CallType;
  callerName?: string;
  roomId?: string;
}

export interface IncomingCallPayload {
  roomId: string;
  callId: number;
  callerId: number;
  callerUsername: string;
  callerName: string;
  callType: CallType;
  timestamp: number;
}

export interface CallAnsweredPayload {
  roomId: string;
  answeredBy: string;
  answeredById: number;
  timestamp: number;
}

export interface CallRejectedPayload {
  roomId: string;
  rejectedBy: string;
  reason: string;
  timestamp: number;
}

export interface CallEndedPayload {
  roomId: string;
  endedBy: string;
  reason: string;
  duration: number;
  timestamp: number;
}

export interface EndCallPayload {
  roomId?: string;
  reason?: string;
}

// ==================== WEBRTC SIGNALING ====================

export interface OfferPayload {
  roomId: string;
  senderId: number;
  senderUsername: string;
  sdp: string;
  type: string;
  timestamp: number;
}

export interface AnswerPayload {
  roomId: string;
  senderId: number;
  senderUsername: string;
  sdp: string;
  type: string;
  timestamp: number;
}

export interface IceCandidatePayload {
  roomId: string;
  senderId: number;
  candidate: string;
  sdpMid: string;
  sdpMLineIndex: number;
  timestamp: number;
}

// ==================== ROOM TYPES ====================

export interface JoinRoomPayload {
  roomId: string;
}

export interface RoomJoinedPayload {
  success: boolean;
  roomId: string;
}

// ==================== GROUP CHAT TYPES ====================

export interface GroupChatRequest {
  name: string;
  memberIds: number[];
  maxMembers?: number;
}

export interface GroupActionRequest {
  roomId: string;
  action: 'add_member' | 'remove_member' | 'leave' | 'promote_admin' | 'demote_admin';
  targetUserId?: number;
}

export interface GroupCreatedPayload {
  roomId: string;
  name: string;
  creatorId: number;
  memberCount: number;
}

// ==================== ERROR TYPES ====================

export interface SocketError {
  success: false;
  error: string;
  timestamp: number;
}

// ==================== SOCKET CONNECTION STATE ====================

export type SocketConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

export interface SocketState {
  connectionState: SocketConnectionState;
  isAuthenticated: boolean;
  userId: number | null;
  username: string | null;
  error: string | null;
}
