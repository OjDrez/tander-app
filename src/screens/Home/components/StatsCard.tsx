import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';
import { MatchStats } from '@/src/types/matching';

interface StatsCardProps {
  stats: MatchStats;
}

/**
 * StatsCard component - Displays user activity statistics
 * Shows active matches, daily views, and remaining swipes
 */
export function StatsCard({ stats }: StatsCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.statsCard}>
      <AppText weight="semibold" size="h4" style={styles.cardTitle}>
        Your Activity
      </AppText>
      <View style={styles.statsRow}>
        {/* Matches - Tappable */}
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => navigation.navigate('MyMatchesScreen')}
          accessibilityRole="button"
          accessibilityLabel={`${stats.activeMatches} active matches`}
        >
          <AppText size="h2" weight="bold" color={colors.primary}>
            {stats.activeMatches}
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            Matches
          </AppText>
        </TouchableOpacity>

        <View style={styles.statDivider} />

        {/* Views Today - Non-tappable */}
        <View style={styles.statItem}>
          <AppText size="h2" weight="bold" color={colors.accentTeal}>
            {stats.dailySwipesUsed}
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            Views Today
          </AppText>
        </View>

        <View style={styles.statDivider} />

        {/* Swipes Left - Non-tappable */}
        <View style={styles.statItem}>
          <AppText size="h2" weight="bold" color={colors.accentBlue}>
            {stats.dailySwipesRemaining}
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            Swipes Left
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.borderLight,
  },
});

export default StatsCard;
