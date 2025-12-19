/**
 * Matching & Discovery Types
 * Types for the swipe/match functionality
 */

// ==================== SWIPE TYPES ====================

export type SwipeDirection = 'LEFT' | 'RIGHT';

export interface SwipeRequest {
  targetUserId: number;
  direction: SwipeDirection;
}

export interface SwipeResponse {
  success: boolean;
  message: string;
  isMatch: boolean;
  matchId?: number;
  matchedUserId?: number;
  matchedUsername?: string;
  matchedUserDisplayName?: string;
  matchedUserProfilePhotoUrl?: string;
  matchedAt?: string;
  expiresAt?: string;
  swipesRemaining?: number;
}

// ==================== MATCH TYPES ====================

/**
 * Match status enum - Bumble-style flow:
 * - ACTIVE: No messages sent yet
 * - PENDING_REPLY: First message sent, waiting for other user's reply
 * - CHAT_STARTED: Both users have exchanged messages (shows in INBOX, never expires)
 * - EXPIRED: Match expired without both users messaging
 * - UNMATCHED: One user unmatched
 */
export type MatchStatus = 'ACTIVE' | 'PENDING_REPLY' | 'EXPIRED' | 'UNMATCHED' | 'CHAT_STARTED';

export interface Match {
  id: number;
  matchedUserId: number;
  matchedUsername: string;
  matchedUserDisplayName: string;
  matchedUserProfilePhotoUrl?: string;
  matchedUserAge?: number;
  matchedUserLocation?: string;
  matchedUserBio?: string;
  status: MatchStatus;
  matchedAt: string;
  expiresAt?: string;
  hoursUntilExpiration?: number;
  chatStarted: boolean;
  chatStartedAt?: string;
  conversationId?: number;

  // Bumble-style fields
  /** ID of user who sent the first message (null if no messages yet) */
  firstMessageSenderId?: number;
  /** When the first message was sent */
  firstMessageAt?: string;
  /** Whether the current user sent the first message */
  currentUserSentFirst?: boolean;
  /** Whether the current user needs to reply (other user sent first and is waiting) */
  waitingForUserReply?: boolean;
  /** Whether user is waiting for the other's reply (user sent first) */
  waitingForOtherReply?: boolean;
}

/**
 * Bumble-style categorized matches response
 * Matches are split into 4 categories for different UI sections
 */
export interface CategorizedMatches {
  /** Matches where BOTH users have messaged (shows in INBOX, never expires) */
  chatStarted: Match[];
  /** Matches where other user sent first message, waiting for user's reply */
  waitingForUserReply: Match[];
  /** Matches where user sent first message, waiting for other's reply */
  waitingForOtherReply: Match[];
  /** Completely new matches with no messages yet */
  newMatches: Match[];
}

export interface MatchStats {
  activeMatches: number;
  dailySwipesUsed: number;
  dailySwipesRemaining: number;
  dailySwipeLimit: number;
}

export interface MatchCheckResponse {
  isMatched: boolean;
  userId: number;
}

// ==================== DISCOVERY TYPES ====================

export interface DiscoveryProfile {
  userId: number;
  username: string;
  displayName: string;
  age?: number;
  city?: string;
  country?: string;
  location?: string;
  bio?: string;
  profilePhotoUrl?: string;
  additionalPhotos?: string[];
  interests?: string[];
  lookingFor?: string[];
  verified: boolean;
  online: boolean;
  hasBeenSwiped: boolean;
  hasLikedMe: boolean;
  isMatched: boolean;
  compatibilityScore?: number;
  distanceKm?: number;
}

export interface DiscoveryFilters {
  minAge?: number;
  maxAge?: number;
  city?: string;
  country?: string;
  interests?: string[];
  verifiedOnly?: boolean;
}

export interface DiscoveryStats {
  availableProfiles: number;
  likesReceived: number;
  message: string;
}

export interface LikesReceivedCount {
  count: number;
  message: string;
}

// ==================== PAGINATED RESPONSE ====================

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
