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

export type MatchStatus = 'ACTIVE' | 'EXPIRED' | 'UNMATCHED' | 'CHAT_STARTED';

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
