/**
 * Real-Time Matching Service
 *
 * Provides real-time notifications for:
 * - New matches
 * - Match expiration warnings
 * - Profile views / "Who liked you" alerts
 * - Chat started confirmations
 *
 * Uses Raw WebSocket for Azure deployment.
 */

import { wsService } from './websocket';
import { isConnected, getCurrentUserId } from './chatService';
import notificationService from './notificationService';
import { SwipeResponse } from '../types/matching';

// Event types for real-time matching
export interface RealTimeMatchEvent {
  type: 'new_match' | 'match_expiring' | 'match_expired' | 'profile_liked' | 'chat_started';
  matchId?: number;
  userId?: number;
  userName?: string;
  userPhoto?: string;
  message?: string;
  hoursRemaining?: number;
  timestamp: number;
}

export interface MatchExpirationWarning {
  matchId: number;
  matchedUserId: number;
  matchedUserName: string;
  hoursRemaining: number;
  isUrgent: boolean; // < 6 hours
}

// Callback types
type MatchEventCallback = (event: RealTimeMatchEvent) => void;
type NewMatchCallback = (match: SwipeResponse) => void;
type ExpirationCallback = (warning: MatchExpirationWarning) => void;

class RealTimeMatchingService {
  private listeners: Map<string, Set<MatchEventCallback>> = new Map();
  private newMatchListeners: Set<NewMatchCallback> = new Set();
  private expirationListeners: Set<ExpirationCallback> = new Set();
  private cleanupFunctions: (() => void)[] = [];
  private isInitialized = false;
  private expirationCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Initialize the real-time matching service
   * Call this after socket authentication
   */
  initialize(): void {
    if (this.isInitialized) {
      console.log('[RealTimeMatching] Already initialized');
      return;
    }

    console.log('[RealTimeMatching] Initializing real-time matching service');

    // Listen for matching-related events via global message handler
    const cleanupGlobal = wsService.onMessage((message: any) => {
      switch (message.type) {
        case 'new_match':
          console.log('[RealTimeMatching] New match received:', message);
          this.handleNewMatch(this.transformToEvent(message, 'new_match'));
          break;
        case 'match_expiring':
          console.log('[RealTimeMatching] Match expiring warning:', message);
          this.handleExpirationWarning(this.transformToWarning(message));
          break;
        case 'match_expired':
          console.log('[RealTimeMatching] Match expired:', message);
          this.handleMatchExpired(this.transformToEvent(message, 'match_expired'));
          break;
        case 'profile_liked':
          console.log('[RealTimeMatching] Profile liked:', message);
          this.handleProfileLiked(this.transformToEvent(message, 'profile_liked'));
          break;
        case 'chat_started':
          console.log('[RealTimeMatching] Chat started for match:', message);
          this.handleChatStarted(this.transformToEvent(message, 'chat_started'));
          break;
      }
    });
    this.cleanupFunctions.push(cleanupGlobal);

    this.isInitialized = true;
    console.log('[RealTimeMatching] Service initialized successfully');
  }

  private transformToEvent(message: any, type: RealTimeMatchEvent['type']): RealTimeMatchEvent {
    return {
      type,
      matchId: message.matchId,
      userId: message.userId,
      userName: message.userName || message.username,
      userPhoto: message.userPhoto,
      message: message.message,
      hoursRemaining: message.hoursRemaining,
      timestamp: message.timestamp || Date.now(),
    };
  }

  private transformToWarning(message: any): MatchExpirationWarning {
    return {
      matchId: message.matchId,
      matchedUserId: message.matchedUserId || message.userId,
      matchedUserName: message.matchedUserName || message.userName,
      hoursRemaining: message.hoursRemaining || 0,
      isUrgent: message.isUrgent || message.hoursRemaining < 6,
    };
  }

  /**
   * Cleanup all listeners and intervals
   */
  cleanup(): void {
    console.log('[RealTimeMatching] Cleaning up service');

    this.cleanupFunctions.forEach((cleanup) => cleanup());
    this.cleanupFunctions = [];
    this.listeners.clear();
    this.newMatchListeners.clear();
    this.expirationListeners.clear();

    if (this.expirationCheckInterval) {
      clearInterval(this.expirationCheckInterval);
      this.expirationCheckInterval = null;
    }

    this.isInitialized = false;
  }

  // ==================== EVENT HANDLERS ====================

  private handleNewMatch(event: RealTimeMatchEvent): void {
    // Show a celebratory notification
    if (event.userName) {
      notificationService.sendMatchCelebration(event.userName, event.userId || 0);
    }

    // Notify all listeners
    this.notifyListeners('new_match', event);

    // Notify specific new match listeners
    this.newMatchListeners.forEach((callback) => {
      const matchResponse: SwipeResponse = {
        success: true,
        message: "It's a match!",
        isMatch: true,
        matchId: event.matchId,
        matchedUserId: event.userId,
        matchedUserDisplayName: event.userName,
        matchedUserProfilePhotoUrl: event.userPhoto,
        matchedAt: new Date(event.timestamp).toISOString(),
      };
      callback(matchResponse);
    });
  }

  private handleExpirationWarning(warning: MatchExpirationWarning): void {
    const event: RealTimeMatchEvent = {
      type: 'match_expiring',
      matchId: warning.matchId,
      userId: warning.matchedUserId,
      userName: warning.matchedUserName,
      hoursRemaining: warning.hoursRemaining,
      timestamp: Date.now(),
      message: warning.isUrgent
        ? `Your match with ${warning.matchedUserName} expires very soon! Say hello now!`
        : `Your match with ${warning.matchedUserName} expires in ${warning.hoursRemaining} hours`,
    };

    // Send local notification - senior friendly with urgency
    if (warning.isUrgent) {
      // Send immediate urgent notification
      this.sendUrgentExpirationNotification(warning);
    }

    this.notifyListeners('match_expiring', event);
    this.expirationListeners.forEach((callback) => callback(warning));
  }

  private handleMatchExpired(event: RealTimeMatchEvent): void {
    this.notifyListeners('match_expired', event);
  }

  private handleProfileLiked(event: RealTimeMatchEvent): void {
    // Send a gentle notification that someone likes them
    this.sendSomeoneLikedYouNotification(event);
    this.notifyListeners('profile_liked', event);
  }

  private handleChatStarted(event: RealTimeMatchEvent): void {
    // Positive reinforcement notification
    this.notifyListeners('chat_started', event);
  }

  // ==================== NOTIFICATIONS (SENIOR FRIENDLY) ====================

  private async sendUrgentExpirationNotification(warning: MatchExpirationWarning): Promise<void> {
    try {
      const title = 'Time Running Out!';
      const body = warning.hoursRemaining < 1
        ? `Your connection with ${warning.matchedUserName} will disappear in less than 1 hour. Tap here to say hello!`
        : `Only ${Math.ceil(warning.hoursRemaining)} hours left to message ${warning.matchedUserName}. Don't miss your chance!`;

      await notificationService.sendNewMessageNotification(
        title,
        body,
        0,
        warning.matchedUserId
      );
    } catch (error) {
      console.error('[RealTimeMatching] Failed to send urgent notification:', error);
    }
  }

  private async sendSomeoneLikedYouNotification(event: RealTimeMatchEvent): Promise<void> {
    try {
      const title = 'Someone is Interested!';
      const body = 'Someone liked your profile. Keep browsing to find your match!';

      await notificationService.sendNewMessageNotification(
        title,
        body,
        0,
        event.userId || 0
      );
    } catch (error) {
      console.error('[RealTimeMatching] Failed to send liked notification:', error);
    }
  }

  // ==================== LISTENER MANAGEMENT ====================

  /**
   * Subscribe to all match events
   */
  onMatchEvent(callback: MatchEventCallback): () => void {
    const allEvents = ['new_match', 'match_expiring', 'match_expired', 'profile_liked', 'chat_started'];

    allEvents.forEach((event) => {
      if (!this.listeners.has(event)) {
        this.listeners.set(event, new Set());
      }
      this.listeners.get(event)!.add(callback);
    });

    return () => {
      allEvents.forEach((event) => {
        this.listeners.get(event)?.delete(callback);
      });
    };
  }

  /**
   * Subscribe to new match events specifically
   */
  onNewMatch(callback: NewMatchCallback): () => void {
    this.newMatchListeners.add(callback);
    return () => {
      this.newMatchListeners.delete(callback);
    };
  }

  /**
   * Subscribe to match expiration warnings
   */
  onMatchExpiring(callback: ExpirationCallback): () => void {
    this.expirationListeners.add(callback);
    return () => {
      this.expirationListeners.delete(callback);
    };
  }

  private notifyListeners(eventType: string, event: RealTimeMatchEvent): void {
    this.listeners.get(eventType)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[RealTimeMatching] Listener error:', error);
      }
    });
  }

  // ==================== EMIT EVENTS TO SERVER ====================

  /**
   * Notify server that a match's chat has been started
   */
  notifyChatStarted(matchId: number, conversationId: number, otherUserId: number): void {
    if (!isConnected()) {
      console.warn('[RealTimeMatching] Not connected, cannot notify chat started');
      return;
    }

    console.log('[RealTimeMatching] Notifying chat started for match', matchId, 'with user', otherUserId);

    // Send via raw WebSocket - the backend would need to handle this message type
    // For now, this is a placeholder since the backend may not have this implemented yet
    console.log('[RealTimeMatching] Note: match_chat_started event not yet implemented in raw WS backend');
  }

  /**
   * Request expiration check for user's matches
   */
  requestExpirationCheck(): void {
    if (!isConnected()) {
      return;
    }

    // This would need backend support - for now it's a no-op
    console.log('[RealTimeMatching] Note: check_match_expirations not yet implemented in raw WS backend');
  }

  // ==================== UTILITY ====================

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized && isConnected();
  }

  /**
   * Get service status
   */
  getStatus(): { initialized: boolean; authenticated: boolean; listenerCount: number } {
    let totalListeners = 0;
    this.listeners.forEach((set) => {
      totalListeners += set.size;
    });
    totalListeners += this.newMatchListeners.size;
    totalListeners += this.expirationListeners.size;

    return {
      initialized: this.isInitialized,
      authenticated: isConnected(),
      listenerCount: totalListeners,
    };
  }
}

// Export singleton instance
export const realtimeMatchingService = new RealTimeMatchingService();
export default realtimeMatchingService;
