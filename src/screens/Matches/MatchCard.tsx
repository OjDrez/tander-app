import React, { useState } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { MatchStatus } from "@/src/types/matching";

export type MatchAction = "chat" | "video";

export type MatchItem = {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
  matchedOn: string;
  action: MatchAction;
  // Extended fields for real API data
  matchedUserId?: number;
  conversationId?: number;
  status?: MatchStatus;
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
};

interface MatchCardProps {
  item: MatchItem;
  onPress: (id: string) => void;
  onActionPress: (item: MatchItem) => void;
  onLongPress?: () => void;
}

export default function MatchCard({ item, onPress, onActionPress, onLongPress }: MatchCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const isExpired = item.status === "EXPIRED";
  const isExpiringSoon = item.hoursUntilExpiration !== undefined && item.hoursUntilExpiration <= 24 && !item.chatStarted;
  const isUrgent = item.hoursUntilExpiration !== undefined && item.hoursUntilExpiration < 6 && !item.chatStarted;

  // Generate fallback avatar URL
  const fallbackAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&size=200&background=33A9A2&color=ffffff&bold=true`;

  // Use the provided avatar or fallback
  const avatarUrl = imageError || !item.avatar ? fallbackAvatarUrl : item.avatar;

  // Format expiration text - more friendly for seniors
  const getExpirationInfo = () => {
    if (item.chatStarted) {
      return {
        text: "You're already chatting!",
        icon: "chatbubble-ellipses" as const,
        color: colors.success,
        bgColor: colors.successLight,
      };
    }
    if (isExpired) {
      return {
        text: "This match has expired",
        icon: "time" as const,
        color: colors.textMuted,
        bgColor: colors.borderLight,
      };
    }
    if (item.hoursUntilExpiration === undefined) return null;

    if (item.hoursUntilExpiration < 1) {
      return {
        text: "Expires very soon - say hello now!",
        icon: "alert-circle" as const,
        color: colors.danger,
        bgColor: colors.dangerLight,
      };
    } else if (item.hoursUntilExpiration < 6) {
      return {
        text: `Only ${Math.round(item.hoursUntilExpiration)} hours left!`,
        icon: "time" as const,
        color: colors.danger,
        bgColor: colors.dangerLight,
      };
    } else if (item.hoursUntilExpiration < 24) {
      return {
        text: `${Math.round(item.hoursUntilExpiration)} hours remaining`,
        icon: "time" as const,
        color: colors.warning,
        bgColor: colors.warningLight,
      };
    } else {
      const days = Math.floor(item.hoursUntilExpiration / 24);
      return {
        text: `${days} ${days === 1 ? "day" : "days"} to connect`,
        icon: "calendar" as const,
        color: colors.textSecondary,
        bgColor: colors.accentMint,
      };
    }
  };

  const expirationInfo = getExpirationInfo();

  return (
    <View style={[
      styles.cardContainer,
      isExpiringSoon && styles.cardContainerExpiring,
      isUrgent && styles.cardContainerUrgent,
      isExpired && styles.cardContainerExpired,
    ]}>
      {/* Main Card - Tappable to view profile */}
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => onPress(item.matchedUserId?.toString() || item.id)}
        onLongPress={onLongPress}
        delayLongPress={800}
        accessibilityLabel={`View ${item.name}'s profile`}
        accessibilityHint="Double tap to view their full profile"
      >
        {/* Top Section: Photo + Basic Info */}
        <View style={styles.topSection}>
          {/* Large Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
              resizeMode="cover"
            />
            {imageLoading && (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="small" color={colors.accentTeal} />
              </View>
            )}
            <View style={styles.heartBadge}>
              <MaterialCommunityIcons name="heart" size={18} color={colors.white} />
            </View>
          </View>

          {/* Info Section */}
          <View style={styles.infoContainer}>
            <AppText size="h3" weight="bold" style={styles.name} numberOfLines={1}>
              {item.name}
            </AppText>
            <AppText size="body" weight="semibold" color={colors.textSecondary}>
              {item.age} years old
            </AppText>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={colors.accentTeal} />
              <AppText size="body" color={colors.textSecondary} numberOfLines={1} style={styles.locationText}>
                {item.city || "Unknown location"}
              </AppText>
            </View>

            <View style={styles.matchDateRow}>
              <Ionicons name="heart-circle" size={18} color={colors.primary} />
              <AppText size="small" color={colors.textMuted}>
                Matched {item.matchedOn}
              </AppText>
            </View>
          </View>
        </View>

        {/* Status Banner */}
        {expirationInfo && (
          <View style={[styles.statusBanner, { backgroundColor: expirationInfo.bgColor }]}>
            <Ionicons name={expirationInfo.icon} size={22} color={expirationInfo.color} />
            <AppText size="body" weight="semibold" color={expirationInfo.color} style={styles.statusText}>
              {expirationInfo.text}
            </AppText>
          </View>
        )}

        {/* Tap hint for seniors */}
        <View style={styles.tapHint}>
          <Ionicons name="eye" size={16} color={colors.textMuted} />
          <AppText size="small" color={colors.textMuted}>
            Tap to view profile
          </AppText>
        </View>
      </TouchableOpacity>

      {/* Large Action Button - Easy to tap */}
      <TouchableOpacity
        style={[
          styles.actionButton,
          item.chatStarted && styles.actionButtonContinue,
          isExpired && styles.actionButtonDisabled,
        ]}
        activeOpacity={0.7}
        onPress={() => onActionPress(item)}
        disabled={isExpired}
        accessibilityLabel={item.chatStarted ? `Continue chatting with ${item.name}` : `Start chatting with ${item.name}`}
      >
        {isExpired ? (
          <>
            <Ionicons name="close-circle" size={28} color={colors.textMuted} />
            <AppText size="body" weight="bold" color={colors.textMuted}>
              Match Expired
            </AppText>
          </>
        ) : item.chatStarted ? (
          <LinearGradient
            colors={colors.gradients.brandStrong.array}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="chatbubbles" size={28} color={colors.white} />
            <AppText size="h4" weight="bold" color={colors.white}>
              Continue Chat
            </AppText>
          </LinearGradient>
        ) : (
          <LinearGradient
            colors={colors.gradients.brandStrong.array}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="chatbubble-ellipses" size={28} color={colors.white} />
            <AppText size="h4" weight="bold" color={colors.white}>
              Say Hello
            </AppText>
          </LinearGradient>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Container with border effects
  cardContainer: {
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
    overflow: "hidden",
  },
  cardContainerExpiring: {
    borderColor: colors.warning,
    borderWidth: 3,
  },
  cardContainerUrgent: {
    borderColor: colors.danger,
    borderWidth: 3,
  },
  cardContainerExpired: {
    opacity: 0.65,
    borderColor: colors.borderMedium,
    borderWidth: 2,
  },

  // Main card content
  card: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
  },

  // Top section with avatar and info
  topSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },

  // Avatar styles - LARGER for seniors
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
  },
  avatarLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
  },
  heartBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Info section
  infoContainer: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.textPrimary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    flex: 1,
  },
  matchDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },

  // Status banner - clear messaging
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  statusText: {
    flex: 1,
  },

  // Tap hint for seniors
  tapHint: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },

  // Large action button - EASY TO TAP
  actionButton: {
    minHeight: 64,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    backgroundColor: colors.borderLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 12,
    overflow: "hidden",
  },
  actionButtonContinue: {
    // Uses gradient inside
  },
  actionButtonDisabled: {
    backgroundColor: colors.borderLight,
  },
  actionButtonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
  },
});

