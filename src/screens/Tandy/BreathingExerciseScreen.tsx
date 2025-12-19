import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList, BreathingPattern as BreathingPatternType } from '@/src/navigation/NavigationTypes';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = Math.min(width * 0.65, 280);

type BreathPhase = 'ready' | 'inhale' | 'hold' | 'exhale';
type Language = 'en' | 'tl';
type BreathingExerciseRouteProp = RouteProp<AppStackParamList, 'BreathingExerciseScreen'>;

interface BreathingPatternConfig {
  id: BreathingPatternType;
  name: string;
  nameTagalog: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  descriptionTagalog: string;
  inhale: number;
  hold: number;
  exhale: number;
  cycles: number;
  color: string;
}

const BREATHING_PATTERNS: BreathingPatternConfig[] = [
  {
    id: 'calm',
    name: 'Calm & Relax',
    nameTagalog: 'Kalma at Relax',
    icon: 'leaf-outline',
    description: 'Perfect for daily relaxation',
    descriptionTagalog: 'Perpekto para sa pang-araw-araw na relaxation',
    inhale: 4,
    hold: 4,
    exhale: 4,
    cycles: 4,
    color: colors.accentTeal,
  },
  {
    id: 'sleep',
    name: 'Better Sleep',
    nameTagalog: 'Mas Mahimbing na Tulog',
    icon: 'moon-outline',
    description: 'Helps you fall asleep faster',
    descriptionTagalog: 'Tumutulong para mas mabilis makatulog',
    inhale: 4,
    hold: 4,
    exhale: 8,
    cycles: 3,
    color: '#6B7FD7',
  },
  {
    id: 'anxiety',
    name: 'Ease Anxiety',
    nameTagalog: 'Pawiin ang Kaba',
    icon: 'heart-outline',
    description: 'Calms nerves before a date',
    descriptionTagalog: 'Nagpapakalma bago ang date',
    inhale: 4,
    hold: 2,
    exhale: 6,
    cycles: 5,
    color: '#E88B8B',
  },
];

const PHASE_INSTRUCTIONS = {
  en: {
    ready: 'Tap Start when ready',
    inhale: 'Breathe In',
    hold: 'Hold',
    exhale: 'Breathe Out',
  },
  tl: {
    ready: 'Pindutin ang Start kapag handa ka na',
    inhale: 'Huminga',
    hold: 'Hawakan',
    exhale: 'Ilabas',
  },
};

/**
 * BreathingExerciseScreen
 *
 * A calming, user-friendly breathing exercise with:
 * - Large, easy-to-see animations
 * - Clear visual instructions
 * - Simple pattern selection
 * - Bilingual support (English/Tagalog)
 */
export default function BreathingExerciseScreen() {
  const navigation = useNavigation();
  const route = useRoute<BreathingExerciseRouteProp>();

  // Get initial pattern from route params (e.g., when redirected from TANDY)
  const initialPattern = route.params?.initialPattern || 'calm';

  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathPhase>('ready');
  const [currentCycle, setCurrentCycle] = useState(1);
  const [selectedPatternId, setSelectedPatternId] = useState<BreathingPatternType>(initialPattern);
  const [language, setLanguage] = useState<Language>('en');
  const [countdown, setCountdown] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const pattern = BREATHING_PATTERNS.find((p) => p.id === selectedPatternId) || BREATHING_PATTERNS[0];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, []);

  const cleanupTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (animationRef.current) animationRef.current.stop();
  };

  // Run breathing cycle
  useEffect(() => {
    if (!isActive || isPaused || isCompleted) return;

    const runPhase = async (phase: BreathPhase, duration: number): Promise<void> => {
      return new Promise((resolve) => {
        setCurrentPhase(phase);
        setCountdown(duration);

        // Animate circle based on phase
        let targetScale = 0.5;
        let targetGlow = 0.3;

        if (phase === 'inhale') {
          targetScale = 1;
          targetGlow = 0.8;
        } else if (phase === 'hold') {
          targetScale = 1;
          targetGlow = 0.6;
        } else if (phase === 'exhale') {
          targetScale = 0.5;
          targetGlow = 0.3;
        }

        animationRef.current = Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: targetScale,
            duration: duration * 1000,
            easing: phase === 'hold' ? Easing.linear : Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: targetGlow,
            duration: duration * 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]);

        animationRef.current.start();

        // Countdown timer
        countdownRef.current = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              if (countdownRef.current) clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        timerRef.current = setTimeout(() => {
          if (countdownRef.current) clearInterval(countdownRef.current);
          resolve();
        }, duration * 1000);
      });
    };

    const runCycle = async () => {
      // Inhale
      await runPhase('inhale', pattern.inhale);
      if (!isActive || isPaused) return;

      // Hold (if any)
      if (pattern.hold > 0) {
        await runPhase('hold', pattern.hold);
        if (!isActive || isPaused) return;
      }

      // Exhale
      await runPhase('exhale', pattern.exhale);
      if (!isActive || isPaused) return;

      // Check if completed
      if (currentCycle >= pattern.cycles) {
        setIsCompleted(true);
        setIsActive(false);
        setCurrentPhase('ready');
      } else {
        setCurrentCycle((prev) => prev + 1);
      }
    };

    runCycle();

    return () => {
      cleanupTimers();
    };
  }, [isActive, isPaused, currentCycle, isCompleted]);

  // Gentle pulse animation for the outer ring when not active
  useEffect(() => {
    if (!isActive && !isCompleted) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isActive, isCompleted]);

  const startExercise = () => {
    setIsCompleted(false);
    setCurrentCycle(1);
    setCurrentPhase('inhale');
    setIsActive(true);
    setIsPaused(false);
    scaleAnim.setValue(0.5);
    glowAnim.setValue(0.3);
  };

  const pauseExercise = () => {
    setIsPaused(true);
    cleanupTimers();
  };

  const resumeExercise = () => {
    setIsPaused(false);
  };

  const stopExercise = () => {
    cleanupTimers();
    setIsActive(false);
    setIsPaused(false);
    setCurrentCycle(1);
    setCurrentPhase('ready');
    setIsCompleted(false);
    scaleAnim.setValue(0.5);
    glowAnim.setValue(0.3);
  };

  const resetAndRestart = () => {
    stopExercise();
    setTimeout(startExercise, 300);
  };

  const getPhaseText = () => {
    return PHASE_INSTRUCTIONS[language][currentPhase];
  };

  const getPhaseColor = () => {
    if (currentPhase === 'inhale') return colors.accentTeal;
    if (currentPhase === 'hold') return colors.primary;
    if (currentPhase === 'exhale') return '#6B7FD7';
    return colors.textSecondary;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#E8F5F4', '#EEF2FF', '#FFF5EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
          </TouchableOpacity>

          <AppText weight="semibold" size="h4" style={styles.headerTitle}>
            {language === 'tl' ? 'Paghinga' : 'Breathe'}
          </AppText>

          <TouchableOpacity
            style={styles.languageToggle}
            onPress={() => setLanguage(language === 'en' ? 'tl' : 'en')}
          >
            <AppText weight="semibold" size="small" color={colors.accentBlue}>
              {language === 'tl' ? 'TL' : 'EN'}
            </AppText>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Pattern Selection - Only show when not active */}
          {!isActive && !isCompleted && (
            <View style={styles.patternSection}>
              <AppText weight="semibold" size="body" color={colors.textPrimary} style={styles.sectionTitle}>
                {language === 'tl' ? 'Piliin ang gusto mo:' : 'Choose what you need:'}
              </AppText>

              <View style={styles.patternCards}>
                {BREATHING_PATTERNS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.patternCard,
                      selectedPatternId === p.id && styles.patternCardActive,
                      selectedPatternId === p.id && { borderColor: p.color },
                    ]}
                    onPress={() => setSelectedPatternId(p.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.patternIconContainer, { backgroundColor: p.color + '20' }]}>
                      <Ionicons name={p.icon} size={24} color={p.color} />
                    </View>
                    <AppText
                      weight={selectedPatternId === p.id ? 'semibold' : 'medium'}
                      size="body"
                      color={selectedPatternId === p.id ? p.color : colors.textPrimary}
                      style={styles.patternName}
                    >
                      {language === 'tl' ? p.nameTagalog : p.name}
                    </AppText>
                    <AppText size="caption" color={colors.textSecondary} style={styles.patternDesc}>
                      {language === 'tl' ? p.descriptionTagalog : p.description}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Breathing Circle */}
          <View style={styles.circleSection}>
            {/* Outer glow ring */}
            <Animated.View
              style={[
                styles.outerRing,
                {
                  transform: [{ scale: isActive ? scaleAnim : pulseAnim }],
                  opacity: glowAnim,
                  backgroundColor: pattern.color,
                },
              ]}
            />

            {/* Main breathing circle */}
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  transform: [{ scale: isActive ? scaleAnim : Animated.multiply(pulseAnim, 0.95) }],
                  backgroundColor: pattern.color,
                },
              ]}
            >
              <LinearGradient
                colors={[pattern.color, pattern.color + 'CC']}
                style={styles.circleGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            </Animated.View>

            {/* Center content */}
            <View style={styles.circleContent}>
              {isActive && !isPaused ? (
                <>
                  <AppText weight="bold" style={[styles.countdownText, { color: colors.white }]}>
                    {countdown}
                  </AppText>
                  <AppText weight="semibold" size="h4" color={colors.white} style={styles.phaseText}>
                    {getPhaseText()}
                  </AppText>
                </>
              ) : isCompleted ? (
                <>
                  <Ionicons name="checkmark-circle" size={48} color={colors.white} />
                  <AppText weight="semibold" size="body" color={colors.white} style={styles.completedText}>
                    {language === 'tl' ? 'Magaling!' : 'Well done!'}
                  </AppText>
                </>
              ) : isPaused ? (
                <>
                  <Ionicons name="pause" size={40} color={colors.white} />
                  <AppText weight="semibold" size="body" color={colors.white}>
                    {language === 'tl' ? 'Naka-pause' : 'Paused'}
                  </AppText>
                </>
              ) : (
                <>
                  <Ionicons name={pattern.icon} size={40} color={colors.white} />
                  <AppText weight="medium" size="body" color={colors.white} style={styles.readyText}>
                    {getPhaseText()}
                  </AppText>
                </>
              )}
            </View>
          </View>

          {/* Progress indicator */}
          {isActive && (
            <View style={styles.progressSection}>
              <AppText size="body" color={colors.textSecondary}>
                {language === 'tl'
                  ? `Round ${currentCycle} ng ${pattern.cycles}`
                  : `Round ${currentCycle} of ${pattern.cycles}`}
              </AppText>
              <View style={styles.progressDots}>
                {Array.from({ length: pattern.cycles }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.progressDot,
                      i < currentCycle && styles.progressDotActive,
                      i < currentCycle && { backgroundColor: pattern.color },
                    ]}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Controls */}
          <View style={styles.controlsSection}>
            {isCompleted ? (
              <View style={styles.completedControls}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: pattern.color }]}
                  onPress={resetAndRestart}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={24} color={colors.white} />
                  <AppText weight="semibold" size="body" color={colors.white}>
                    {language === 'tl' ? 'Ulitin' : 'Do Again'}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.goBack()}
                  activeOpacity={0.8}
                >
                  <AppText weight="semibold" size="body" color={colors.textPrimary}>
                    {language === 'tl' ? 'Tapos Na' : 'Done'}
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : isActive ? (
              <View style={styles.activeControls}>
                {isPaused ? (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: pattern.color }]}
                    onPress={resumeExercise}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="play" size={24} color={colors.white} />
                    <AppText weight="semibold" size="body" color={colors.white}>
                      {language === 'tl' ? 'Ituloy' : 'Resume'}
                    </AppText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.primaryButton, { backgroundColor: colors.textSecondary }]}
                    onPress={pauseExercise}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pause" size={24} color={colors.white} />
                    <AppText weight="semibold" size="body" color={colors.white}>
                      {language === 'tl' ? 'I-pause' : 'Pause'}
                    </AppText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.stopButton}
                  onPress={stopExercise}
                  activeOpacity={0.8}
                >
                  <Ionicons name="stop" size={20} color={colors.error} />
                  <AppText weight="medium" size="body" color={colors.error}>
                    {language === 'tl' ? 'Itigil' : 'Stop'}
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.startButton, { backgroundColor: pattern.color }]}
                onPress={startExercise}
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={28} color={colors.white} />
                <AppText weight="bold" size="h4" color={colors.white}>
                  {language === 'tl' ? 'Simulan' : 'Start'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>

          {/* Tips - Only show when not active */}
          {!isActive && !isCompleted && (
            <View style={styles.tipsSection}>
              <View style={styles.tipCard}>
                <Ionicons name="information-circle" size={20} color={colors.accentTeal} />
                <AppText size="small" color={colors.textSecondary} style={styles.tipText}>
                  {language === 'tl'
                    ? 'Umupo ng komportable. Huminga sa ilong, ilabas sa bibig. Hayaan mong kumalma ang isip mo.'
                    : 'Sit comfortably. Breathe in through your nose, out through your mouth. Let your mind relax.'}
                </AppText>
              </View>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5F4',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  languageToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  patternSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  patternCards: {
    flexDirection: 'row',
    gap: 10,
  },
  patternCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  patternCardActive: {
    borderWidth: 2,
    shadowOpacity: 0.1,
  },
  patternIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  patternName: {
    textAlign: 'center',
    marginBottom: 4,
  },
  patternDesc: {
    textAlign: 'center',
    lineHeight: 16,
  },
  circleSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CIRCLE_SIZE + 60,
    marginVertical: 20,
  },
  outerRing: {
    position: 'absolute',
    width: CIRCLE_SIZE + 40,
    height: CIRCLE_SIZE + 40,
    borderRadius: (CIRCLE_SIZE + 40) / 2,
  },
  breathingCircle: {
    position: 'absolute',
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  circleGradient: {
    flex: 1,
  },
  circleContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 72,
    lineHeight: 80,
  },
  phaseText: {
    marginTop: 4,
  },
  completedText: {
    marginTop: 8,
  },
  readyText: {
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  progressSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.borderMedium,
  },
  progressDotActive: {
    backgroundColor: colors.accentTeal,
  },
  controlsSection: {
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  activeControls: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  completedControls: {
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  tipsSection: {
    paddingHorizontal: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.black,
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  tipText: {
    flex: 1,
    lineHeight: 20,
  },
});
