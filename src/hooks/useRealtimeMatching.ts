/**
 * useRealtimeMatching Hook
 *
 * React hook for real-time matching notifications.
 * Provides easy access to:
 * - New match events
 * - Match expiration warnings
 * - Profile interest notifications
 *
 * Optimized for seniors with clear state management
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  realtimeMatchingService,
  RealTimeMatchEvent,
  MatchExpirationWarning,
} from '../services/realtimeMatchingService';
import { connect as connectSocket, isConnected as isSocketAuthenticated } from '../services/chatService';
import { SwipeResponse } from '../types/matching';

interface UseRealtimeMatchingResult {
  // State
  isConnected: boolean;
  lastMatchEvent: RealTimeMatchEvent | null;
  expiringMatches: MatchExpirationWarning[];
  newMatchAlert: SwipeResponse | null;

  // Actions
  clearNewMatchAlert: () => void;
  clearExpiringMatch: (matchId: number) => void;
  checkExpirations: () => void;
  notifyChatStarted: (matchId: number, conversationId: number, otherUserId: number) => void;

  // Connection management
  reconnect: () => Promise<void>;
}

interface UseRealtimeMatchingOptions {
  autoConnect?: boolean;
  onNewMatch?: (match: SwipeResponse) => void;
  onMatchExpiring?: (warning: MatchExpirationWarning) => void;
  onMatchEvent?: (event: RealTimeMatchEvent) => void;
}

export function useRealtimeMatching(
  options: UseRealtimeMatchingOptions = {}
): UseRealtimeMatchingResult {
  const { autoConnect = true, onNewMatch, onMatchExpiring, onMatchEvent } = options;

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [lastMatchEvent, setLastMatchEvent] = useState<RealTimeMatchEvent | null>(null);
  const [expiringMatches, setExpiringMatches] = useState<MatchExpirationWarning[]>([]);
  const [newMatchAlert, setNewMatchAlert] = useState<SwipeResponse | null>(null);

  // Refs for callbacks to avoid stale closures
  const onNewMatchRef = useRef(onNewMatch);
  const onMatchExpiringRef = useRef(onMatchExpiring);
  const onMatchEventRef = useRef(onMatchEvent);

  // Update refs when callbacks change
  useEffect(() => {
    onNewMatchRef.current = onNewMatch;
    onMatchExpiringRef.current = onMatchExpiring;
    onMatchEventRef.current = onMatchEvent;
  }, [onNewMatch, onMatchExpiring, onMatchEvent]);

  // Initialize connection and service
  const initialize = useCallback(async () => {
    try {
      if (!isSocketAuthenticated()) {
        const connected = await connectSocket();
        if (!connected) {
          console.warn('[useRealtimeMatching] Failed to connect socket');
          setIsConnected(false);
          return;
        }
      }

      realtimeMatchingService.initialize();
      setIsConnected(true);
    } catch (error) {
      console.error('[useRealtimeMatching] Initialization error:', error);
      setIsConnected(false);
    }
  }, []);

  // Reconnect function
  const reconnect = useCallback(async () => {
    realtimeMatchingService.cleanup();
    await initialize();
  }, [initialize]);

  // Clear new match alert
  const clearNewMatchAlert = useCallback(() => {
    setNewMatchAlert(null);
  }, []);

  // Clear specific expiring match
  const clearExpiringMatch = useCallback((matchId: number) => {
    setExpiringMatches((prev) => prev.filter((m) => m.matchId !== matchId));
  }, []);

  // Manual expiration check
  const checkExpirations = useCallback(() => {
    realtimeMatchingService.requestExpirationCheck();
  }, []);

  // Notify server that chat has started for a match
  const notifyChatStarted = useCallback((matchId: number, conversationId: number, otherUserId: number) => {
    realtimeMatchingService.notifyChatStarted(matchId, conversationId, otherUserId);
  }, []);

  // Setup effect
  useEffect(() => {
    if (!autoConnect) return;

    initialize();

    // Subscribe to events
    const unsubscribeNewMatch = realtimeMatchingService.onNewMatch((match) => {
      console.log('[useRealtimeMatching] New match received');
      setNewMatchAlert(match);
      onNewMatchRef.current?.(match);
    });

    const unsubscribeExpiring = realtimeMatchingService.onMatchExpiring((warning) => {
      console.log('[useRealtimeMatching] Match expiring warning');
      setExpiringMatches((prev) => {
        // Update existing or add new
        const existing = prev.find((m) => m.matchId === warning.matchId);
        if (existing) {
          return prev.map((m) => (m.matchId === warning.matchId ? warning : m));
        }
        return [...prev, warning];
      });
      onMatchExpiringRef.current?.(warning);
    });

    const unsubscribeEvents = realtimeMatchingService.onMatchEvent((event) => {
      setLastMatchEvent(event);
      onMatchEventRef.current?.(event);
    });

    // Handle app state changes (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground, check connection
        const status = realtimeMatchingService.getStatus();
        setIsConnected(status.initialized && status.authenticated);

        // Check for any missed expirations
        if (status.authenticated) {
          realtimeMatchingService.requestExpirationCheck();
        }
      }
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribeNewMatch();
      unsubscribeExpiring();
      unsubscribeEvents();
      appStateSubscription.remove();
    };
  }, [autoConnect, initialize]);

  // Periodically update connection status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = realtimeMatchingService.getStatus();
      setIsConnected(status.initialized && status.authenticated);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    isConnected,
    lastMatchEvent,
    expiringMatches,
    newMatchAlert,
    clearNewMatchAlert,
    clearExpiringMatch,
    checkExpirations,
    notifyChatStarted,
    reconnect,
  };
}

export default useRealtimeMatching;
