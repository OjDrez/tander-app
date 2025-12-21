import { useCallback, useEffect, useState } from 'react';
import {
  connect as chatServiceConnect,
  disconnect as chatServiceDisconnect,
  getConnectionState,
  getCurrentUserId,
  getCurrentUsername,
  isConnected,
  getOnlineUsers,
  subscribeToOnlineUsers,
  onConnectionStateChange,
  ConnectionState,
} from '../services/chatService';

interface UseSocketReturn {
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionState: ConnectionState;
  userId: number | null;
  username: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  onlineUsers: Set<number>;
  wasSessionReplaced: boolean; // True if session was replaced by another login
}

/**
 * Hook for managing WebSocket connection state
 * Supports both STOMP (Azure) and Socket.IO (legacy)
 */
export const useSocket = (): UseSocketReturn => {
  const [isConnectedState, setIsConnected] = useState(isConnected());
  const [isAuthenticated, setIsAuthenticated] = useState(isConnected());
  const [connectionState, setConnectionState] = useState<ConnectionState>(getConnectionState());
  const [userId, setUserId] = useState<number | null>(getCurrentUserId());
  const [username, setUsername] = useState<string | null>(getCurrentUsername());
  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(getOnlineUsers());
  const [wasSessionReplaced, setWasSessionReplaced] = useState(false);
  const [sessionReplacedAlertShown, setSessionReplacedAlertShown] = useState(false);

  useEffect(() => {
    // Subscribe to online users changes
    const unsubscribeOnlineUsers = subscribeToOnlineUsers((users) => {
      console.log('[useSocket] Online users updated:', users.size, 'users');
      setOnlineUsers(users);
    });

    // Subscribe to connection state changes
    const unsubscribeConnection = onConnectionStateChange((state) => {
      console.log('[useSocket] Connection state changed:', state);
      setConnectionState(state);

      const connected = state === 'connected' || state === 'authenticated';
      setIsConnected(connected);
      setIsAuthenticated(connected);

      if (connected) {
        setWasSessionReplaced(false);
        setSessionReplacedAlertShown(false);
        setUserId(getCurrentUserId());
        setUsername(getCurrentUsername());
      } else if (state === 'disconnected') {
        setIsAuthenticated(false);
      } else if (state === 'error') {
        setIsAuthenticated(false);
      }
    });

    // Note: Session replacement handling would need to be implemented
    // in the STOMP service if needed for Azure deployment

    return () => {
      unsubscribeOnlineUsers();
      unsubscribeConnection();
    };
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    return chatServiceConnect();
  }, []);

  const disconnect = useCallback((): void => {
    chatServiceDisconnect();
  }, []);

  return {
    isConnected: isConnectedState,
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
 * Hook for accessing socket connection state
 * NOTE: Does NOT auto-connect - RealTimeProvider handles connection globally
 * This hook only provides access to connection state and online users
 */
export const useSocketConnection = (): UseSocketReturn => {
  const socketState = useSocket();

  // NOTE: Removed auto-connect, ping intervals, and online user refresh intervals
  // These are now handled globally by:
  // - RealTimeProvider: handles connection/reconnection
  // - socket.ts: has built-in heartbeat (HEARTBEAT_INTERVAL = 25s)
  // - socket.ts: requests online users on reconnect
  // Having multiple components call these causes connection flooding

  return socketState;
};

export default useSocket;
