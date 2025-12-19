import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import GradientButton from '@/src/components/buttons/GradientButton';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';

interface CompleteProfileCardProps {
  userId: number;
}

/**
 * CompleteProfileCard component - Prompts users to complete their profile
 * Only shown when profile is not yet completed
 */
export function CompleteProfileCard({ userId }: CompleteProfileCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <AppText size="small" color={colors.textSecondary} weight="semibold">
            New to our community
          </AppText>
        </View>
      </View>

      <AppText weight="semibold" size="h4" style={styles.cardTitle}>
        Complete your Profile
      </AppText>
      <AppText color={colors.textSecondary} style={styles.cardSubtitle}>
        Add your photos and details to get better matches.
      </AppText>

      <GradientButton
        title="Complete Profile"
        onPress={() =>
          navigation.navigate('ProfileViewScreen', {
            userId: userId.toString(),
          })
        }
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 14,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: colors.accentMint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cardTitle: {
    color: colors.textPrimary,
  },
  cardSubtitle: {
    lineHeight: 20,
  },
  button: {
    width: '100%',
  },
});

export default CompleteProfileCard;
