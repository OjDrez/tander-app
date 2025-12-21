import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * MatchingTutorial - Senior Friendly Onboarding
 *
 * A simple, step-by-step tutorial for the matching feature.
 * Designed for users 60+ with:
 * - Large, clear illustrations
 * - Simple language
 * - One concept at a time
 * - Big tap targets
 */

const TUTORIAL_KEY = '@tander_matching_tutorial_completed';

interface TutorialStep {
  icon: string;
  title: string;
  description: string;
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: 'people',
    title: 'Meet New People',
    description: 'Browse profiles of people who are looking to connect. Each card shows someone new.',
    tip: 'Tap the profile to see more details!',
  },
  {
    icon: 'heart',
    title: 'Like Someone',
    description: 'If you like someone, tap the green LIKE button or swipe the card to the right.',
    tip: 'You can swipe or tap - whatever feels easier!',
  },
  {
    icon: 'close',
    title: 'Pass on Someone',
    description: "If you're not interested, tap the red PASS button or swipe the card to the left.",
    tip: "It's okay to be selective - take your time!",
  },
  {
    icon: 'sparkles',
    title: "It's a Match!",
    description: 'When two people like each other, you get a match! Then you can start chatting.',
    tip: 'Matches expire after 24 hours, so say hello soon!',
  },
  {
    icon: 'chatbubbles',
    title: 'Start a Conversation',
    description: "Once matched, send a friendly message. A simple 'Hello' is a great start!",
    tip: 'Be yourself - genuine conversations lead to real connections.',
  },
];

interface MatchingTutorialProps {
  visible?: boolean;
  onComplete?: () => void;
  forceShow?: boolean;
  alwaysShow?: boolean; // TEMPORARY: Always show tutorial for testing
}

export default function MatchingTutorial({
  visible: externalVisible,
  onComplete,
  forceShow = false,
  alwaysShow = true, // TEMPORARY: Set to true for testing - change back to false later
}: MatchingTutorialProps) {
  const [visible, setVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Check if tutorial has been completed
  useEffect(() => {
    const checkTutorialStatus = async () => {
      // TEMPORARY: Always show for testing
      if (alwaysShow || forceShow) {
        setVisible(true);
        setCurrentStep(0); // Reset to first step
        return;
      }

      try {
        const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
        if (!completed) {
          setVisible(true);
        }
      } catch (error) {
        console.log('Error checking tutorial status:', error);
      }
    };

    if (externalVisible === undefined) {
      checkTutorialStatus();
    }
  }, [forceShow, externalVisible, alwaysShow]);

  // Handle external visibility control
  useEffect(() => {
    if (externalVisible !== undefined) {
      setVisible(externalVisible);
    }
  }, [externalVisible]);

  // Animate step transitions
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep, fadeAnim]);

  // Go to next step
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  // Go to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete tutorial
  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (error) {
      console.log('Error saving tutorial status:', error);
    }
    setVisible(false);
    onComplete?.();
  };

  // Skip tutorial
  const handleSkip = () => {
    completeTutorial();
  };

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.gradient}
        >
          <View style={styles.content}>
            {/* Skip button */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Skip tutorial"
            >
              <AppText size="body" color={colors.white}>
                Skip
              </AppText>
            </TouchableOpacity>

            {/* Step Content */}
            <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
              {/* Icon */}
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={[colors.accentTeal, colors.accentBlue]}
                  style={styles.iconGradient}
                >
                  <Ionicons name={step.icon as any} size={64} color={colors.white} />
                </LinearGradient>
              </View>

              {/* Title */}
              <AppText
                size="h1"
                weight="bold"
                color={colors.white}
                style={styles.title}
              >
                {step.title}
              </AppText>

              {/* Description */}
              <AppText
                size="h4"
                color={colors.white}
                style={styles.description}
              >
                {step.description}
              </AppText>

              {/* Tip */}
              {step.tip && (
                <View style={styles.tipContainer}>
                  <Ionicons name="bulb" size={24} color={colors.warning} />
                  <AppText size="body" color={colors.warning} style={styles.tipText}>
                    Tip: {step.tip}
                  </AppText>
                </View>
              )}
            </Animated.View>

            {/* Progress Dots */}
            <View style={styles.dotsContainer}>
              {TUTORIAL_STEPS.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentStep && styles.dotActive,
                    index < currentStep && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>

            {/* Navigation Buttons */}
            <View style={styles.buttonContainer}>
              {/* Previous Button */}
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton, isFirstStep && styles.buttonDisabled]}
                onPress={handlePrevious}
                disabled={isFirstStep}
                accessibilityRole="button"
                accessibilityLabel="Go to previous step"
              >
                <Ionicons name="arrow-back" size={28} color={isFirstStep ? 'rgba(255,255,255,0.3)' : colors.white} />
                <AppText size="body" weight="semibold" color={isFirstStep ? 'rgba(255,255,255,0.3)' : colors.white}>
                  Back
                </AppText>
              </TouchableOpacity>

              {/* Next/Done Button */}
              <TouchableOpacity
                style={[styles.navButton, styles.nextButton]}
                onPress={handleNext}
                accessibilityRole="button"
                accessibilityLabel={isLastStep ? 'Finish tutorial' : 'Go to next step'}
              >
                <AppText size="body" weight="bold" color={isLastStep ? colors.accentTeal : colors.white}>
                  {isLastStep ? "Let's Go!" : 'Next'}
                </AppText>
                <Ionicons
                  name={isLastStep ? 'checkmark-circle' : 'arrow-forward'}
                  size={28}
                  color={isLastStep ? colors.accentTeal : colors.white}
                />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// Static method to reset tutorial (for testing)
MatchingTutorial.resetTutorial = async () => {
  try {
    await AsyncStorage.removeItem(TUTORIAL_KEY);
  } catch (error) {
    console.log('Error resetting tutorial:', error);
  }
};

// Static method to check if tutorial completed
MatchingTutorial.isCompleted = async (): Promise<boolean> => {
  try {
    const completed = await AsyncStorage.getItem(TUTORIAL_KEY);
    return completed === 'true';
  } catch (error) {
    return false;
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.accentTeal,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  description: {
    textAlign: 'center',
    lineHeight: 32,
    opacity: 0.9,
    paddingHorizontal: 10,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 32,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    backgroundColor: colors.accentTeal,
    width: 36,
  },
  dotCompleted: {
    backgroundColor: colors.white,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 30,
    minHeight: 60, // Senior-friendly touch target
  },
  prevButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  nextButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: colors.white,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
