import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { userApi, UserProfile } from "@/src/api/userApi";
import { photoApi } from "@/src/api/photoApi";
import {
  SCREEN_WIDTH,
  seniorResponsive,
  moderateScale,
  isSmallDevice,
  isMediumDevice,
} from "@/src/utility/responsive";

// Responsive sizing constants
const MIN_TOUCH_TARGET = seniorResponsive.touchTarget();
const SENIOR_ICON_SIZE = seniorResponsive.iconMedium();
const SENIOR_CARD_RADIUS = seniorResponsive.cardRadius();
const CONTENT_PADDING = seniorResponsive.contentPadding();
const PROFILE_PHOTO_HEIGHT = seniorResponsive.profilePhotoHeight() + 40; // Slightly taller for view screen

// Route params for this screen
type ProfileViewRouteProp = RouteProp<
  { ProfileViewScreen: { userId: string } },
  "ProfileViewScreen"
>;

export default function ProfileViewScreen() {
  const navigation = useNavigation();
  const route = useRoute<ProfileViewRouteProp>();
  const { userId } = route.params;

  // State for profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userIdNum = Number(userId);
      if (isNaN(userIdNum)) {
        throw new Error("Invalid user ID");
      }

      const data = await userApi.getUserById(userIdNum);
      setProfile(data);
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleChatPress = useCallback(() => {
    if (!profile) return;
    NavigationService.navigate("ChatRoomScreen", {
      oderId: profile.id,
      displayName: profile.displayName,
    });
  }, [profile]);

  const handleVideoPress = useCallback(() => {
    if (!profile) return;
    NavigationService.navigate("VideoCallScreen", {
      oderId: profile.id,
      username: profile.displayName,
      callType: "video",
    });
  }, [profile]);

  const getPhotoUrl = (): string => {
    if (profile?.profilePhotoUrl) {
      return photoApi.getPhotoUrl(profile.profilePhotoUrl) || "";
    }
    // Use placeholder with initials
    const initials = profile?.displayName
      ? profile.displayName.split(' ').map(n => n[0]).join('').substring(0, 2)
      : 'U';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=E8F8F7&color=33A9A2&size=400&font-size=0.4&bold=true`;
  };

  const getLocation = (): string => {
    if (profile) {
      return userApi.getLocationDisplay(profile);
    }
    return "Location not available";
  };

  const getInterests = (): string[] => {
    if (profile?.interests) {
      return userApi.parseInterests(profile.interests);
    }
    return [];
  };

  // Loading state - Senior friendly with large, clear elements
  if (isLoading) {
    return (
      <LoadingIndicator
        variant="fullscreen"
        message="Loading Profile"
        subtitle="Please wait a moment..."
      />
    );
  }

  // Error state - Senior friendly with large, clear elements
  if (error || !profile) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <LinearGradient
          colors={colors.gradients.softAqua.array}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.errorContainer}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back to previous screen"
                accessibilityHint="Double tap to go back"
                activeOpacity={0.7}
                style={styles.iconButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons
                  name="chevron-back"
                  size={SENIOR_ICON_SIZE}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.errorContent}>
              <View style={styles.errorIconContainer}>
                <Ionicons name="alert-circle-outline" size={80} color={colors.error} />
              </View>
              <AppText size="h2" weight="bold" color={colors.textPrimary} style={styles.errorTitle}>
                Something Went Wrong
              </AppText>
              <AppText size="h4" weight="medium" color={colors.textSecondary} style={styles.errorMessage}>
                {error || "This profile is not available right now"}
              </AppText>
              <AppText size="body" color={colors.textMuted} style={styles.errorHint}>
                Please check your internet connection and try again
              </AppText>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchProfile}
                accessibilityRole="button"
                accessibilityLabel="Try loading the profile again"
                accessibilityHint="Double tap to reload"
              >
                <Ionicons name="refresh" size={SENIOR_ICON_SIZE} color={colors.white} />
                <AppText size="h3" weight="bold" color={colors.white} style={styles.retryText}>
                  Try Again
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </FullScreen>
    );
  }

  const interests = getInterests();

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.content}
        >
          {/* Header Navigation - Senior Friendly with large buttons */}
          <View style={styles.headerRow}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go back to previous screen"
              accessibilityHint="Double tap to go back"
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="chevron-back"
                size={SENIOR_ICON_SIZE}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Go to home screen"
              accessibilityHint="Double tap to go home"
              activeOpacity={0.7}
              style={styles.iconButton}
              onPress={() => NavigationService.navigate("HomeScreen")}
            >
              <Ionicons name="home" size={28} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Profile Photo Card - Senior Friendly */}
          <View style={styles.photoCard}>
            <Image source={{ uri: getPhotoUrl() }} style={styles.photo} />
            <LinearGradient
              colors={["transparent", "rgba(3, 2, 19, 0.45)"]}
              start={{ x: 0, y: 0.3 }}
              end={{ x: 0, y: 1 }}
              style={styles.photoOverlay}
            />
            <View style={styles.infoOverlay}>
              <View style={styles.nameRow}>
                <AppText size="h1" weight="bold" color={colors.white}>
                  {profile.displayName}
                </AppText>
                {profile.age && (
                  <View style={styles.ageBadge}>
                    <AppText size="h3" weight="bold" color={colors.white}>
                      {profile.age}
                    </AppText>
                  </View>
                )}
              </View>
              <View style={styles.locationRow}>
                <View style={styles.locationIconCircle}>
                  <Ionicons name="location" size={24} color={colors.white} />
                </View>
                <AppText
                  size="h4"
                  weight="semibold"
                  color={colors.white}
                  style={styles.locationText}
                >
                  {getLocation()}
                </AppText>
              </View>
              {profile.verified && (
                <View style={styles.verifiedRow}>
                  <Ionicons name="shield-checkmark" size={28} color={colors.success} />
                  <AppText size="body" weight="bold" color={colors.white} style={styles.verifiedText}>
                    Verified Profile
                  </AppText>
                </View>
              )}
            </View>
          </View>

          {/* About Card - Senior Friendly */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person-outline" size={28} color={colors.primary} />
              <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginLeft: 12 }}>
                About {profile.displayName}
              </AppText>
            </View>
            <AppText size="h4" weight="normal" color={colors.textPrimary} style={styles.bioText}>
              {profile.bio || "No bio available yet"}
            </AppText>
          </View>

          {/* Interests Card - Senior Friendly */}
          {interests.length > 0 && (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons
                  name="heart-multiple"
                  size={28}
                  color={colors.primary}
                />
                <AppText size="h3" weight="bold" color={colors.textPrimary} style={{ marginLeft: 12 }}>
                  Interests
                </AppText>
              </View>
              <View style={styles.interestWrap}>
                {interests.map((interest) => (
                  <View key={interest} style={styles.interestPill}>
                    <AppText size="body" weight="bold" color={colors.primary}>
                      {interest}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Action Buttons - Extra Large for seniors with clear labels */}
          <View style={styles.actionsContainer}>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.actionsTitle}>
              Connect with {profile.displayName}
            </AppText>

            <View style={styles.actionsRow}>
              <GradientButton
                title="Send Message"
                textSize="h4"
                onPress={handleChatPress}
                style={styles.button}
                accessibilityLabel={`Send a message to ${profile.displayName}`}
                accessibilityHint="Double tap to start a chat"
              />
            </View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Start a video call with ${profile.displayName}`}
              accessibilityHint="Double tap to begin video call"
              activeOpacity={0.7}
              style={styles.videoButton}
              onPress={handleVideoPress}
            >
              <LinearGradient
                colors={colors.gradients.softAqua.array}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.videoGradient}
              >
                <View style={styles.videoContent}>
                  <View style={styles.videoIconCircle}>
                    <MaterialCommunityIcons
                      name="video-outline"
                      size={SENIOR_ICON_SIZE}
                      color={colors.accentBlue}
                    />
                  </View>
                  <View style={styles.videoTextContainer}>
                    <AppText
                      size="h4"
                      weight="bold"
                      color={colors.accentBlue}
                    >
                      Video Call
                    </AppText>
                    <AppText
                      size="body"
                      weight="medium"
                      color={colors.textSecondary}
                    >
                      See and talk face to face
                    </AppText>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </FullScreen>
  );
}

// Responsive helper values
const LOCATION_ICON_SIZE = isSmallDevice ? 32 : isMediumDevice ? 36 : 40;
const VIDEO_ICON_SIZE = isSmallDevice ? 44 : isMediumDevice ? 50 : 56;
const LOADING_ICON_SIZE = isSmallDevice ? 80 : isMediumDevice ? 90 : 100;
const ERROR_ICON_SIZE = isSmallDevice ? 100 : isMediumDevice ? 110 : 120;
const AGE_BADGE_HEIGHT = isSmallDevice ? 44 : isMediumDevice ? 50 : 56;
const VERIFIED_ROW_HEIGHT = isSmallDevice ? 44 : isMediumDevice ? 48 : 52;
const INTEREST_HEIGHT = isSmallDevice ? 44 : isMediumDevice ? 50 : 56;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  content: {
    padding: CONTENT_PADDING,
    paddingBottom: moderateScale(50),
  },

  // ========== HEADER - Responsive ==========
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateScale(16),
    paddingTop: moderateScale(8),
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: MIN_TOUCH_TARGET / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(10),
    elevation: 5,
  },

  // ========== PHOTO CARD - Responsive ==========
  photoCard: {
    position: "relative",
    overflow: "hidden",
    borderRadius: SENIOR_CARD_RADIUS,
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: moderateScale(8) },
    shadowRadius: moderateScale(20),
    elevation: 10,
  },
  photo: {
    width: "100%",
    height: PROFILE_PHOTO_HEIGHT,
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  infoOverlay: {
    position: "absolute",
    left: moderateScale(20),
    bottom: moderateScale(20),
    right: moderateScale(20),
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(12),
    flexWrap: "wrap",
  },
  ageBadge: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(24),
    backgroundColor: "rgba(51, 169, 162, 0.95)",
    minHeight: AGE_BADGE_HEIGHT,
    justifyContent: "center",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(10),
  },
  locationIconCircle: {
    width: LOCATION_ICON_SIZE,
    height: LOCATION_ICON_SIZE,
    borderRadius: LOCATION_ICON_SIZE / 2,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  locationText: {
    marginLeft: moderateScale(10),
    flex: 1,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateScale(12),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(16),
    minHeight: VERIFIED_ROW_HEIGHT,
  },
  verifiedText: {
    marginLeft: moderateScale(8),
  },

  // ========== CARDS - Responsive ==========
  card: {
    marginTop: moderateScale(20),
    backgroundColor: colors.white,
    borderRadius: SENIOR_CARD_RADIUS,
    padding: CONTENT_PADDING,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(12),
    elevation: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: moderateScale(12),
  },
  bioText: {
    lineHeight: moderateScale(28),
  },
  interestWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },
  interestPill: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateScale(12),
    backgroundColor: colors.accentMint,
    borderRadius: moderateScale(24),
    minHeight: INTEREST_HEIGHT,
    justifyContent: "center",
  },

  // ========== ACTIONS - Responsive ==========
  actionsContainer: {
    marginTop: moderateScale(24),
    backgroundColor: colors.white,
    borderRadius: SENIOR_CARD_RADIUS,
    padding: CONTENT_PADDING,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(12),
    elevation: 6,
  },
  actionsTitle: {
    marginBottom: moderateScale(16),
    textAlign: "center",
  },
  actionsRow: {
    marginBottom: moderateScale(12),
  },
  button: {
    width: "100%",
  },
  videoButton: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowRadius: moderateScale(10),
    elevation: 5,
    borderRadius: SENIOR_CARD_RADIUS,
    overflow: "hidden",
    borderWidth: isSmallDevice ? 1 : 2,
    borderColor: colors.accentMint,
  },
  videoGradient: {
    paddingVertical: moderateScale(16),
    paddingHorizontal: moderateScale(20),
    minHeight: MIN_TOUCH_TARGET,
  },
  videoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  videoIconCircle: {
    width: VIDEO_ICON_SIZE,
    height: VIDEO_ICON_SIZE,
    borderRadius: VIDEO_ICON_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(12),
  },
  videoTextContainer: {
    flex: 1,
  },

  // ========== LOADING STATE - Responsive ==========
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: moderateScale(24),
  },
  loadingIconContainer: {
    width: LOADING_ICON_SIZE,
    height: LOADING_ICON_SIZE,
    borderRadius: LOADING_ICON_SIZE / 2,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: moderateScale(3) },
    shadowRadius: moderateScale(10),
    elevation: 4,
  },
  loadingText: {
    marginTop: moderateScale(22),
    textAlign: "center",
  },

  // ========== ERROR STATE - Responsive ==========
  errorContainer: {
    flex: 1,
    padding: CONTENT_PADDING,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: moderateScale(20),
  },
  errorIconContainer: {
    width: ERROR_ICON_SIZE,
    height: ERROR_ICON_SIZE,
    borderRadius: ERROR_ICON_SIZE / 2,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    marginTop: moderateScale(22),
    textAlign: "center",
  },
  errorMessage: {
    marginTop: moderateScale(14),
    textAlign: "center",
    paddingHorizontal: moderateScale(16),
  },
  errorHint: {
    marginTop: moderateScale(10),
    textAlign: "center",
    paddingHorizontal: moderateScale(16),
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: moderateScale(36),
    paddingVertical: moderateScale(18),
    borderRadius: moderateScale(32),
    marginTop: moderateScale(28),
    minWidth: moderateScale(220),
    minHeight: MIN_TOUCH_TARGET,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowRadius: moderateScale(10),
    elevation: 6,
  },
  retryText: {
    marginLeft: moderateScale(12),
  },
});
