import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientButton from '@/src/components/buttons/GradientButton';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { MatchStats } from '@/src/types/matching';

interface HeroCardProps {
  stats: MatchStats | null;
}

/**
 * HeroCard component - Main CTA card encouraging users to start discovering
 * Displays swipes remaining info when available
 */
export function HeroCard({ stats }: HeroCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const getSubtitleText = (): string => {
    if (stats && stats.dailySwipesRemaining > 0) {
      return `You have ${stats.dailySwipesRemaining} swipes left today!`;
    }
    return 'We found people who share your interests and values.';
  };

  return (
    <LinearGradient
      colors={colors.gradients.registration.array}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroContent}>
        <AppText weight="semibold" size="h4" style={styles.heroTitle}>
          Ready to meet someone special?
        </AppText>
        <AppText color={colors.textSecondary} style={styles.heroSubtitle}>
          {getSubtitleText()}
        </AppText>
      </View>

      <GradientButton
        title="Start Discovering"
        onPress={() => navigation.navigate('DiscoveryScreen')}
        style={styles.primaryButton}
        textStyle={styles.primaryButtonText}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 24,
    padding: 20,
  },
  heroContent: {
    gap: 8,
    marginBottom: 12,
  },
  heroTitle: {
    color: colors.textPrimary,
  },
  heroSubtitle: {
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    letterSpacing: 0.2,
  },
});

export default HeroCard;
