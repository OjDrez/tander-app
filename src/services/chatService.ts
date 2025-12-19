/**
 * Chat Service
 * Uses Raw WebSocket for Azure deployment.
 */

import { wsService } from './websocket';
import { sendMessageRest } from '../api/chatApi';

// Log once if we're using REST fallback
let restFallbackLogged = false;

// Types
export type MessageCallback = (payload: any) => void;
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated' | 'error';

/**
 * Connect to the real-time service
 */
export const connect = async (): Promise<boolean> => {
  return wsService.connect();
};

/**
 * Disconnect from the real-time service
 */
export const disconnect = (): void => {
  wsService.disconnect();
};

/**
 * Check if connected
 */
export const isConnected = (): boolean => {
  return wsService.isConnected();
};

/**
 * Get connection state
 */
export const getConnectionState = (): ConnectionState => {
  return wsService.getConnectionState();
};

/**
 * Get current user ID
 */
export const getCurrentUserId = (): number | null => {
  return wsService.getCurrentUserId();
};

/**
 * Get current username
 */
export const getCurrentUsername = (): string | null => {
  return wsService.getCurrentUsername();
};

/**
 * Generate room ID for direct messages
 */
export const generateDirectRoomId = (userId1: number, userId2: number): string => {
  const minId = Math.min(userId1, userId2);
  const maxId = Math.max(userId1, userId2);
  return `dm_${minId}_${maxId}`;
};

/**
 * Join a chat room
 */
export const joinRoom = async (roomId: string): Promise<{ success: boolean; error?: string }> => {
  // Room join is handled via subscribeToRoom
  console.log('[chatService] Room join handled via subscription');
  return { success: true };
};

/**
 * Leave a chat room
 */
export const leaveRoom = (roomId: string): void => {
  console.log('[chatService] Room leave handled via unsubscription');
};

/**
 * Subscribe to room messages
 * Returns an unsubscribe function
 */
export const subscribeToRoom = (roomId: string, callback: MessageCallback): (() => void) => {
  return wsService.subscribeToRoom(roomId, callback);
};

/**
 * Send a chat message
 * Falls back to REST API if WebSocket is not connected
 */
export const sendMessage = async (
  roomId: string,
  text: string,
  receiverId?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  // Try WebSocket first
  if (wsService.isConnected()) {
    try {
      wsService.sendMessage(roomId, text, receiverId);
      return { success: true, messageId: `msg_${Date.now()}` };
    } catch (error) {
      console.warn('[chatService] WebSocket send failed, falling back to REST');
    }
  }

  // Fallback to REST API
  if (receiverId) {
    if (!restFallbackLogged) {
      console.log('[chatService] Using REST API for messages (WebSocket unavailable)');
      restFallbackLogged = true;
    }
    try {
      const response = await sendMessageRest(receiverId, text);
      return { success: true, messageId: response.id.toString() };
    } catch (error: any) {
      console.error('[chatService] REST send failed:', error);
      return { success: false, error: error?.message || 'Failed to send message' };
    }
  }

  return { success: false, error: 'No receiver ID provided for REST fallback' };
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (
  roomId: string,
  conversationId: number,
  receiverId: number,
  isTyping: boolean
): void => {
  wsService.sendTyping(roomId, conversationId, receiverId, isTyping);
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = (conversationId: number): void => {
  wsService.markRead(conversationId);
};

/**
 * Mark message as delivered
 */
export const markMessageDelivered = (messageId: string, roomId: string): void => {
  wsService.markDelivered(messageId, roomId);
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: number): boolean => {
  return wsService.isUserOnline(userId);
};

/**
 * Get online users set
 */
export const getOnlineUsers = (): Set<number> => {
  return wsService.getOnlineUsers();
};

/**
 * Subscribe to online users changes
 */
export const subscribeToOnlineUsers = (callback: (users: Set<number>) => void): (() => void) => {
  return wsService.onOnlineUsersChange(callback);
};

/**
 * Subscribe to connection state changes
 */
export const onConnectionStateChange = (callback: (state: ConnectionState) => void): (() => void) => {
  return wsService.onConnectionStateChange(callback);
};

// Re-export wsService for direct access if needed
export { wsService } from './websocket';
