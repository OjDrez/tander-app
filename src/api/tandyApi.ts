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
}

export interface TandySendMessageResponse {
  success: boolean;
  userMessage: TandyMessageDTO;
  assistantMessage?: TandyMessageDTO;
  error?: string;
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
