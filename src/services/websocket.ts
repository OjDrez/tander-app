/**
 * Raw WebSocket Service for React Native
 * Simple JSON-based messaging without STOMP overhead.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { TOKEN_KEY } from '../api/config';

const WS_URL = 'wss://api.tanderconnect.com/ws-raw';
const RECONNECT_DELAY = 5000;
const HEARTBEAT_INTERVAL = 30000;

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
type MessageCallback = (payload: any) => void;

interface WSMessage {
  type: string;
  payload?: any;
  roomId?: string;
  [key: string]: any;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private connectionState: ConnectionState = 'disconnected';
  private token: string | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private connectPromiseResolve: ((value: boolean) => void) | null = null;

  // User info from server authentication
  private currentUserId: number | null = null;
  private currentUsername: string | null = null;

  private onlineUsers: Set<number> = new Set();
  private connectionListeners: ((state: ConnectionState) => void)[] = [];
  private onlineUsersListeners: ((users: Set<number>) => void)[] = [];
  private messageListeners: Map<string, MessageCallback[]> = new Map();
  private callListeners: MessageCallback[] = [];
  private webrtcListeners: MessageCallback[] = [];
  private globalListeners: MessageCallback[] = [];

  async connect(): Promise<boolean> {
    // If already connected, check if we need to reconnect with a new token
    if (this.connectionState === 'connected') {
      // Fetch current token to see if it changed (different user logged in)
      const currentToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (currentToken === this.token) {
        return true; // Same token, stay connected
      }
      // Different token - disconnect and reconnect with new credentials
      console.log('[WS] Token changed, reconnecting with new credentials');
      this.disconnect();
    }
    if (this.connectionState === 'connecting') return false;

    // Reset reconnect attempts to allow reconnection
    this.reconnectAttempts = 0;

    this.token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!this.token) {
      console.log('[WS] No token available');
      return false;
    }

    return new Promise((resolve) => {
      this.connectPromiseResolve = resolve;
      this.setConnectionState('connecting');

      try {
        // Connect with token as query parameter
        const url = `${WS_URL}?token=${encodeURIComponent(this.token!)}`;
        console.log('[WS] Connecting to:', WS_URL);
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('[WS] Connected!');
          this.setConnectionState('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.resolveConnect(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (event: any) => {
          console.log('[WS] Error:', event?.message || 'unknown');
          this.resolveConnect(false);
        };

        this.ws.onclose = (event: any) => {
          console.log('[WS] Closed - code:', event?.code, 'reason:', event?.reason || 'none');
          this.handleDisconnect();
        };

        // Connection timeout
        setTimeout(() => {
          if (this.connectionState === 'connecting') {
            console.log('[WS] Connection timeout');
            this.ws?.close();
            this.resolveConnect(false);
          }
        }, 15000);
      } catch (e) {
        console.log('[WS] Error:', e);
        this.resolveConnect(false);
      }
    });
  }

  private resolveConnect(success: boolean) {
    if (this.connectPromiseResolve) {
      this.connectPromiseResolve(success);
      this.connectPromiseResolve = null;
    }
    if (!success) {
      this.setConnectionState('error');
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    // Reset reconnect attempts to prevent auto-reconnect with stale token
    this.reconnectAttempts = this.maxReconnectAttempts;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setConnectionState('disconnected');
    this.onlineUsers.clear();
    this.currentUserId = null;
    this.currentUsername = null;
    // Clear cached token to force fresh fetch on next connect
    this.token = null;
  }

  private send(message: WSMessage): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.log('[WS] Cannot send - not connected');
      return;
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    try {
      const message: WSMessage = JSON.parse(data);
      console.log('[WS] Received:', message.type);

      // Route message based on type
      switch (message.type) {
        case 'pong':
          // Heartbeat response - ignore
          break;

        case 'authenticated':
          // Server confirmed authentication - store user info
          if (message.userId) {
            this.currentUserId = message.userId;
            this.currentUsername = message.username || null;
            console.log('[WS] Authenticated as userId:', this.currentUserId, 'username:', this.currentUsername);
          }
          break;

        case 'online_users':
          if (message.userIds) {
            this.onlineUsers = new Set(message.userIds);
            this.onlineUsersListeners.forEach(cb => cb(this.onlineUsers));
          }
          break;

        case 'user_online':
          if (message.userId) {
            this.onlineUsers.add(message.userId);
            this.onlineUsersListeners.forEach(cb => cb(this.onlineUsers));
          }
          break;

        case 'user_offline':
          if (message.userId) {
            this.onlineUsers.delete(message.userId);
            this.onlineUsersListeners.forEach(cb => cb(this.onlineUsers));
          }
          break;

        case 'message':
        case 'typing':
        case 'messages_read':
        case 'message_delivered':
          if (message.roomId) {
            this.messageListeners.get(message.roomId)?.forEach(cb => cb(message));
          }
          // Also notify personal listeners
          this.messageListeners.get('personal')?.forEach(cb => cb(message));
          break;

        case 'incoming_call':
        case 'call_answered':
        case 'call_rejected':
        case 'call_ended':
        case 'call_error':
        case 'receiver_ready':
          console.log('[WS] 📞 Call event received:', message.type, 'listeners:', this.callListeners.length);
          this.callListeners.forEach(cb => cb(message));
          break;

        case 'webrtc_offer':
        case 'webrtc_answer':
        case 'webrtc_ice':
          console.log('[WS] 🔗 WebRTC event received:', message.type, 'listeners:', this.webrtcListeners.length);
          this.webrtcListeners.forEach(cb => cb(message));
          break;

        default:
          // Notify global listeners for unknown types
          this.globalListeners.forEach(cb => cb(message));
      }
    } catch (e) {
      console.log('[WS] Failed to parse message:', e);
    }
  }

  private handleDisconnect(): void {
    this.stopHeartbeat();
    const wasConnecting = this.connectionState === 'connecting';
    this.setConnectionState('disconnected');
    this.onlineUsers.clear();
    if (wasConnecting) this.resolveConnect(false);
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(RECONNECT_DELAY * Math.pow(1.5, this.reconnectAttempts), 30000);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, HEARTBEAT_INTERVAL);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Public API
  subscribeToRoom(roomId: string, callback: MessageCallback): () => void {
    if (!this.messageListeners.has(roomId)) {
      this.messageListeners.set(roomId, []);
    }
    this.messageListeners.get(roomId)!.push(callback);

    // Tell server we're joining this room
    this.send({ type: 'join_room', roomId });

    return () => {
      const arr = this.messageListeners.get(roomId);
      if (arr) {
        const idx = arr.indexOf(callback);
        if (idx > -1) arr.splice(idx, 1);
      }
      this.send({ type: 'leave_room', roomId });
    };
  }

  sendMessage(roomId: string, text: string, receiverId?: number): void {
    this.send({
      type: 'send_message',
      roomId,
      text,
      receiverId,
      timestamp: Date.now(),
    });
  }

  sendTyping(roomId: string, conversationId: number, receiverId: number, isTyping: boolean): void {
    this.send({
      type: 'typing',
      roomId,
      conversationId,
      receiverId,
      isTyping,
    });
  }

  markRead(conversationId: number): void {
    this.send({ type: 'mark_read', conversationId });
  }

  markDelivered(messageId: string, roomId: string): void {
    this.send({ type: 'mark_delivered', messageId, roomId });
  }

  // Call methods
  initiateCall(targetUserId: number, callType: 'video' | 'audio', callerName?: string): void {
    console.log('[WS] 📞 Sending initiate_call to:', targetUserId, 'type:', callType);
    this.send({ type: 'initiate_call', targetUserId, callType, callerName });
  }

  answerCall(roomId: string): void {
    console.log('[WS] 📞 Sending answer_call for room:', roomId);
    this.send({ type: 'answer_call', roomId });
  }

  rejectCall(roomId: string, reason = 'rejected'): void {
    console.log('[WS] 📞 Sending reject_call for room:', roomId);
    this.send({ type: 'reject_call', roomId, reason });
  }

  endCall(roomId: string, reason = 'ended'): void {
    console.log('[WS] 📞 Sending end_call for room:', roomId);
    this.send({ type: 'end_call', roomId, reason });
  }

  sendOffer(roomId: string, sdp: string): void {
    console.log('[WS] 🔗 Sending webrtc_offer for room:', roomId, 'sdp length:', sdp?.length);
    this.send({ type: 'webrtc_offer', roomId, sdp });
  }

  sendAnswer(roomId: string, sdp: string): void {
    console.log('[WS] 🔗 Sending webrtc_answer for room:', roomId, 'sdp length:', sdp?.length);
    this.send({ type: 'webrtc_answer', roomId, sdp });
  }

  sendIceCandidate(roomId: string, candidate: string, sdpMid: string, sdpMLineIndex: number): void {
    console.log('[WS] 🔗 Sending webrtc_ice for room:', roomId);
    this.send({ type: 'webrtc_ice', roomId, candidate, sdpMid, sdpMLineIndex });
  }

  // State getters
  getConnectionState(): ConnectionState { return this.connectionState; }
  isConnected(): boolean { return this.connectionState === 'connected' && this.ws?.readyState === WebSocket.OPEN; }
  getOnlineUsers(): Set<number> { return this.onlineUsers; }
  isUserOnline(userId: number): boolean { return this.onlineUsers.has(userId); }
  getCurrentUserId(): number | null { return this.currentUserId; }
  getCurrentUsername(): string | null { return this.currentUsername; }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionListeners.forEach(cb => cb(state));
  }

  // Event subscriptions
  onConnectionStateChange(callback: (state: ConnectionState) => void): () => void {
    this.connectionListeners.push(callback);
    return () => {
      const idx = this.connectionListeners.indexOf(callback);
      if (idx > -1) this.connectionListeners.splice(idx, 1);
    };
  }

  onOnlineUsersChange(callback: (users: Set<number>) => void): () => void {
    this.onlineUsersListeners.push(callback);
    return () => {
      const idx = this.onlineUsersListeners.indexOf(callback);
      if (idx > -1) this.onlineUsersListeners.splice(idx, 1);
    };
  }

  onCall(callback: MessageCallback): () => void {
    this.callListeners.push(callback);
    return () => {
      const idx = this.callListeners.indexOf(callback);
      if (idx > -1) this.callListeners.splice(idx, 1);
    };
  }

  onWebRTC(callback: MessageCallback): () => void {
    this.webrtcListeners.push(callback);
    return () => {
      const idx = this.webrtcListeners.indexOf(callback);
      if (idx > -1) this.webrtcListeners.splice(idx, 1);
    };
  }

  onMessage(callback: MessageCallback): () => void {
    this.globalListeners.push(callback);
    return () => {
      const idx = this.globalListeners.indexOf(callback);
      if (idx > -1) this.globalListeners.splice(idx, 1);
    };
  }
}

export const wsService = new WebSocketService();
export default wsService;
