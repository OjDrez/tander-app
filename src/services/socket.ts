import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL, TOKEN_KEY } from '../api/config';
import {
  AuthenticatedPayload,
  SocketAuthData,
  SocketConnectionState,
  SocketError,
} from '../types/chat';

// Socket.IO Configuration
// Set this to your Socket.IO tunnel URL if using Cloudflare Tunnel for Socket.IO
// Leave empty to auto-calculate from API_BASE_URL
const SOCKET_IO_TUNNEL_URL = 'https://stuff-strategic-only-winner.trycloudflare.com';

// Socket.IO server URL
const getSocketUrl = (): string => {
  // If a specific tunnel URL is configured, use it
  if (SOCKET_IO_TUNNEL_URL) {
    return SOCKET_IO_TUNNEL_URL;
  }

  // For local development, use localhost with Socket.IO port
  try {
    const url = new URL(API_BASE_URL);

    // If using localhost or 10.0.2.2 (Android emulator), append port 9092
    if (url.hostname === 'localhost' || url.hostname === '10.0.2.2' || url.hostname === '127.0.0.1') {
      return `http://${url.hostname}:9092`;
    }

    // For tunnels (ngrok, cloudflare), Socket.IO needs its own tunnel
    // Return a placeholder that will fail gracefully
    console.warn('[Socket] Using tunnel URL but Socket.IO needs its own tunnel on port 9092');
    console.warn('[Socket] Set SOCKET_IO_TUNNEL_URL in socket.ts or run Socket.IO tunnel');
    return `${url.protocol}//${url.hostname}:9092`;
  } catch {
    return 'http://localhost:9092';
  }
};

const SOCKET_URL = getSocketUrl();

console.log('[Socket] Configured URL:', SOCKET_URL);
console.log('[Socket] Note: For tunnels, Socket.IO needs its own tunnel on port 9092');

// ==================== SOCKET INSTANCE ====================

export const socket: Socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10, // Increased for better resilience
  reconnectionDelay: 1000, // Start with 1 second
  reconnectionDelayMax: 30000, // Max 30 seconds between attempts
  randomizationFactor: 0.5, // Add jitter to prevent thundering herd
  timeout: 15000, // 15 second timeout
  autoConnect: false,
});

// ==================== CONNECTION STATE ====================

let connectionState: SocketConnectionState = 'disconnected';
let isAuthenticated = false;
let currentUserId: number | null = null;
let currentUsername: string | null = null;
let authenticationPromise: Promise<AuthenticatedPayload> | null = null;

// ==================== ROOM TRACKING FOR RECONNECTION ====================

// Track joined rooms for automatic restoration after reconnect
const joinedRooms = new Set<string>();

// ==================== EVENT LISTENERS REGISTRY ====================

type ListenerCallback<T = unknown> = (payload: T) => void;
const listeners = new Map<string, Set<ListenerCallback>>();

// ==================== CORE CONNECTION FUNCTIONS ====================

/**
 * Connect to Socket.IO server and authenticate
 */
export const connectSocket = async (): Promise<boolean> => {
  if (socket.connected && isAuthenticated) {
    console.log('[Socket] Already connected and authenticated');
    return true;
  }

  try {
    connectionState = 'connecting';

    if (!socket.connected) {
      console.log('[Socket] Connecting to server...');
      socket.connect();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        socket.once('connect', () => {
          clearTimeout(timeout);
          console.log('[Socket] Connected to server');
          connectionState = 'connected';
          resolve();
        });

        socket.once('connect_error', (error) => {
          clearTimeout(timeout);
          console.error('[Socket] Connection error:', error.message);
          connectionState = 'error';
          reject(error);
        });
      });
    }

    // Authenticate
    await authenticateSocket();
    return true;
  } catch (error) {
    console.error('[Socket] Failed to connect:', error);
    connectionState = 'error';
    return false;
  }
};

/**
 * Authenticate the socket connection with JWT token
 */
export const authenticateSocket = async (): Promise<AuthenticatedPayload> => {
  // Return existing promise if authentication is in progress
  if (authenticationPromise) {
    return authenticationPromise;
  }

  if (isAuthenticated && currentUserId) {
    return {
      success: true,
      username: currentUsername || '',
      userId: currentUserId,
      serverTime: Date.now(),
    };
  }

  authenticationPromise = new Promise(async (resolve, reject) => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('[Socket] Authenticating...');

      // Set up listeners for authentication response
      const onAuthenticated = (data: AuthenticatedPayload) => {
        console.log('[Socket] Authenticated:', data.username);
        isAuthenticated = true;
        currentUserId = data.userId;
        currentUsername = data.username;
        connectionState = 'authenticated';
        socket.off('authenticated', onAuthenticated);
        socket.off('auth_error', onAuthError);
        authenticationPromise = null;
        resolve(data);
      };

      const onAuthError = (error: SocketError) => {
        console.error('[Socket] Authentication error:', error.error);
        isAuthenticated = false;
        connectionState = 'error';
        socket.off('authenticated', onAuthenticated);
        socket.off('auth_error', onAuthError);
        authenticationPromise = null;
        reject(new Error(error.error));
      };

      socket.on('authenticated', onAuthenticated);
      socket.on('auth_error', onAuthError);

      // Send authentication request
      const authData: SocketAuthData = { token };
      socket.emit('authenticate', authData);

      // Timeout for authentication
      setTimeout(() => {
        if (!isAuthenticated) {
          socket.off('authenticated', onAuthenticated);
          socket.off('auth_error', onAuthError);
          authenticationPromise = null;
          reject(new Error('Authentication timeout'));
        }
      }, 10000);
    } catch (error) {
      authenticationPromise = null;
      reject(error);
    }
  });

  return authenticationPromise;
};

/**
 * Disconnect from Socket.IO server
 */
export const disconnectSocket = (): void => {
  console.log('[Socket] Disconnecting...');
  socket.disconnect();
  isAuthenticated = false;
  currentUserId = null;
  currentUsername = null;
  connectionState = 'disconnected';
  authenticationPromise = null;
};

/**
 * Ensure socket is connected and authenticated
 */
export const ensureSocketConnection = async (): Promise<boolean> => {
  if (!socket.connected) {
    return connectSocket();
  }

  if (!isAuthenticated) {
    try {
      await authenticateSocket();
      return true;
    } catch {
      return false;
    }
  }

  return true;
};

// ==================== LISTENER MANAGEMENT ====================

/**
 * Register a socket event listener with automatic cleanup support
 */
export const registerSocketListener = <T = unknown>(
  event: string,
  callback: ListenerCallback<T>
): (() => void) => {
  // Add to our registry
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(callback as ListenerCallback);

  // Register with socket
  socket.on(event, callback);

  // Return cleanup function
  return () => {
    socket.off(event, callback);
    listeners.get(event)?.delete(callback as ListenerCallback);
  };
};

/**
 * Remove all listeners for an event
 */
export const removeAllListeners = (event: string): void => {
  socket.off(event);
  listeners.delete(event);
};

// ==================== MESSAGE FUNCTIONS ====================

/**
 * Send a chat message with proper acknowledgement handling
 */
export const sendMessage = (
  roomId: string,
  text: string,
  receiverId?: number
): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!socket.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // If we timeout but socket is connected, assume message was sent
        // The server should have received it
        if (socket.connected) {
          console.log('[Socket] Message send timeout, assuming success');
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Connection lost' });
        }
      }
    }, 10000); // 10 second timeout

    socket.emit(
      'send-message',
      {
        roomId,
        receiverId,
        text,
        timestamp: Date.now(),
      },
      (response: { success: boolean; messageId?: string; error?: string }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(response);
        }
      }
    );
  });
};

/**
 * Send typing indicator
 */
export const sendTypingIndicator = (
  conversationId: string,
  receiverId: number,
  isTyping: boolean
): void => {
  if (!isAuthenticated) return;

  socket.emit('typing', {
    conversationId,
    receiverId,
    isTyping,
  });
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = (conversationId: string): void => {
  if (!isAuthenticated) return;

  socket.emit('mark_read', { conversationId });
};

/**
 * Mark message as delivered
 */
export const markMessageDelivered = (messageId: number): void => {
  if (!isAuthenticated) return;

  socket.emit('mark_delivered', messageId);
};

// ==================== ROOM FUNCTIONS ====================

/**
 * Join a chat room
 * Tracks room for automatic restoration after reconnect
 */
export const joinRoom = (roomId: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!socket.connected) {
      resolve({ success: false, error: 'Not connected' });
      return;
    }

    // Track room for reconnection restoration
    joinedRooms.add(roomId);

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // If connected, assume success
        if (socket.connected) {
          resolve({ success: true });
        } else {
          joinedRooms.delete(roomId);
          resolve({ success: false, error: 'Connection lost' });
        }
      }
    }, 5000);

    socket.emit('join-room', { roomId }, (response: { success: boolean; error?: string }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        if (!response.success) {
          joinedRooms.delete(roomId); // Remove if join failed
        }
        resolve(response);
      }
    });
  });
};

/**
 * Leave a chat room
 */
export const leaveRoom = (roomId: string): void => {
  joinedRooms.delete(roomId); // Remove from tracking
  socket.emit('leave-room', { roomId });
};

/**
 * Get all currently joined rooms
 */
export const getJoinedRooms = (): string[] => {
  return Array.from(joinedRooms);
};

/**
 * Clear all joined rooms (used on disconnect)
 */
export const clearJoinedRooms = (): void => {
  joinedRooms.clear();
};

/**
 * Generate room ID for direct messages
 */
export const generateDirectRoomId = (userId1: number, userId2: number): string => {
  const minId = Math.min(userId1, userId2);
  const maxId = Math.max(userId1, userId2);
  return `dm_${minId}_${maxId}`;
};

// ==================== CALL FUNCTIONS ====================

/**
 * Initiate a call with proper timeout handling
 */
export const initiateCall = (
  targetUserId: number,
  callType: 'video' | 'audio',
  callerName?: string
): Promise<{ success: boolean; roomId?: string; callId?: number; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!socket.connected) {
      resolve({ success: false, error: 'Not connected to server' });
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve({ success: false, error: 'Call initiation timeout' });
      }
    }, 15000); // 15 second timeout for call initiation

    socket.emit(
      'call-user',
      {
        targetUserId,
        callType,
        callerName,
      },
      (response: { success: boolean; roomId?: string; callId?: number; error?: string }) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve(response);
        }
      }
    );
  });
};

/**
 * Answer an incoming call with proper timeout handling
 */
export const answerCall = (roomId?: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    if (!socket.connected) {
      resolve({ success: false, error: 'Not connected to server' });
      return;
    }

    let resolved = false;
    const timeoutId = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        // If we're still connected, assume success
        if (socket.connected) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: 'Connection lost while answering' });
        }
      }
    }, 10000);

    socket.emit('answer-call', { roomId }, (response: { success: boolean; error?: string }) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeoutId);
        resolve(response);
      }
    });
  });
};

/**
 * Reject an incoming call
 */
export const rejectCall = (roomId?: string, reason: string = 'rejected'): void => {
  socket.emit('reject-call', { roomId, reason });
};

/**
 * End an active call
 */
export const endCall = (roomId?: string, reason: string = 'ended'): void => {
  socket.emit('end-call', { roomId, reason });
};

/**
 * Send WebRTC offer
 */
export const sendOffer = (roomId: string, sdp: string, type: string = 'offer'): void => {
  socket.emit('make-offer', { roomId, sdp, type });
};

/**
 * Send WebRTC answer
 */
export const sendAnswer = (roomId: string, sdp: string, type: string = 'answer'): void => {
  socket.emit('make-answer', { roomId, sdp, type });
};

/**
 * Send ICE candidate
 */
export const sendIceCandidate = (
  roomId: string,
  candidate: string,
  sdpMid: string,
  sdpMLineIndex: number
): void => {
  socket.emit('ice-candidate', { roomId, candidate, sdpMid, sdpMLineIndex });
};

// ==================== GROUP FUNCTIONS ====================

/**
 * Create a group chat
 */
export const createGroupChat = (
  name: string,
  memberIds: number[],
  maxMembers?: number
): Promise<{ success: boolean; roomId?: string; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    socket.emit(
      'create-group',
      { name, memberIds, maxMembers },
      (response: { success: boolean; roomId?: string; error?: string }) => {
        resolve(response);
      }
    );

    setTimeout(() => {
      resolve({ success: false, error: 'Group creation timeout' });
    }, 10000);
  });
};

/**
 * Perform group action (add/remove member, leave, etc.)
 */
export const performGroupAction = (
  roomId: string,
  action: string,
  targetUserId?: number
): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    if (!isAuthenticated) {
      resolve({ success: false, error: 'Not authenticated' });
      return;
    }

    socket.emit(
      'group-action',
      { roomId, action, targetUserId },
      (response: { success: boolean; error?: string }) => {
        resolve(response);
      }
    );

    setTimeout(() => resolve({ success: true }), 5000);
  });
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Send ping to keep connection alive
 */
export const sendPing = (): void => {
  socket.emit('ping', {});
};

/**
 * Get current connection state
 */
export const getConnectionState = (): SocketConnectionState => connectionState;

/**
 * Check if authenticated
 */
export const isSocketAuthenticated = (): boolean => isAuthenticated;

/**
 * Get current user ID
 */
export const getCurrentUserId = (): number | null => currentUserId;

/**
 * Get current username
 */
export const getCurrentUsername = (): string | null => currentUsername;

// ==================== BUILT-IN EVENT HANDLERS ====================

// Handle connection events
socket.on('connect', () => {
  console.log('[Socket] Connected');
  connectionState = 'connected';
});

socket.on('disconnect', (reason) => {
  console.log('[Socket] Disconnected:', reason);
  connectionState = 'disconnected';
  isAuthenticated = false;
  // Note: We don't clear currentUserId/currentUsername here
  // to allow for reconnection with the same identity
  // They will be updated on successful re-authentication
});

// Track connection error count to avoid log spam
let connectionErrorCount = 0;

socket.on('connect_error', (error) => {
  connectionErrorCount++;
  if (connectionErrorCount <= 3) {
    console.warn('[Socket] Connection error:', error.message);
  } else if (connectionErrorCount === 4) {
    console.warn('[Socket] Socket.IO unavailable - chat will use REST API');
  }
  connectionState = 'error';
});

socket.on('reconnect', (attemptNumber) => {
  console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
  connectionErrorCount = 0; // Reset error count on successful reconnect

  // Re-authenticate and restore room subscriptions
  authenticateSocket()
    .then(() => {
      // Restore all room subscriptions after successful auth
      const rooms = Array.from(joinedRooms);
      if (rooms.length > 0) {
        console.log('[Socket] Restoring', rooms.length, 'room subscriptions...');
        rooms.forEach((roomId) => {
          socket.emit('join-room', { roomId }, (response: { success: boolean; error?: string }) => {
            if (response.success) {
              console.log('[Socket] Restored room:', roomId);
            } else {
              console.warn('[Socket] Failed to restore room:', roomId, response.error);
              joinedRooms.delete(roomId);
            }
          });
        });
      }
    })
    .catch((err) => {
      console.error('[Socket] Re-authentication failed after reconnect:', err);
    });
});

socket.on('reconnect_error', (error) => {
  // Only log first few reconnection errors
  if (connectionErrorCount <= 3) {
    console.warn('[Socket] Reconnection error:', error.message);
  }
});

socket.on('session_replaced', (data) => {
  console.log('[Socket] Session replaced:', data.message);
  disconnectSocket();
});

socket.on('error', (data: SocketError) => {
  console.error('[Socket] Error:', data.error);
});

socket.on('pong', (data) => {
  console.log('[Socket] Pong received, server time:', data.serverTime);
});

export default socket;
