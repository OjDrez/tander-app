import apiClient from './config';

// Types
export type Language = 'en' | 'tl';

export interface TandyMessageDTO {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface QuickActionDTO {
  text: string;
  action: string;
}

export interface TandyConversationDTO {
  id: number;
  language: Language;
  messages: TandyMessageDTO[];
  createdAt: string;
  updatedAt: string;
  greeting: string;
  quickActions: QuickActionDTO[];
}

export interface TandySendMessageRequest {
  message: string;
  language?: Language;
  /** User's latitude for location-based sponsor recommendations */
  latitude?: number;
  /** User's longitude for location-based sponsor recommendations */
  longitude?: number;
  /** Whether to include sponsor ads (default: true) */
  includeSponsorAds?: boolean;
}

/** Emotion categories detected by the backend */
export type EmotionCategory =
  | 'anxiety'
  | 'sleep'
  | 'relaxation'
  | 'general_stress'
  | 'sadness'
  | 'anger'
  | 'relationship'
  | 'self_esteem'
  | 'crisis';

/** Redirect actions that the frontend should handle */
export type RedirectAction =
  | 'breathing:calm'     // Calm & Relax pattern
  | 'breathing:sleep'    // Better Sleep pattern (4-7-8)
  | 'breathing:anxiety'; // Ease Anxiety pattern

// ==================== SPONSOR AD TYPES ====================

/** Sponsor product information */
export interface SponsorProductDTO {
  id: number;
  sponsorId: number;
  sponsorName: string;
  sponsorLogoUrl?: string;
  name: string;
  nameTl?: string;
  description?: string;
  descriptionTl?: string;
  category?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  price?: number;
  currency: string;
  isAvailable: boolean;
  isFeatured: boolean;
  disclaimer?: string;
  disclaimerTl?: string;
  productUrl?: string;
  priority: number;
}

/** Sponsor location information */
export interface SponsorLocationDTO {
  id: number;
  sponsorId: number;
  sponsorName: string;
  sponsorLogoUrl?: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  operatingHours?: string;
  isActive: boolean;
  isMainBranch: boolean;
  googlePlaceId?: string;
  /** Calculated distance from user in km */
  distanceKm?: number;
  /** Formatted distance text (e.g., "2.5 km away") */
  distanceText?: string;
}

/** Ad display types */
export type AdDisplayType =
  | 'FULL'           // Full ad with products and location
  | 'PRODUCTS_ONLY'  // Just product recommendations
  | 'LOCATION_ONLY'  // Just nearest store location
  | 'BANNER_ONLY'    // Just banner/promotional content
  | 'MINIMAL';       // Sponsor mention only

/** Sponsor advertisement data */
export interface SponsorAdDTO {
  sponsorId: number;
  sponsorName: string;
  sponsorSlug?: string;
  sponsorLogoUrl?: string;
  sponsorBannerUrl?: string;
  sponsorWebsiteUrl?: string;
  /** Advertisement content in user's language */
  adContent?: string;
  /** The query category that triggered this ad */
  queryCategory?: string;
  /** The keyword that matched */
  matchedKeyword?: string;
  /** Recommended products */
  recommendedProducts: SponsorProductDTO[];
  /** Nearest store location */
  nearestLocation?: SponsorLocationDTO;
  /** Medical/health disclaimer */
  disclaimer?: string;
  /** Whether this is sponsored content */
  isSponsored: boolean;
  /** Relevance score (0-1) */
  relevanceScore?: number;
  /** Display type */
  displayType: AdDisplayType;
}

export interface TandySendMessageResponse {
  success: boolean;
  userMessage: TandyMessageDTO;
  assistantMessage?: TandyMessageDTO;
  error?: string;
  /** Flag indicating if breathing exercise should be suggested (stress detected) */
  suggestBreathing?: boolean;
  /** Redirect action - when set, frontend should automatically navigate */
  redirectAction?: RedirectAction;
  /** The detected emotion category for UI customization */
  detectedEmotion?: EmotionCategory;
  /** Contextually relevant sponsor advertisement */
  sponsorAd?: SponsorAdDTO;
  /** Whether a sponsor ad was found */
  hasSponsorAd: boolean;
  /** The detected language of the user's message ("en" or "tl") */
  detectedLanguage?: Language;
}

export interface TandySetLanguageRequest {
  language: Language;
}

/**
 * TANDY API client for chatbot functionality.
 */
export const tandyApi = {
  /**
   * Get the current conversation for the authenticated user.
   * Creates a new conversation if one doesn't exist.
   */
  getConversation: async (): Promise<TandyConversationDTO> => {
    const response = await apiClient.get<TandyConversationDTO>('/api/tandy/conversation');
    return response.data;
  },

  /**
   * Send a message to TANDY and receive a response.
   */
  sendMessage: async (request: TandySendMessageRequest): Promise<TandySendMessageResponse> => {
    const response = await apiClient.post<TandySendMessageResponse>('/api/tandy/send', request);
    return response.data;
  },

  /**
   * Set the language preference for TANDY conversations.
   */
  setLanguage: async (language: Language): Promise<TandyConversationDTO> => {
    const response = await apiClient.post<TandyConversationDTO>('/api/tandy/language', {
      language,
    } as TandySetLanguageRequest);
    return response.data;
  },

  /**
   * Clear the conversation history.
   */
  clearHistory: async (): Promise<TandyConversationDTO> => {
    const response = await apiClient.delete<TandyConversationDTO>('/api/tandy/conversation');
    return response.data;
  },

  /**
   * Get a greeting message based on the specified language.
   */
  getGreeting: async (language: Language = 'en'): Promise<string> => {
    const response = await apiClient.get<string>('/api/tandy/greeting', {
      params: { language },
    });
    return response.data;
  },
};

export default tandyApi;
