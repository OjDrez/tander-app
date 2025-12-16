import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import MainNavigationBar, {
  MainNavigationTab,
} from "@/src/components/navigation/MainNavigationBar";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback, useRef } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { discoveryApi } from "@/src/api/discoveryApi";
import { matchingApi } from "@/src/api/matchingApi";
import { photoApi } from "@/src/api/photoApi";
import { startConversation } from "@/src/api/chatApi";
import { DiscoveryProfile, SwipeResponse } from "@/src/types/matching";

type ViewProfileRouteProp = RouteProp<AppStackParamList, "ViewProfileScreen">;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const PHOTO_HEIGHT = SCREEN_HEIGHT * 0.55;
const CARD_RADIUS = 28;

interface ProfileState {
  data: DiscoveryProfile | null;
  isLoading: boolean;
  error: string | null;
}

interface ActionState {
  isLiking: boolean;
  isPassing: boolean;
  isMessaging: boolean;
}

export default function ViewProfileScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<ViewProfileRouteProp>();
  const { userId } = route.params;

  const [profile, setProfile] = useState<ProfileState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [actionState, setActionState] = useState<ActionState>({
    isLiking: false,
    isPassing: false,
    isMessaging: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const likeAnim = useRef(new Animated.Value(0)).current;
  const passAnim = useRef(new Animated.Value(0)).current;

  // Fetch profile data
  const loadProfile = useCallback(async () => {
    try {
      setProfile((prev) => ({ ...prev, isLoading: true, error: null }));
      const userIdNum = parseInt(userId, 10);

      if (isNaN(userIdNum)) {
        throw new Error("Invalid user ID");
      }

      // Fetch profile and match status in parallel
      const [profileData, matchStatus] = await Promise.all([
        discoveryApi.getProfile(userIdNum),
        matchingApi.checkMatch(userIdNum).catch(() => ({ isMatched: false, userId: userIdNum })),
      ]);

      // Override isMatched with the actual match status from the API
      // This ensures correct status even if discoveryApi returns stale data
      const updatedProfileData = {
        ...profileData,
        isMatched: matchStatus.isMatched,
        // If we're matched, don't show "liked you" banner
        hasLikedMe: matchStatus.isMatched ? false : profileData.hasLikedMe,
      };

      setProfile({
        data: updatedProfileData,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      setProfile({
        data: null,
        isLoading: false,
        error: error.message || "Failed to load profile",
      });
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  // Get photo URL with fallback
  const getPhotoUrl = (photoPath?: string | null): string => {
    if (photoPath) {
      const url = photoApi.getPhotoUrl(photoPath);
      if (url) return url;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      profile.data?.displayName || "User"
    )}&size=400&background=F5A14B&color=fff`;
  };

  // Get all photos (profile + additional)
  const getAllPhotos = (): string[] => {
    const photos: string[] = [];
    if (profile.data?.profilePhotoUrl) {
      photos.push(getPhotoUrl(profile.data.profilePhotoUrl));
    }
    if (profile.data?.additionalPhotos) {
      profile.data.additionalPhotos.forEach((photo) => {
        photos.push(getPhotoUrl(photo));
      });
    }
    if (photos.length === 0) {
      photos.push(getPhotoUrl(null));
    }
    return photos;
  };

  // Button press animation
  const animateButtonPress = (animation: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Handle Like action
  const handleLike = async () => {
    if (actionState.isLiking || !profile.data) return;

    try {
      setActionState((prev) => ({ ...prev, isLiking: true }));
      animateButtonPress(likeAnim);

      const response: SwipeResponse = await matchingApi.like(profile.data.userId);

      if (response.isMatch) {
        // Update local state to reflect the match
        setProfile((prev) => ({
          ...prev,
          data: prev.data ? { ...prev.data, isMatched: true, hasLikedMe: false } : null,
        }));

        Alert.alert(
          "It's a Match! 🎉",
          `You and ${profile.data.displayName} have liked each other!`,
          [
            {
              text: "Send Message",
              onPress: () => handleStartConversation(),
            },
            {
              text: "Keep Browsing",
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          "Liked! ❤️",
          `You liked ${profile.data.displayName}. If they like you back, you'll match!`,
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error: any) {
      Alert.alert("Oops!", error.message || "Failed to send like. Please try again.");
    } finally {
      setActionState((prev) => ({ ...prev, isLiking: false }));
    }
  };

  // Handle Pass action
  const handlePass = async () => {
    if (actionState.isPassing || !profile.data) return;

    try {
      setActionState((prev) => ({ ...prev, isPassing: true }));
      animateButtonPress(passAnim);

      await matchingApi.pass(profile.data.userId);
      navigation.goBack();
    } catch (error: any) {
      Alert.alert("Oops!", error.message || "Something went wrong. Please try again.");
    } finally {
      setActionState((prev) => ({ ...prev, isPassing: false }));
    }
  };

  // Handle Start Conversation
  const handleStartConversation = async () => {
    if (actionState.isMessaging || !profile.data) return;

    try {
      setActionState((prev) => ({ ...prev, isMessaging: true }));

      // Check if already matched
      const matchCheck = await matchingApi.checkMatch(profile.data.userId);

      if (!matchCheck.isMatched) {
        Alert.alert(
          "Not Matched Yet",
          "You need to match with this person before you can message them. Like their profile first!",
          [{ text: "OK" }]
        );
        return;
      }

      // Start or get existing conversation
      const conversation = await startConversation(profile.data.userId);

      navigation.navigate("ConversationScreen", {
        conversationId: conversation.id,
        otherUserId: profile.data.userId,
        otherUserName: profile.data.displayName,
        avatarUrl: getPhotoUrl(profile.data.profilePhotoUrl),
        roomId: conversation.roomId,
      });
    } catch (error: any) {
      Alert.alert("Oops!", error.message || "Failed to start conversation. Please try again.");
    } finally {
      setActionState((prev) => ({ ...prev, isMessaging: false }));
    }
  };

  // Handle photo navigation
  const handlePhotoTap = (direction: "left" | "right") => {
    const photos = getAllPhotos();
    if (direction === "left" && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    } else if (direction === "right" && currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const handleTabPress = (tab: MainNavigationTab) => {
    if (tab === "Home") {
      navigation.navigate("HomeScreen");
    } else if (tab === "Inbox") {
      navigation.navigate("InboxScreen");
    } else if (tab === "Matches") {
      navigation.navigate("MyMatchesScreen");
    } else if (tab === "Profile") {
      navigation.navigate("SettingsScreen");
    }
  };

  // Loading state
  if (profile.isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText size="body" color={colors.textSecondary} style={styles.loadingText}>
              Loading profile...
            </AppText>
          </View>
        </SafeAreaView>
        <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
      </FullScreen>
    );
  }

  // Error state
  if (profile.error || !profile.data) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle-outline" size={64} color={colors.textMuted} />
            </View>
            <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.errorTitle}>
              Profile Not Found
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.errorMessage}>
              {profile.error || "We couldn't find this profile. It may have been removed or is temporarily unavailable."}
            </AppText>
            <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
              <Ionicons name="refresh" size={20} color={colors.white} />
              <AppText size="body" weight="semibold" color={colors.white}>
                Try Again
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <AppText size="body" weight="medium" color={colors.primary}>
                Go Back
              </AppText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
      </FullScreen>
    );
  }

  const photos = getAllPhotos();
  const currentPhoto = photos[currentPhotoIndex];
  const { data } = profile;

  // Format location
  const locationParts = [];
  if (data.city) locationParts.push(data.city);
  if (data.country) locationParts.push(data.country);
  const location = locationParts.join(", ") || "Location not set";

  return (
    <FullScreen statusBarStyle="light" style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        {/* Header with back button */}
        <View style={styles.headerOverlay}>
          <SafeAreaView edges={["top"]} style={styles.headerSafeArea}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                activeOpacity={0.85}
                style={styles.headerButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="chevron-back" size={24} color={colors.white} />
              </TouchableOpacity>

              <View style={styles.headerRight}>
                {data.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.white} />
                    <AppText size="tiny" weight="semibold" color={colors.white}>
                      Verified
                    </AppText>
                  </View>
                )}
                {data.online && (
                  <View style={styles.onlineBadge}>
                    <View style={styles.onlineDot} />
                    <AppText size="tiny" weight="semibold" color={colors.white}>
                      Online
                    </AppText>
                  </View>
                )}
              </View>
            </View>
          </SafeAreaView>
        </View>

        {/* Photo section with tap navigation */}
        <View style={styles.photoContainer}>
          <TouchableOpacity
            style={styles.photoTapLeft}
            activeOpacity={1}
            onPress={() => handlePhotoTap("left")}
          />
          <TouchableOpacity
            style={styles.photoTapRight}
            activeOpacity={1}
            onPress={() => handlePhotoTap("right")}
          />

          <Image source={{ uri: currentPhoto }} style={styles.photo} resizeMode="cover" />

          <LinearGradient
            colors={["rgba(0,0,0,0.4)", "transparent", "transparent", "rgba(0,0,0,0.7)"]}
            locations={[0, 0.2, 0.5, 1]}
            style={styles.photoGradient}
          />

          {/* Photo indicators */}
          {photos.length > 1 && (
            <View style={styles.photoIndicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === currentPhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          )}

          {/* Profile info overlay */}
          <View style={styles.profileInfoOverlay}>
            <View style={styles.nameRow}>
              <AppText size="h1" weight="bold" color={colors.white}>
                {data.displayName}
              </AppText>
              {data.age && (
                <AppText size="h2" weight="medium" color={colors.white}>
                  , {data.age}
                </AppText>
              )}
            </View>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color={colors.white} />
              <AppText size="body" weight="medium" color={colors.white} style={styles.locationText}>
                {location}
              </AppText>
              {data.distanceKm !== undefined && (
                <AppText size="small" color="rgba(255,255,255,0.8)">
                  • {data.distanceKm < 1 ? "Less than 1" : Math.round(data.distanceKm)} km away
                </AppText>
              )}
            </View>

            {/* Tags */}
            {data.lookingFor && data.lookingFor.length > 0 && (
              <View style={styles.tagRow}>
                {data.lookingFor.slice(0, 3).map((tag) => (
                  <View key={tag} style={styles.tagBadge}>
                    <AppText size="tiny" weight="semibold" color={colors.primary}>
                      {tag}
                    </AppText>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Action buttons - different layout based on match status */}
        {data.isMatched ? (
          // Already matched - show only message button (larger)
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Send Message"
              activeOpacity={0.9}
              style={styles.primaryMessageButton}
              onPress={handleStartConversation}
              disabled={actionState.isMessaging}
            >
              {actionState.isMessaging ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <MaterialCommunityIcons name="chat" size={24} color={colors.white} />
                  <AppText size="body" weight="bold" color={colors.white}>
                    Send Message
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          // Not matched - show pass, like, and message buttons
          <View style={styles.actionButtonsContainer}>
            <Animated.View
              style={[
                styles.actionButtonWrapper,
                {
                  transform: [
                    {
                      scale: passAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0.85],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Pass"
                activeOpacity={0.9}
                style={[styles.actionButton, styles.passButton]}
                onPress={handlePass}
                disabled={actionState.isPassing}
              >
                {actionState.isPassing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="close" size={28} color={colors.white} />
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View
              style={[
                styles.actionButtonWrapper,
                {
                  transform: [
                    {
                      scale: likeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.15],
                      }),
                    },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Like"
                activeOpacity={0.9}
                style={[styles.actionButton, styles.likeButton]}
                onPress={handleLike}
                disabled={actionState.isLiking}
              >
                {actionState.isLiking ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Ionicons name="heart" size={28} color={colors.white} />
                )}
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Message"
              activeOpacity={0.9}
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleStartConversation}
              disabled={actionState.isMessaging}
            >
              {actionState.isMessaging ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <MaterialCommunityIcons name="chat" size={24} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* About section */}
        {data.bio && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="user" size={16} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
                About {data.displayName.split(" ")[0]}
              </AppText>
            </View>
            <AppText size="body" color={colors.textSecondary} style={styles.bioText}>
              {data.bio}
            </AppText>
          </View>
        )}

        {/* Interests section */}
        {data.interests && data.interests.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="heart-circle" size={18} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
                Interests
              </AppText>
            </View>
            <View style={styles.interestsGrid}>
              {data.interests.map((interest) => (
                <View key={interest} style={styles.interestBadge}>
                  <AppText size="small" weight="medium" color={colors.textPrimary}>
                    {interest}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Looking for section */}
        {data.lookingFor && data.lookingFor.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="search" size={18} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.sectionTitle}>
                Looking For
              </AppText>
            </View>
            <View style={styles.interestsGrid}>
              {data.lookingFor.map((item) => (
                <View key={item} style={styles.lookingForBadge}>
                  <AppText size="small" weight="medium" color={colors.primary}>
                    {item}
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Match status indicator */}
        {data.isMatched && (
          <View style={styles.matchedBanner}>
            <LinearGradient
              colors={[colors.primary, colors.accentTeal]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.matchedBannerGradient}
            >
              <Ionicons name="heart" size={20} color={colors.white} />
              <AppText size="body" weight="bold" color={colors.white}>
                You're matched! Start a conversation
              </AppText>
            </LinearGradient>
          </View>
        )}

        {data.hasLikedMe && !data.isMatched && (
          <View style={styles.likedYouBanner}>
            <Ionicons name="heart" size={18} color={colors.primary} />
            <AppText size="body" weight="semibold" color={colors.primary}>
              {data.displayName.split(" ")[0]} liked you! Like back to match
            </AppText>
          </View>
        )}

        {/* Bottom spacing for navigation bar */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      <MainNavigationBar activeTab="Matches" onTabPress={handleTabPress} />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // Loading & Error states
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  errorTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 16,
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  // Header
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerSafeArea: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(51, 169, 162, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4ADE80",
  },
  // Photo section
  photoContainer: {
    height: PHOTO_HEIGHT,
    width: "100%",
    position: "relative",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  photoTapLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "30%",
    zIndex: 5,
  },
  photoTapRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: "30%",
    zIndex: 5,
  },
  photoIndicators: {
    position: "absolute",
    top: 100,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 4,
  },
  photoIndicator: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  photoIndicatorActive: {
    backgroundColor: colors.white,
  },
  profileInfoOverlay: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 90,
    gap: 8,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  locationText: {
    marginLeft: 2,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.accentMint,
    borderRadius: 16,
  },
  // Action buttons
  actionButtonsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: -40,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  actionButtonWrapper: {
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  actionButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  passButton: {
    backgroundColor: colors.danger,
  },
  likeButton: {
    backgroundColor: colors.primary,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  messageButton: {
    backgroundColor: colors.accentTeal,
  },
  primaryMessageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
  },
  // Sections
  section: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  sectionTitle: {
    flex: 1,
  },
  bioText: {
    lineHeight: 24,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.accentMint,
    borderRadius: 14,
  },
  lookingForBadge: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.accentPeach,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  // Banners
  matchedBanner: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  matchedBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  likedYouBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: colors.accentPeach,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  bottomSpacing: {
    height: 120,
  },
});
