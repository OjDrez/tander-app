import { EmotionCategory, Language, QuickActionDTO, RedirectAction, SponsorAdDTO, tandyApi } from '@/src/api/tandyApi';
import AppText from '@/src/components/inputs/AppText';
import LoadingIndicator from '@/src/components/common/LoadingIndicator';
import SponsorAdCard from '@/src/components/sponsor/SponsorAdCard';
import colors from '@/src/config/colors';
import { useMainStackNavigation } from '@/src/context/MainStackNavigationContext';
import { BreathingPattern } from '@/src/navigation/NavigationTypes';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Local message type for UI
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  /** Sponsor ad attached to this message (if any) */
  sponsorAd?: SponsorAdDTO;
}

// Prompt content interface
interface PromptContent {
  title: string;
  titleTl: string;
  description: string;
  descriptionTl: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  buttonText: string;
  buttonTextTl: string;
}

/**
 * Parses redirect action from backend to get breathing pattern.
 * Format: "breathing:calm", "breathing:sleep", "breathing:anxiety"
 */
const parseRedirectAction = (action: RedirectAction): BreathingPattern | null => {
  if (action.startsWith('breathing:')) {
    const pattern = action.split(':')[1] as BreathingPattern;
    if (['calm', 'sleep', 'anxiety'].includes(pattern)) {
      return pattern;
    }
  }
  return null;
};

/**
 * Pattern-specific prompt content (bilingual)
 */
const PATTERN_PROMPTS: Record<BreathingPattern, PromptContent> = {
  calm: {
    title: 'Need to relax?',
    titleTl: 'Kailangan mo bang magrelax?',
    description: 'Try our Calm & Relax breathing exercise.',
    descriptionTl: 'Subukan ang Kalma at Relax na breathing exercise.',
    icon: 'leaf',
    color: '#4ECDC4',
    buttonText: "Let's relax!",
    buttonTextTl: 'Tara, mag-relax!',
  },
  sleep: {
    title: 'Feeling tired?',
    titleTl: 'Pagod ka ba?',
    description: 'Our Better Sleep breathing can help you rest.',
    descriptionTl: 'Ang Better Sleep breathing ay makakatulong sa iyo.',
    icon: 'moon',
    color: '#6B7FD7',
    buttonText: 'Help me rest',
    buttonTextTl: 'Tulungan mo ako',
  },
  anxiety: {
    title: 'Feeling anxious?',
    titleTl: 'Kinakabahan ka ba?',
    description: 'Try our Ease Anxiety breathing to calm your nerves.',
    descriptionTl: 'Subukan ang Ease Anxiety breathing para makalma.',
    icon: 'heart',
    color: '#E88B8B',
    buttonText: 'Calm me down',
    buttonTextTl: 'Pakalmahin mo ako',
  },
};

/**
 * Emotion-specific prompt overrides for better UX.
 * These override the default pattern prompts based on detected emotion.
 */
const EMOTION_PROMPTS: Partial<Record<EmotionCategory, PromptContent>> = {
  sadness: {
    title: 'Feeling down?',
    titleTl: 'Malungkot ka ba?',
    description: 'Breathing can help ease heavy feelings.',
    descriptionTl: 'Ang paghinga ay makakatulong sa mabigat na pakiramdam.',
    icon: 'water',
    color: '#7B9ACC',
    buttonText: 'Help me feel better',
    buttonTextTl: 'Tulungan mo ako',
  },
  anger: {
    title: 'Need to cool down?',
    titleTl: 'Kailangan mo bang kumalma?',
    description: 'Deep breathing helps release anger.',
    descriptionTl: 'Ang malalim na paghinga ay nakakatulong pawiin ang galit.',
    icon: 'flame',
    color: '#E07B7B',
    buttonText: 'Help me calm down',
    buttonTextTl: 'Pakalmahin mo ako',
  },
  relationship: {
    title: 'Heart hurting?',
    titleTl: 'Masakit ba ang puso mo?',
    description: 'Breathing can help soothe heartache.',
    descriptionTl: 'Ang paghinga ay makakatulong sa sakit ng puso.',
    icon: 'heart-half',
    color: '#D47B9E',
    buttonText: 'Ease my heart',
    buttonTextTl: 'Alisin ang sakit',
  },
  general_stress: {
    title: 'Feeling overwhelmed?',
    titleTl: 'Sobra-sobra ba ang stress?',
    description: 'Take a moment to breathe and reset.',
    descriptionTl: 'Huminga muna at mag-reset.',
    icon: 'cloudy',
    color: '#7BACD4',
    buttonText: 'Help me destress',
    buttonTextTl: 'Tulungan mo ako',
  },
  self_esteem: {
    title: 'Being hard on yourself?',
    titleTl: 'Mahirap ba sa sarili mo?',
    description: 'Breathing helps you reconnect with calm.',
    descriptionTl: 'Ang paghinga ay tumutulong sa pagpapakalma.',
    icon: 'sunny',
    color: '#E0A07B',
    buttonText: 'Find my calm',
    buttonTextTl: 'Hanapin ang kalma',
  },
};

/**
 * Gets the appropriate prompt content based on emotion and pattern.
 * Emotion-specific prompts take priority over pattern defaults.
 */
const getPromptContent = (
  pattern: BreathingPattern | null,
  emotion: EmotionCategory | null
): PromptContent => {
  // Try emotion-specific prompt first
  if (emotion && EMOTION_PROMPTS[emotion]) {
    return EMOTION_PROMPTS[emotion]!;
  }
  // Fall back to pattern prompt
  if (pattern && PATTERN_PROMPTS[pattern]) {
    return PATTERN_PROMPTS[pattern];
  }
  // Default
  return PATTERN_PROMPTS.calm;
};

/**
 * TandyScreen - SENIOR-FRIENDLY AI Chatbot
 *
 * Designed specifically for elderly users (60+):
 * - LARGE text (18-20px minimum for body text)
 * - BIG touch targets (minimum 56px height)
 * - HIGH contrast colors
 * - SIMPLE, clear layout
 * - BILINGUAL support (English/Tagalog)
 * - COMPASSIONATE messaging
 * - NO confusing navigation
 * - VOICE accessibility support
 */
export default function TandyScreen() {
  const mainNavigation = useMainStackNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [quickActions, setQuickActions] = useState<QuickActionDTO[]>([]);
  const [showBreathingPrompt, setShowBreathingPrompt] = useState(false);
  const [pendingPattern, setPendingPattern] = useState<BreathingPattern | null>(null);
  const [pendingEmotion, setPendingEmotion] = useState<EmotionCategory | null>(null);
  // Track which emotions user has been prompted for in this session (to avoid being annoying)
  const promptedEmotionsRef = useRef<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // User location for sponsor recommendations
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Current detected language (used for UI elements) - defaults to English
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  // Load conversation on mount
  useEffect(() => {
    loadConversation();
    fetchUserLocation();
  }, []);

  // Fetch user location for sponsor recommendations
  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        console.log('User location obtained:', location.coords);
      }
    } catch (error) {
      console.log('Location permission denied or error:', error);
      // Location is optional - sponsor ads will still work without it
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Announce new messages for screen readers
  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  // Load conversation from backend
  const loadConversation = async () => {
    try {
      setIsInitialLoading(true);
      const conversation = await tandyApi.getConversation();

      setQuickActions(conversation.quickActions || []);

      // Convert backend messages to local format
      const loadedMessages: Message[] = conversation.messages.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime(),
      }));

      // Add initial greeting if no messages
      if (loadedMessages.length === 0) {
        const greetingMsg: Message = {
          id: 'greeting',
          role: 'assistant',
          content: getInitialGreeting(),
          timestamp: Date.now(),
        };
        loadedMessages.push(greetingMsg);
      }

      // Set language from conversation if available
      if (conversation.language) {
        setCurrentLanguage(conversation.language);
      }

      setMessages(loadedMessages);
    } catch (error) {
      console.error('Error loading TANDY conversation:', error);
      // Show initial greeting on error
      setMessages([
        {
          id: 'greeting-error',
          role: 'assistant',
          content: getInitialGreeting(),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Get time-appropriate greeting - simple and welcoming
  // Shows a brief bilingual intro ONLY at first, then follows user's language
  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    let greeting = '';
    let greetingTl = '';

    if (hour < 12) {
      greeting = 'Good morning!';
      greetingTl = 'Magandang umaga po!';
    } else if (hour < 18) {
      greeting = 'Good afternoon!';
      greetingTl = 'Magandang hapon po!';
    } else {
      greeting = 'Good evening!';
      greetingTl = 'Magandang gabi po!';
    }

    // Initial greeting explains both languages are supported
    // After this, TANDY will respond in the user's detected language
    return `${greeting} ${greetingTl}\n\nI'm TANDY, your friendly helper. You can talk to me in English or Tagalog - I'll respond in the same language you use.\n\nAko si TANDY, ang iyong kaibigan. Pwede kang kausapin ako sa English o Tagalog - sasagot ako sa language na gagamitin mo.\n\nHow can I help you today? / Paano kita matutulungan?`;
  };

  // Get text based on current language
  const getText = (en: string, tl: string) => {
    return currentLanguage === 'tl' ? tl : en;
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
      // Send message to backend with location for sponsor recommendations
      const response = await tandyApi.sendMessage({
        message: userMessage,
        latitude: userLocation?.latitude,
        longitude: userLocation?.longitude,
        includeSponsorAds: true,
      });

      if (response.success && response.assistantMessage) {
        // Update language based on detected language from backend
        if (response.detectedLanguage) {
          setCurrentLanguage(response.detectedLanguage);
        }

        // Add assistant response with sponsor ad if available
        const assistantMsg: Message = {
          id: response.assistantMessage.id.toString(),
          role: 'assistant',
          content: response.assistantMessage.content,
          timestamp: new Date(response.assistantMessage.timestamp).getTime(),
          sponsorAd: response.hasSponsorAd ? response.sponsorAd : undefined,
        };
        setMessages((prev) => [...prev, assistantMsg]);

        // Announce response for screen readers
        announceForAccessibility(`TANDY says: ${response.assistantMessage.content.substring(0, 200)}`);

        // Log sponsor ad and language if present
        if (response.hasSponsorAd && response.sponsorAd) {
          console.log('Sponsor ad received:', response.sponsorAd.sponsorName);
        }
        if (response.detectedLanguage) {
          console.log('Detected language:', response.detectedLanguage);
        }

        // Check for redirect action (relaxation/sleep/anxiety/sadness/anger requests)
        if (response.redirectAction) {
          const pattern = parseRedirectAction(response.redirectAction);
          const emotion = response.detectedEmotion || null;
          // Create unique key for tracking (pattern + emotion combo)
          const promptKey = `${pattern || 'calm'}-${emotion || 'general'}`;

          if (pattern) {
            // Only show prompt if we haven't already prompted for this emotion in this session
            if (!promptedEmotionsRef.current.has(promptKey)) {
              setTimeout(() => {
                setPendingPattern(pattern);
                setPendingEmotion(emotion);
                setShowBreathingPrompt(true);
                // Mark this emotion as prompted so we don't ask again
                promptedEmotionsRef.current.add(promptKey);
              }, 1500);
            }
          }
        }
        // Check if stress was detected and suggest breathing exercise (general prompt)
        else if (response.suggestBreathing && response.detectedEmotion) {
          const emotion = response.detectedEmotion;
          const promptKey = `calm-${emotion}`;

          // Show prompt if we haven't prompted for this specific emotion yet
          if (!promptedEmotionsRef.current.has(promptKey)) {
            setTimeout(() => {
              setPendingPattern('calm'); // Default to calm pattern
              setPendingEmotion(emotion);
              setShowBreathingPrompt(true);
              promptedEmotionsRef.current.add(promptKey);
            }, 1500);
          }
        }
      } else {
        // Show error message in current language
        const errorMsg: Message = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: getText(
            "I'm sorry, something went wrong. Please try again.",
            "Pasensya na po, may problema. Subukan mo po ulit."
          ),
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: getText(
          "I'm having trouble connecting. Please try again.",
          "May problema po sa koneksyon. Subukan mo po ulit."
        ),
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

  // Clear conversation with confirmation for seniors
  const handleClearChat = async () => {
    try {
      setIsLoading(true);

      const conversation = await tandyApi.clearHistory();
      setQuickActions(conversation.quickActions || []);

      // Reset language to English and show initial greeting
      setCurrentLanguage('en');
      const greetingMessage: Message = {
        id: 'greeting-new',
        role: 'assistant',
        content: getInitialGreeting(),
        timestamp: Date.now(),
      };
      setMessages([greetingMessage]);

      // Clear prompted emotions so user can get fresh prompts
      promptedEmotionsRef.current.clear();

      // Announce for accessibility
      announceForAccessibility('Chat cleared. Starting a new conversation.');
    } catch (error) {
      console.error('Error clearing chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render message bubble - SENIOR FRIENDLY with large text
  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === 'user';

    return (
      <View>
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
          accessible={true}
          accessibilityLabel={`${isUser ? 'You said' : 'TANDY said'}: ${item.content}`}
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

        {/* Sponsor Ad Card - shown below assistant messages */}
        {!isUser && item.sponsorAd && (
          <View style={styles.sponsorAdContainer}>
            <SponsorAdCard
              ad={item.sponsorAd}
              language={currentLanguage}
              onProductPress={(product) => {
                console.log('Product pressed:', product.name);
                // Could navigate to product details or external URL
              }}
              onLocationPress={(location) => {
                console.log('Location pressed:', location.name);
                // Opens in maps via SponsorAdCard
              }}
            />
          </View>
        )}
      </View>
    );
  }, [currentLanguage]);

  // Show loading state on initial load - SENIOR FRIENDLY
  // Initial loading shows both languages since we don't know user's preference yet
  if (isInitialLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading... Please wait"
        subtitle="Sandali lang po..."
      />
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        style={styles.gradient}
      >
        {/* Header - SENIOR FRIENDLY with large text */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require('@/src/assets/icon.png')}
              style={styles.headerAvatar}
              accessible={true}
              accessibilityLabel="TANDY avatar"
            />
            <View>
              <AppText style={styles.headerTitle}>
                TANDY
              </AppText>
              <AppText style={styles.headerSubtitle}>
                {getText('Your Friendly Helper', 'Ang Iyong Kaibigan')}
              </AppText>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* Breathing/Relaxation Button - LARGE for seniors */}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => mainNavigation?.navigate('BreathingExerciseScreen')}
              accessibilityRole="button"
              accessibilityLabel={getText('Breathing exercise. Tap to relax.', 'Ehersisyo sa paghinga. I-tap para magrelax.')}
              accessibilityHint={getText('Opens breathing exercises to help you relax', 'Magbubukas ng breathing exercises para makatulong sa iyo')}
            >
              <Ionicons name="leaf" size={26} color={colors.accentTeal} />
            </TouchableOpacity>

            {/* Clear Chat - LARGE for seniors */}
            <TouchableOpacity
              style={[styles.headerButton, styles.clearButton]}
              onPress={handleClearChat}
              accessibilityRole="button"
              accessibilityLabel={getText('Start new chat', 'Bagong usapan')}
              accessibilityHint={getText('Clears current conversation and starts fresh', 'Buburahin ang kasalukuyang usapan at magsisimula ng bago')}
              disabled={isLoading}
            >
              <Ionicons
                name="refresh"
                size={26}
                color={isLoading ? colors.textMuted : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={true}
          ListFooterComponent={
            isLoading ? (
              <View style={styles.typingContainer}>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <AppText style={styles.typingText}>
                    {getText('TANDY is thinking...', 'Nag-iisip si TANDY...')}
                  </AppText>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Actions - SENIOR FRIENDLY with large buttons */}
        {messages.length <= 2 && quickActions.length > 0 && (
          <View style={styles.quickActionsContainer}>
            <AppText style={styles.quickActionsTitle}>
              {getText('Tap a button to ask:', 'I-tap para magtanong:')}
            </AppText>
            <View style={styles.quickActions}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickActionButton}
                  onPress={() => handleQuickAction(action.action)}
                  accessibilityRole="button"
                  accessibilityLabel={action.text}
                >
                  <AppText style={styles.quickActionText}>
                    {action.text}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input Area - SENIOR FRIENDLY with large text and buttons */}
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
                placeholder={getText('Type your message here...', 'I-type ang mensahe mo dito...')}
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
                editable={!isLoading}
                accessibilityLabel={getText('Message input. Type your message here.', 'Input ng mensahe. I-type ang mensahe mo dito.')}
                accessibilityHint={getText('Type what you want to ask TANDY', 'I-type ang gusto mong itanong kay TANDY')}
              />
            </View>

            {/* Send Button - LARGE for seniors */}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              accessibilityRole="button"
              accessibilityLabel={getText('Send message', 'Ipadala ang mensahe')}
              accessibilityHint={getText('Tap to send your message to TANDY', 'I-tap para ipadala ang iyong mensahe kay TANDY')}
            >
              <Ionicons
                name="send"
                size={28}
                color={
                  inputText.trim() && !isLoading
                    ? colors.white
                    : colors.textMuted
                }
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* Breathing Exercise Prompt Modal - SENIOR FRIENDLY */}
        <Modal
          visible={showBreathingPrompt}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBreathingPrompt(false)}
          accessibilityViewIsModal={true}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.promptContainer}>
              {/* Get emotion-specific or pattern-specific prompt content */}
              {(() => {
                const promptContent = getPromptContent(pendingPattern, pendingEmotion);
                const title = currentLanguage === 'tl' ? promptContent.titleTl : promptContent.title;
                const description = currentLanguage === 'tl' ? promptContent.descriptionTl : promptContent.description;
                const buttonText = currentLanguage === 'tl' ? promptContent.buttonTextTl : promptContent.buttonText;
                const laterText = currentLanguage === 'tl' ? 'Mamaya na lang' : 'Maybe later';

                return (
                  <>
                    {/* Emotion/Pattern-specific icon and colors */}
                    <View
                      style={[
                        styles.promptIconContainer,
                        { backgroundColor: promptContent.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={promptContent.icon}
                        size={56}
                        color={promptContent.color}
                      />
                    </View>

                    {/* Emotion/Pattern-specific title - LARGE TEXT (in detected language) */}
                    <AppText style={styles.promptTitle}>
                      {title}
                    </AppText>

                    {/* Emotion/Pattern-specific description (in detected language) */}
                    <AppText style={styles.promptDescription}>
                      {description}
                    </AppText>

                    <View style={styles.promptButtons}>
                      {/* Later Button */}
                      <TouchableOpacity
                        style={styles.promptButtonSecondary}
                        onPress={() => {
                          setShowBreathingPrompt(false);
                          setPendingPattern(null);
                          setPendingEmotion(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={laterText}
                      >
                        <AppText style={styles.promptButtonSecondaryText}>
                          {laterText}
                        </AppText>
                      </TouchableOpacity>

                      {/* Action Button - LARGE */}
                      <TouchableOpacity
                        style={[
                          styles.promptButtonPrimary,
                          { backgroundColor: promptContent.color },
                        ]}
                        onPress={() => {
                          setShowBreathingPrompt(false);
                          // Navigate with specific pattern if available
                          if (pendingPattern) {
                            mainNavigation?.navigate('BreathingExerciseScreen', { initialPattern: pendingPattern });
                          } else {
                            mainNavigation?.navigate('BreathingExerciseScreen');
                          }
                          setPendingPattern(null);
                          setPendingEmotion(null);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={buttonText}
                      >
                        <Ionicons
                          name={promptContent.icon}
                          size={24}
                          color={colors.white}
                        />
                        <AppText style={styles.promptButtonPrimaryText}>
                          {buttonText}
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </SafeAreaView>
  );
}

// SENIOR-FRIENDLY STYLES
// Design principles:
// - Minimum 18px font size for readability
// - Minimum 56px touch targets
// - High contrast colors
// - Clear visual hierarchy
// - Generous spacing
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },

  // Loading Screen
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 20,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  loadingTextTl: {
    fontSize: 18,
    color: colors.textSecondary,
  },

  // Header - LARGE for seniors
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    backgroundColor: colors.white,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    width: 56, // Large touch target
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    backgroundColor: colors.backgroundLight,
  },

  // Messages List
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  messageContent: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    maxWidth: '100%',
  },
  userContent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6,
  },
  assistantContent: {
    backgroundColor: colors.white,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  messageText: {
    fontSize: 18, // LARGE for seniors
    lineHeight: 26,
  },
  userText: {
    color: colors.white,
  },
  assistantText: {
    color: colors.textPrimary,
  },

  // Sponsor Ad
  sponsorAdContainer: {
    marginLeft: 52, // Align with assistant message
    marginBottom: 16,
    maxWidth: '90%',
  },

  // Typing Indicator
  typingContainer: {
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  typingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Quick Actions - LARGE buttons for seniors
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  quickActionsTitle: {
    fontSize: 17,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  quickActionButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    minHeight: 52, // Large touch target
  },
  quickActionText: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },

  // Input Area - LARGE for seniors
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.backgroundLight,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 56, // Large touch target
    maxHeight: 140,
    borderWidth: 2,
    borderColor: colors.borderMedium,
  },
  textInput: {
    flex: 1,
    fontSize: 18, // LARGE for seniors
    color: colors.textPrimary,
    paddingVertical: 4,
    maxHeight: 100,
    lineHeight: 24,
  },
  sendButton: {
    width: 60, // Large touch target
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.borderMedium,
  },

  // Breathing Prompt Modal - SENIOR FRIENDLY
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  promptContainer: {
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  promptIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.accentMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  promptTitle: {
    fontSize: 26, // LARGE
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  promptDescription: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 24,
  },
  promptButtons: {
    flexDirection: 'column',
    gap: 14,
    width: '100%',
  },
  promptButtonSecondary: {
    paddingVertical: 18, // Large touch target
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    minHeight: 60,
  },
  promptButtonSecondaryText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  promptButtonPrimary: {
    flexDirection: 'row',
    paddingVertical: 18, // Large touch target
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.accentTeal,
    minHeight: 60,
  },
  promptButtonPrimaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
});
