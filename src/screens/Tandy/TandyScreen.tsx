import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { tandyApi, TandyMessageDTO, Language, QuickActionDTO } from '@/src/api/tandyApi';

// Local message type for UI
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

/**
 * TandyScreen
 *
 * AI Chatbot screen providing:
 * - App navigation support
 * - Emotional support for dating
 * - Language switching (English/Tagalog)
 * - Voice-to-text input (future)
 */
export default function TandyScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [language, setLanguage] = useState<Language>('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [quickActions, setQuickActions] = useState<QuickActionDTO[]>([]);
  const flatListRef = useRef<FlatList>(null);

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Load conversation from backend
  const loadConversation = async () => {
    try {
      setIsInitialLoading(true);
      const conversation = await tandyApi.getConversation();

      setLanguage(conversation.language);
      setQuickActions(conversation.quickActions || []);

      // Convert backend messages to local format
      const loadedMessages: Message[] = conversation.messages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
      }));

      // Add greeting if no messages
      if (loadedMessages.length === 0 && conversation.greeting) {
        loadedMessages.push({
          id: 'greeting',
          role: 'assistant',
          content: conversation.greeting,
          timestamp: Date.now(),
        });
      }

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading TANDY conversation:', error);
      // Show a default greeting on error
      setMessages([
        {
          id: 'greeting-error',
          role: 'assistant',
          content:
            language === 'tl'
              ? 'Kumusta! Ako si TANDY. Paano kita matutulungan ngayon?'
              : "Hello! I'm TANDY. How can I help you today?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Handle language change
  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      setShowLanguageMenu(false);
      setIsLoading(true);

      const conversation = await tandyApi.setLanguage(newLanguage);
      setLanguage(newLanguage);
      setQuickActions(conversation.quickActions || []);

      // Add a message indicating language change
      const languageChangeMessage: Message = {
        id: `lang-${Date.now()}`,
        role: 'assistant',
        content:
          newLanguage === 'tl'
            ? 'Ngayon ay magsasalita ako sa Tagalog. Paano kita matutulungan?'
            : "I'll now speak in English. How can I help you?",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, languageChangeMessage]);
    } catch (error) {
      console.error('Error changing language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send message
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Send message to backend
      const response = await tandyApi.sendMessage({
        message: userMessage,
        language,
      });

      if (response.success && response.assistantMessage) {
        // Add assistant response
        const assistantMsg: Message = {
          id: response.assistantMessage.id.toString(),
          role: 'assistant',
          content: response.assistantMessage.content,
          timestamp: new Date(response.assistantMessage.timestamp).getTime(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        // Show error message
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content:
            response.error ||
            (language === 'tl'
              ? 'Pasensya na, may problema. Puwede mo bang subukan ulit?'
              : "I'm sorry, something went wrong. Please try again."),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          language === 'tl'
            ? 'Pasensya na, may problema sa koneksyon. Puwede mo bang subukan ulit?'
            : "I'm having trouble connecting. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action press
  const handleQuickAction = (action: string) => {
    setInputText(action);
  };

  // Clear conversation
  const handleClearChat = async () => {
    try {
      setIsLoading(true);
      const conversation = await tandyApi.clearHistory();

      setQuickActions(conversation.quickActions || []);

      // Reset to greeting
      const greetingMessage: Message = {
        id: 'greeting-new',
        role: 'assistant',
        content: conversation.greeting,
        timestamp: Date.now(),
      };
      setMessages([greetingMessage]);
    } catch (error) {
      console.error('Error clearing chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render message bubble
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.avatarContainer}>
            <Image
              source={require('@/src/assets/icon.png')}
              style={styles.avatar}
            />
          </View>
        )}
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userContent : styles.assistantContent,
          ]}
        >
          <AppText
            style={[
              styles.messageText,
              isUser ? styles.userText : styles.assistantText,
            ]}
          >
            {item.content}
          </AppText>
        </View>
      </View>
    );
  }, []);

  // Show loading state on initial load
  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          style={styles.gradient}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary}>
              {language === 'tl' ? 'Naglo-load...' : 'Loading...'}
            </AppText>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/src/assets/icon.png')}
              style={styles.headerAvatar}
            />
            <View>
              <AppText weight="semibold" size="h4">
                TANDY
              </AppText>
              <AppText size="caption" color={colors.textSecondary}>
                {language === 'tl' ? 'Iyong AI Assistant' : 'Your AI Assistant'}
              </AppText>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Language Toggle */}
            <TouchableOpacity
              style={styles.languageButton}
              onPress={() => setShowLanguageMenu(!showLanguageMenu)}
              accessibilityRole="button"
              accessibilityLabel="Change language"
            >
              <AppText weight="semibold" size="small" color={colors.accentBlue}>
                {language === 'tl' ? 'TL' : 'EN'}
              </AppText>
              <Ionicons
                name="chevron-down"
                size={14}
                color={colors.accentBlue}
              />
            </TouchableOpacity>

            {/* Clear Chat */}
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleClearChat}
              accessibilityRole="button"
              accessibilityLabel="Clear chat"
              disabled={isLoading}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color={isLoading ? colors.textMuted : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Menu Dropdown */}
        {showLanguageMenu && (
          <View style={styles.languageMenu}>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'en' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('en')}
            >
              <AppText
                weight={language === 'en' ? 'semibold' : 'regular'}
                color={language === 'en' ? colors.primary : colors.textPrimary}
              >
                English
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.languageOption,
                language === 'tl' && styles.languageOptionActive,
              ]}
              onPress={() => handleLanguageChange('tl')}
            >
              <AppText
                weight={language === 'tl' ? 'semibold' : 'regular'}
                color={language === 'tl' ? colors.primary : colors.textPrimary}
              >
                Tagalog
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText size="small" color={colors.textSecondary}>
                    {language === 'tl' ? 'Nagta-type...' : 'Typing...'}
                  </AppText>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Actions - Show only when no messages or few messages */}
        {messages.length <= 2 && quickActions.length > 0 && (
          <View style={styles.quickActionsContainer}>
            <AppText
              size="small"
              color={colors.textSecondary}
              style={styles.quickActionsTitle}
            >
              {language === 'tl' ? 'Mga Mabilisang Tanong:' : 'Quick Questions:'}
            </AppText>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action.action)}
                >
                  <AppText size="small" color={colors.accentBlue}>
                    {action.text}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder={
                  language === 'tl'
                    ? 'Magtanong kay TANDY...'
                    : 'Ask TANDY anything...'
                }
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                editable={!isLoading}
              />

              {/* Voice Input Button (placeholder for future) */}
              <TouchableOpacity
                style={styles.voiceButton}
                accessibilityRole="button"
                accessibilityLabel="Voice input"
                disabled
              >
                <Ionicons
                  name="mic-outline"
                  size={22}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            {/* Send Button */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Ionicons
                name="send"
                size={20}
                color={
                  inputText.trim() && !isLoading
                    ? colors.white
                    : colors.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
  },
  iconButton: {
    padding: 8,
  },
  languageMenu: {
    position: 'absolute',
    top: 70,
    right: 60,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    zIndex: 100,
  },
  languageOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  languageOptionActive: {
    backgroundColor: colors.accentPeach,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexGrow: 1,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageContent: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    maxWidth: '100%',
  },
  userContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  assistantContent: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.textPrimary,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  quickActionsTitle: {
    marginBottom: 8,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundLight,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
    paddingVertical: 4,
    maxHeight: 100,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderMedium,
  },
});
