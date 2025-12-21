/**
 * RealTimeProvider - Global WebSocket & Matching Service Initialization
 *
 * This provider ensures that:
 * 1. WebSocket connection is established when user is authenticated
 * 2. Real-time matching service is initialized globally
 * 3. App state changes (background/foreground) handle reconnection
 * 4. Token refresh triggers re-authentication
 *
 * Uses Raw WebSocket for Azure deployment.
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthContext } from '../auth/AuthContext';
import { realtimeMatchingService, RealTimeMatchEvent } from '../services/realtimeMatchingService';
import notificationService from '../services/notificationService';
import { wsService } from '../services/websocket';

// Enable real-time features for Azure deployment
// Set to true to disable and use REST API polling instead
const REALTIME_DISABLED = false;

// Fallback to REST-only mode after this many failed WebSocket attempts
const MAX_WEBSOCKET_FAILURES_BEFORE_FALLBACK = 3;

interface RealTimeContextValue {
  isConnected: boolean;
  isSocketReady: boolean;
  connectionState: string;
  lastMatchEvent: RealTimeMatchEvent | null;
  reconnect: () => Promise<void>;
  getServiceStatus: () => { socket: boolean; matching: boolean };
  usingRestFallback: boolean;
}

const RealTimeContext = createContext<RealTimeContextValue | undefined>(undefined);

interface RealTimeProviderProps {
  children: ReactNode;
}

export const RealTimeProvider: React.FC<RealTimeProviderProps> = ({ children }) => {
  const { isAuthenticated, token } = useAuthContext();
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketReady, setIsSocketReady] = useState(false);
  const [lastMatchEvent, setLastMatchEvent] = useState<RealTimeMatchEvent | null>(null);

  // Track app state for reconnection
  const appState = useRef(AppState.currentState);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track if we've already initialized to prevent duplicate connections
  const isInitializing = useRef(false);
  const matchEventUnsubscribe = useRef<(() => void) | null>(null);
  const connectionUnsubscribe = useRef<(() => void) | null>(null);

  // Track WebSocket failures for fallback decision
  const websocketFailures = useRef(0);
  const [usingRestFallback, setUsingRestFallback] = useState(false);

  /**
   * Get current connection state
   */
  const getConnectionState = useCallback((): string => {
    return wsService.getConnectionState();
  }, []);

  /**
   * Check if socket is authenticated/ready
   */
  const isSocketAuthenticated = useCallback((): boolean => {
    return wsService.isConnected();
  }, []);

  /**
   * Initialize socket and real-time services
   */
  const initializeRealTimeServices = useCallback(async () => {
    // Skip if real-time is disabled
    if (REALTIME_DISABLED) {
      console.log('[RealTimeProvider] Real-time disabled, using REST API only');
      return;
    }

    if (!isAuthenticated || !token) {
      console.log('[RealTimeProvider] Not authenticated, skipping initialization');
      return;
    }

    // Prevent duplicate initialization
    if (isInitializing.current) {
      console.log('[RealTimeProvider] Already initializing, skipping...');
      return;
    }

    isInitializing.current = true;

    try {
      console.log('[RealTimeProvider] Initializing real-time services...');

      const connected = await wsService.connect();

      // Subscribe to connection state changes
      if (connectionUnsubscribe.current) {
        connectionUnsubscribe.current();
      }
      connectionUnsubscribe.current = wsService.onConnectionStateChange((state) => {
        console.log('[RealTimeProvider] WebSocket connection state:', state);
        setIsConnected(state === 'connected');
        setIsSocketReady(state === 'connected');
      });

      if (connected) {
        console.log('[RealTimeProvider] WebSocket connected successfully');
        setIsConnected(true);
        setIsSocketReady(true);
        reconnectAttempts.current = 0;
        websocketFailures.current = 0;

        // Initialize real-time matching service (only if not already initialized)
        if (!realtimeMatchingService.isReady()) {
          realtimeMatchingService.initialize();
          console.log('[RealTimeProvider] Real-time matching service initialized');
        }

        // Cleanup previous subscription if exists
        if (matchEventUnsubscribe.current) {
          matchEventUnsubscribe.current();
        }

        // Subscribe to match events for global state
        matchEventUnsubscribe.current = realtimeMatchingService.onMatchEvent((event) => {
          console.log('[RealTimeProvider] Match event received:', event.type);
          setLastMatchEvent(event);
        });

        // Request initial expiration check (only once)
        setTimeout(() => {
          realtimeMatchingService.requestExpirationCheck();
        }, 2000);
      } else {
        console.warn('[RealTimeProvider] WebSocket connection failed');
        websocketFailures.current++;
        setIsConnected(false);
        setIsSocketReady(false);

        // Check if we should fall back to REST-only mode
        if (websocketFailures.current >= MAX_WEBSOCKET_FAILURES_BEFORE_FALLBACK) {
          console.log('[RealTimeProvider] Switching to REST-only mode after', websocketFailures.current, 'WebSocket failures');
          setUsingRestFallback(true);
          // App will continue to work via REST API - just no real-time updates
        } else {
          scheduleReconnect();
        }
      }
    } catch (error) {
      console.error('[RealTimeProvider] Error initializing real-time services:', error);
      setIsConnected(false);
      setIsSocketReady(false);
      scheduleReconnect();
    } finally {
      isInitializing.current = false;
    }
  }, [isAuthenticated, token]);

  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  const scheduleReconnect = useCallback(() => {
    // Don't reconnect if real-time is disabled
    if (REALTIME_DISABLED) {
      return;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('[RealTimeProvider] Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    console.log(`[RealTimeProvider] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);

    reconnectTimeoutRef.current = setTimeout(async () => {
      reconnectAttempts.current++;
      await initializeRealTimeServices();
    }, delay);
  }, [initializeRealTimeServices]);

  /**
   * Manual reconnect function
   */
  const reconnect = useCallback(async () => {
    console.log('[RealTimeProvider] Manual reconnect requested');
    reconnectAttempts.current = 0;
    websocketFailures.current = 0;
    setUsingRestFallback(false);
    await initializeRealTimeServices();
  }, [initializeRealTimeServices]);

  /**
   * Get service status
   */
  const getServiceStatus = useCallback(() => {
    return {
      socket: isSocketAuthenticated(),
      matching: realtimeMatchingService.isReady(),
    };
  }, [isSocketAuthenticated]);

  /**
   * Handle app state changes (foreground/background)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log('[RealTimeProvider] App state changed:', appState.current, '->', nextAppState);

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground
        console.log('[RealTimeProvider] App came to foreground, checking connection...');

        if (isAuthenticated && !isSocketAuthenticated()) {
          console.log('[RealTimeProvider] WebSocket disconnected while in background, reconnecting...');
          reconnect();
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, reconnect, isSocketAuthenticated]);

  /**
   * Initialize services when authenticated
   */
  useEffect(() => {
    if (isAuthenticated && token) {
      initializeRealTimeServices();
    } else {
      // Cleanup when logged out
      console.log('[RealTimeProvider] User logged out, cleaning up...');

      // Cleanup subscriptions
      if (matchEventUnsubscribe.current) {
        matchEventUnsubscribe.current();
        matchEventUnsubscribe.current = null;
      }

      if (connectionUnsubscribe.current) {
        connectionUnsubscribe.current();
        connectionUnsubscribe.current = null;
      }

      realtimeMatchingService.cleanup();
      wsService.disconnect();

      setIsConnected(false);
      setIsSocketReady(false);
      setLastMatchEvent(null);
      isInitializing.current = false;
    }

    return () => {
      if (matchEventUnsubscribe.current) {
        matchEventUnsubscribe.current();
        matchEventUnsubscribe.current = null;
      }
      if (connectionUnsubscribe.current) {
        connectionUnsubscribe.current();
        connectionUnsubscribe.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, token, initializeRealTimeServices]);

  /**
   * Re-initialize when token changes (token refresh)
   */
  useEffect(() => {
    if (isAuthenticated && token && isConnected) {
      // Token refreshed while connected - re-authenticate socket
      console.log('[RealTimeProvider] Token refreshed, re-authenticating...');
      // Raw WebSocket handles re-authentication automatically on reconnect
    }
  }, [token, isAuthenticated, isConnected]);

  /**
   * Initialize notification permissions on mount
   */
  useEffect(() => {
    notificationService.requestPermissions()
      .then((granted) => console.log('[RealTimeProvider] Notification permissions:', granted ? 'granted' : 'denied'))
      .catch((err) => console.error('[RealTimeProvider] Notification permission error:', err));
  }, []);

  const contextValue: RealTimeContextValue = {
    isConnected,
    isSocketReady,
    connectionState: getConnectionState(),
    lastMatchEvent,
    reconnect,
    getServiceStatus,
    usingRestFallback,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
};

/**
 * Hook to access real-time context
 */
export const useRealTime = (): RealTimeContextValue => {
  const context = useContext(RealTimeContext);
  if (!context) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
};

export default RealTimeProvider;
