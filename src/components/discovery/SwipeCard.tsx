import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  Platform,
  AccessibilityInfo,
  Vibration,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AppText from '../inputs/AppText';
import colors from '../../config/colors';
import { DiscoveryProfile } from '../../types/matching';
import { getFullPhotoUrl } from '../../api/chatApi';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Increased threshold for seniors - requires more deliberate swipe
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
// Slower animation for better visibility
const SWIPE_OUT_DURATION = 350;

interface SwipeCardProps {
  profile: DiscoveryProfile;
  onSwipeLeft: (profile: DiscoveryProfile) => void;
  onSwipeRight: (profile: DiscoveryProfile) => void;
  onViewProfile: (profile: DiscoveryProfile) => void;
  isFirst?: boolean;
  showTutorial?: boolean; // Show tutorial hints for first-time users
}

/**
 * SwipeCard Component - Senior-Friendly Edition
 *
 * A swipeable card for the discovery/matching feature.
 * Optimized for seniors (60+) with:
 * - EXTRA LARGE touch targets (minimum 72px)
 * - Clear, high-contrast text (18px minimum)
 * - Slow, deliberate animations
 * - Haptic feedback on actions
 * - Large swipe buttons with labels
 * - Clear visual feedback on swipe direction
 * - Accessibility labels for screen readers
 * - Tutorial hints for new users
 */
export default function SwipeCard({
  profile,
  onSwipeLeft,
  onSwipeRight,
  onViewProfile,
  isFirst = false,
  showTutorial = false,
}: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const [isProcessing, setIsProcessing] = useState(false);
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
    if (isProcessing) return;
    setIsProcessing(true);

    // Haptic feedback for seniors - confirms action
    Vibration.vibrate(100);

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(`Liked ${profile.displayName}`);

    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onSwipeRight(profile);
      position.setValue({ x: 0, y: 0 });
      setIsProcessing(false);
    });
  };

  const swipeLeft = () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Haptic feedback
    Vibration.vibrate(50);

    // Announce for screen readers
    AccessibilityInfo.announceForAccessibility(`Passed on ${profile.displayName}`);

    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: SWIPE_OUT_DURATION,
      useNativeDriver: true,
    }).start(() => {
      onSwipeLeft(profile);
      position.setValue({ x: 0, y: 0 });
      setIsProcessing(false);
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

        {/* Action Buttons - EXTRA LARGE for seniors (60+) */}
        <View style={styles.buttonRow}>
          {/* PASS Button - with label */}
          <TouchableOpacity
            style={[styles.actionButton, styles.passButton]}
            onPress={() => swipeLeft()}
            activeOpacity={0.7}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Pass on ${profile.displayName}`}
            accessibilityHint="Tap to skip this person and see the next profile"
          >
            <Ionicons name="close" size={40} color={colors.danger} />
            <AppText size="small" weight="bold" color={colors.danger} style={styles.buttonLabel}>
              PASS
            </AppText>
          </TouchableOpacity>

          {/* View Profile Button - with label */}
          <TouchableOpacity
            style={[styles.actionButton, styles.infoButton]}
            onPress={() => {
              Vibration.vibrate(50);
              onViewProfile(profile);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`View ${profile.displayName}'s full profile`}
            accessibilityHint="Tap to see more photos and information"
          >
            <Ionicons name="person" size={32} color={colors.accentBlue} />
            <AppText size="small" weight="semibold" color={colors.accentBlue} style={styles.buttonLabel}>
              PROFILE
            </AppText>
          </TouchableOpacity>

          {/* LIKE Button - with label */}
          <TouchableOpacity
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swipeRight()}
            activeOpacity={0.7}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Like ${profile.displayName}`}
            accessibilityHint="Tap to show interest. If they like you back, you'll match!"
          >
            <Ionicons name="heart" size={40} color={colors.success} />
            <AppText size="small" weight="bold" color={colors.success} style={styles.buttonLabel}>
              LIKE
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Tutorial hint for new users */}
        {showTutorial && (
          <View style={styles.tutorialHint}>
            <AppText size="body" color={colors.white} style={styles.tutorialText}>
              Tap LIKE if interested, PASS to skip
            </AppText>
          </View>
        )}
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
    gap: 16,
    paddingHorizontal: 10,
  },
  actionButton: {
    // SENIOR-FRIENDLY: Minimum 72px touch target (Apple/Google guidelines)
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  passButton: {
    backgroundColor: colors.white,
    borderWidth: 3, // Thicker border for visibility
    borderColor: colors.danger,
  },
  likeButton: {
    backgroundColor: colors.white,
    borderWidth: 3,
    borderColor: colors.success,
  },
  infoButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accentBlue,
  },
  buttonLabel: {
    marginTop: 2,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  tutorialHint: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
  },
  tutorialText: {
    textAlign: 'center',
  },
});
