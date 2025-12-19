import React, { useMemo } from 'react';
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { UserProfile } from '@/src/api/userApi';
import { userApi } from '@/src/api/userApi';
import { photoApi } from '@/src/api/photoApi';

interface ProfileCardProps {
  currentUser: UserProfile | null;
}

/**
 * Default bio message for users who haven't set one
 */
const DEFAULT_BIO = 'Tell others about yourself by completing your profile.';

/**
 * ProfileCard component - Displays user's profile summary
 * Shows avatar, name, age, location, verification status, and bio
 */
export function ProfileCard({ currentUser }: ProfileCardProps) {
  // Memoize derived values to prevent unnecessary recalculations
  const displayName = useMemo(() => {
    return currentUser?.displayName || currentUser?.username || 'User';
  }, [currentUser?.displayName, currentUser?.username]);

  const location = useMemo(() => {
    if (!currentUser) return 'Location not set';
    return userApi.getLocationDisplay(currentUser);
  }, [currentUser]);

  const profilePhotoUrl = useMemo(() => {
    return photoApi.getPhotoUrl(currentUser?.profilePhotoUrl);
  }, [currentUser?.profilePhotoUrl]);

  const bio = useMemo(() => {
    return currentUser?.bio || DEFAULT_BIO;
  }, [currentUser?.bio]);

  const hasProfilePhoto = !!profilePhotoUrl;

  return (
    <View style={styles.card}>
      <View style={styles.profileRow}>
        {hasProfilePhoto ? (
          <Image
            source={{ uri: profilePhotoUrl }}
            style={styles.avatar}
            defaultSource={require('../../../assets/icons/tander-logo.png')}
          />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={36} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.profileTextGroup}>
          <View style={styles.nameRow}>
            <AppText weight="semibold" size="h4" style={styles.name}>
              {displayName}
              {currentUser?.age ? `, ${currentUser.age}` : ''}
            </AppText>
            {currentUser?.verified && (
              <MaterialCommunityIcons
                name="shield-check"
                size={18}
                color={colors.accentTeal}
                style={styles.verifiedIcon}
              />
            )}
          </View>

          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
            <AppText size="caption" color={colors.textSecondary}>
              {location}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.aboutBox}>
        <AppText size="small" color={colors.textSecondary} weight="semibold">
          About Me
        </AppText>
        <AppText style={styles.aboutText} numberOfLines={3}>
          {bio}
        </AppText>
      </View>
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  profileTextGroup: {
    flex: 1,
    gap: 6,
  },
  avatar: {
    height: 78,
    width: 78,
    borderRadius: 20,
    backgroundColor: colors.borderMedium,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundLight,
    borderWidth: 1,
    borderColor: colors.borderMedium,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    color: colors.textPrimary,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aboutBox: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 16,
    padding: 12,
    gap: 6,
  },
  aboutText: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
});

export default ProfileCard;
