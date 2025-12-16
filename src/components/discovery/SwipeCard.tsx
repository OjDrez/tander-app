import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';
import { DiscoveryProfile } from '../../types/matching';
import { getFullPhotoUrl } from '../../api/chatApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const SWIPE_OUT_DURATION = 250;

interface SwipeCardProps {
  profile: DiscoveryProfile;
  onSwipeLeft: (profile: DiscoveryProfile) => void;
  onSwipeRight: (profile: DiscoveryProfile) => void;
  onViewProfile: (profile: DiscoveryProfile) => void;
  isFirst?: boolean;
}

/**
 * SwipeCard Component
 *
 * A swipeable card for the discovery/matching feature.
 * Optimized for seniors with:
 * - Large, clear photos
 * - Easy-to-read text
 * - Large swipe buttons as alternative to gestures
 * - High contrast UI
 */
export default function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onViewProfile,
  isFirst = false,
}: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.95, 1],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isFirst,
      onMoveShouldSetPanResponder: () => isFirst,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onSwipeRight(profile);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onSwipeLeft(profile);
      position.setValue({ x: 0, y: 0 });
    });
  };

  const cardStyle = isFirst
    ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      }
    : {
        transform: [{ scale: nextCardScale }],
      };

  // Convert relative photo URL to full URL, fallback to UI Avatars
  const fullPhotoUrl = getFullPhotoUrl(profile.profilePhotoUrl);
  const profilePhoto = fullPhotoUrl
    ? { uri: fullPhotoUrl }
    : { uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'User')}&size=400&background=random` };

  return (
    <Animated.View
      style={[styles.card, cardStyle]}
      {...(isFirst ? panResponder.panHandlers : {})}
    >
      {/* Profile Image */}
      <Image source={profilePhoto} style={styles.image} />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      />

      {/* LIKE Stamp */}
      {isFirst && (
        <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
          <AppText weight="bold" size="h2" style={styles.stampText}>
            LIKE
          </AppText>
        </Animated.View>
      )}

      {/* NOPE Stamp */}
      {isFirst && (
        <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
          <AppText weight="bold" size="h2" style={styles.stampText}>
            PASS
          </AppText>
        </Animated.View>
      )}

      {/* Profile Info */}
      <View style={styles.infoContainer}>
        {/* Verified Badge */}
        {profile.verified && (
          <View style={styles.verifiedBadge}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.white} />
            <AppText size="small" weight="semibold" color={colors.white}>
              Verified
            </AppText>
          </View>
        )}

        {/* Name and Age */}
        <View style={styles.nameRow}>
          <AppText weight="bold" size="h2" color={colors.white}>
            {profile.displayName}
          </AppText>
          {profile.age && (
            <AppText weight="semibold" size="h3" color={colors.white}>
              , {profile.age}
            </AppText>
          )}
        </View>

        {/* Location */}
        {profile.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.white} />
            <AppText size="body" color={colors.white} style={styles.locationText}>
              {profile.location}
            </AppText>
          </View>
        )}

        {/* Bio Preview */}
        {profile.bio && (
          <AppText
            size="body"
            color={colors.white}
            numberOfLines={2}
            style={styles.bio}
          >
            {profile.bio}
          </AppText>
        )}

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsRow}>
            {profile.interests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestPill}>
                <AppText size="small" color={colors.white}>
                  {interest}
                </AppText>
              </View>
            ))}
            {profile.interests.length > 3 && (
              <View style={styles.interestPill}>
                <AppText size="small" color={colors.white}>
                  +{profile.interests.length - 3}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* Action Buttons - Large and accessible for seniors */}
        <View style={styles.buttonRow}>
          {/* PASS Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => swipeLeft()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Pass on this person"
            accessibilityHint="Double tap to skip this profile"
          >
            <Ionicons name="close" size={36} color={colors.danger} />
          </TouchableOpacity>

          {/* View Profile Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
            onPress={() => onViewProfile(profile)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View full profile"
            accessibilityHint="Double tap to see more details"
          >
            <Ionicons name="information-circle" size={32} color={colors.accentBlue} />
          </TouchableOpacity>

          {/* LIKE Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swipeRight()}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Like this person"
            accessibilityHint="Double tap to express interest"
          >
            <Ionicons name="heart" size={36} color={colors.success} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.65,
    borderRadius: 24,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  stamp: {
    position: 'absolute',
    top: 60,
    padding: 10,
    borderWidth: 4,
    borderRadius: 12,
  },
  likeStamp: {
    left: 20,
    borderColor: colors.success,
    transform: [{ rotate: '-15deg' }],
  },
  nopeStamp: {
    right: 20,
    borderColor: colors.danger,
    transform: [{ rotate: '15deg' }],
  },
  stampText: {
    color: colors.success,
  },
  infoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 24,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    marginBottom: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    opacity: 0.9,
  },
  bio: {
    opacity: 0.9,
    marginBottom: 12,
    lineHeight: 24,
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  interestPill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  passButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.danger,
  },
  likeButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.success,
  },
  infoButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accentBlue,
  },
});
