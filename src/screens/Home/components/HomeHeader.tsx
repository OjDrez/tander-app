import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { AppStackParamList } from '@/src/navigation/NavigationTypes';

/**
 * Maximum badge count to display before showing "99+"
 */
const MAX_BADGE_COUNT = 99;

interface HomeHeaderProps {
  activeMatchesCount: number;
}

/**
 * HomeHeader component displays:
 * - Tander logo and brand name
 * - Matches button with badge count
 * - Messages button
 */
export function HomeHeader({ activeMatchesCount }: HomeHeaderProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const displayBadgeCount = activeMatchesCount > MAX_BADGE_COUNT
    ? '99+'
    : activeMatchesCount.toString();

  return (
    <View style={styles.headerRow}>
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Image
            source={require('../../../assets/icons/tander-logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <AppText weight="semibold" size="body">
          TANDER
        </AppText>
      </View>

      <View style={styles.headerButtons}>
        {/* Matches Button */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MyMatchesScreen')}
          accessibilityRole="button"
          accessibilityLabel={`View matches. You have ${activeMatchesCount} matches`}
        >
          <Ionicons name="heart" size={18} color={colors.primary} />
          {activeMatchesCount > 0 && (
            <View style={styles.badge}>
              <AppText size="small" weight="bold" color={colors.white}>
                {displayBadgeCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Messages Button */}
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('InboxScreen')}
          accessibilityRole="button"
          accessibilityLabel="View messages"
        >
          <Ionicons name="chatbubbles-outline" size={18} color={colors.accentBlue} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIcon: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadowMedium,
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {},
    }),
  },
  logoImage: {
    height: 36,
    width: 36,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    height: 44,
    width: 44,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOpacity: 0.08,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
      },
      android: {
        elevation: 2,
      },
    }),
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});

export default HomeHeader;
