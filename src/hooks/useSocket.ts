import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import {
  connectSocket,
  disconnectSocket,
  ensureSocketConnection,
  getConnectionState,
  getCurrentUserId,
  getCurrentUsername,
  isSocketAuthenticated,
  registerSocketListener,
  socket,
} from '../services/socket';
import { SocketConnectionState, UserOfflinePayload, UserOnlinePayload } from '../types/chat';

// Session replacement payload from backend
interface SessionReplacedPayload {
  message: string;
  reason?: string;
  timestamp?: number;
}

interface UseSocketReturn {
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionState: SocketConnectionState;
  userId: number | null;
  username: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  onlineUsers: Set<number>;
  wasSessionReplaced: boolean; // True if session was replaced by another login
}

/**
 * Hook for managing Socket.IO connection state
 * Handles session replacement when user logs in from another device
 */
export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [isAuthenticated, setIsAuthenticated] = useState(isSocketAuthenticated());
  const [connectionState, setConnectionState] = useState<SocketConnectionState>(getConnectionState());
  const [userId, setUserId] = useState<number | null>(getCurrentUserId());
  const [username, setUsername] = useState<string | null>(getCurrentUsername());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [wasSessionReplaced, setWasSessionReplaced] = useState(false);

  const onlineUsersRef = useRef<Set<number>>(new Set());
  const sessionReplacedAlertShown = useRef(false);

  useEffect(() => {
    // Update state from socket
    const updateState = () => {
      setIsConnected(socket.connected);
      setIsAuthenticated(isSocketAuthenticated());
      setConnectionState(getConnectionState());
      setUserId(getCurrentUserId());
      setUsername(getCurrentUsername());
    };

    // Listen for connection events
    const cleanupConnect = registerSocketListener('connect', () => {
      setIsConnected(true);
      setConnectionState('connected');
      setWasSessionReplaced(false);
      sessionReplacedAlertShown.current = false;
    });

    const cleanupDisconnect = registerSocketListener('disconnect', () => {
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionState('disconnected');
      onlineUsersRef.current.clear();
      setOnlineUsers(new Set());
    });

    const cleanupAuthenticated = registerSocketListener('authenticated', (data: { userId: number; username: string }) => {
      setIsAuthenticated(true);
      setConnectionState('authenticated');
      setUserId(data.userId);
      setUsername(data.username);
      setWasSessionReplaced(false);
    });

    const cleanupAuthError = registerSocketListener('auth_error', () => {
      setIsAuthenticated(false);
      setConnectionState('error');
    });

    // Handle session replacement (logged in from another device)
    const cleanupSessionReplaced = registerSocketListener<SessionReplacedPayload>(
      'session_replaced',
      (payload) => {
        console.log('[useSocket] Session replaced:', payload.message);
        setWasSessionReplaced(true);
        setIsAuthenticated(false);
        setConnectionState('disconnected');

        // Show alert only once per session replacement
        if (!sessionReplacedAlertShown.current) {
          sessionReplacedAlertShown.current = true;
          Alert.alert(
            'Signed Out',
            'You have been signed in on another device. Please log in again to continue using this device.',
            [{ text: 'OK', style: 'default' }]
          );
        }
      }
    );

    // Track online users
    const cleanupUserOnline = registerSocketListener<UserOnlinePayload>('user_online', (payload) => {
      onlineUsersRef.current.add(payload.userId);
      setOnlineUsers(new Set(onlineUsersRef.current));
    });

    const cleanupUserOffline = registerSocketListener<UserOfflinePayload>('user_offline', (payload) => {
      onlineUsersRef.current.delete(payload.userId);
      setOnlineUsers(new Set(onlineUsersRef.current));
    });

    // Initial state
    updateState();

    return () => {
      cleanupConnect();
      cleanupDisconnect();
      cleanupAuthenticated();
      cleanupAuthError();
      cleanupSessionReplaced();
      cleanupUserOnline();
      cleanupUserOffline();
    };
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    return connectSocket();
  }, []);

  const disconnect = useCallback((): void => {
    disconnectSocket();
  }, []);

  return {
    isConnected,
    isAuthenticated,
    connectionState,
    userId,
    username,
    connect,
    disconnect,
    onlineUsers,
    wasSessionReplaced,
  };
};

/**
 * Hook for ensuring socket connection on mount
 */
export const useSocketConnection = (): UseSocketReturn => {
  const socketState = useSocket();

  useEffect(() => {
    // Auto-connect on mount
    ensureSocketConnection().catch(console.error);

    // Keep-alive ping every 30 seconds
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping', {});
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
    };
  }, []);

  return socketState;
};

export default useSocket;
