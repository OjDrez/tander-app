import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type Person = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  hoursUntilExpiration?: number;
  chatStarted?: boolean;
};

type PeopleYouMayKnowRowProps = {
  people: Person[];
  onSelect: (userId: string) => void;
  onStartChat?: (userId: string) => void;
};

/**
 * SENIOR-FRIENDLY: Format hours in a clear, readable way
 */
const formatTimeRemaining = (hours?: number): string => {
  if (hours === undefined || hours < 0) return "";
  if (hours < 1) return "Less than 1 hour";
  if (hours < 2) return "1 hour left";
  if (hours < 24) return `${Math.floor(hours)} hours left`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day left" : `${days} days left`;
};

/**
 * Get urgency level for styling
 */
const getUrgencyLevel = (hours?: number): "critical" | "warning" | "normal" => {
  if (hours === undefined) return "normal";
  if (hours <= 3) return "critical";
  if (hours <= 6) return "warning";
  return "normal";
};

/**
 * SENIOR-FRIENDLY Match Card Component
 */
export default function PeopleYouMayKnowRow({
  people,
  onSelect,
  onStartChat,
}: PeopleYouMayKnowRowProps) {
  return (
    <View style={styles.container}>
      {/* Header - SENIOR-FRIENDLY: Clear explanation */}
      <View style={styles.headerRow}>
        <AppText size="h4" weight="bold" color={colors.textPrimary}>
          People Waiting to Chat
        </AppText>
      </View>
      <AppText size="body" color={colors.textSecondary} style={styles.subheader}>
        Tap on a person to start chatting with them
      </AppText>

      {/* Match cards - SENIOR-FRIENDLY: Large, easy to tap */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {people.map((person) => {
          const timeRemaining = formatTimeRemaining(person.hoursUntilExpiration);
          const urgencyLevel = getUrgencyLevel(person.hoursUntilExpiration);
          const isUrgent = urgencyLevel === "critical" || urgencyLevel === "warning";

          return (
            <TouchableOpacity
              key={person.id}
              style={[
                styles.item,
                urgencyLevel === "critical" && styles.itemCritical,
                urgencyLevel === "warning" && styles.itemWarning,
              ]}
              onPress={() => onStartChat ? onStartChat(person.id) : onSelect(person.id)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Chat with ${person.name}. ${timeRemaining || "Time available"}`}
              accessibilityHint="Tap to start a conversation"
            >
              {/* Large avatar */}
              <View style={styles.avatarContainer}>
                <Image source={{ uri: person.avatar }} style={styles.avatar} />
                {/* Chat started indicator */}
                {person.chatStarted && (
                  <View style={styles.chatStartedBadge}>
                    <Ionicons name="chatbubble" size={16} color={colors.white} />
                  </View>
                )}
              </View>

              {/* Name - Large and clear */}
              <AppText size="body" weight="bold" color={colors.textPrimary} numberOfLines={1} style={styles.name}>
                {person.name}
              </AppText>

              {/* Time remaining - SENIOR-FRIENDLY: Clear text, not just numbers */}
              {!person.chatStarted && timeRemaining && (
                <View style={[
                  styles.timeContainer,
                  urgencyLevel === "critical" && styles.timeCritical,
                  urgencyLevel === "warning" && styles.timeWarning,
                ]}>
                  <Ionicons
                    name="time"
                    size={16}
                    color={urgencyLevel === "critical" ? colors.error : urgencyLevel === "warning" ? colors.warning : colors.textSecondary}
                  />
                  <AppText
                    size="small"
                    weight="semibold"
                    color={urgencyLevel === "critical" ? colors.error : urgencyLevel === "warning" ? colors.warning : colors.textSecondary}
                  >
                    {timeRemaining}
                  </AppText>
                </View>
              )}

              {/* Already chatting indicator */}
              {person.chatStarted && (
                <View style={styles.chattingBadge}>
                  <AppText size="small" weight="semibold" color={colors.success}>
                    Already chatting
                  </AppText>
                </View>
              )}

              {/* Call to action - SENIOR-FRIENDLY: Clear button */}
              {!person.chatStarted && (
                <View style={[
                  styles.chatButton,
                  isUrgent && styles.chatButtonUrgent,
                ]}>
                  <AppText
                    size="small"
                    weight="bold"
                    color={isUrgent ? colors.white : colors.accentTeal}
                  >
                    Tap to Chat
                  </AppText>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * PeopleYouMayKnowRow Styles - SENIOR-FRIENDLY VERSION
 *
 * Design Principles for Elderly Users:
 * - Very large avatars (100px) for clear identification
 * - Large touch targets (minimum 120px width)
 * - Clear, readable text (not tiny)
 * - Full text labels instead of abbreviations
 * - High contrast urgency indicators
 * - Clear call-to-action buttons
 */
const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    gap: 12,
  },

  // Header section
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  subheader: {
    lineHeight: 22,
    marginBottom: 8,
  },

  // Match cards row
  row: {
    gap: 16,
    paddingRight: 16,
    paddingVertical: 8,
  },

  // Individual match card - SENIOR-FRIENDLY: Large, easy to tap
  item: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.backgroundLight,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    minWidth: 140,
  },
  itemWarning: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warning,
  },
  itemCritical: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
  },

  // Avatar - SENIOR-FRIENDLY: Much larger
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    height: 100,
    width: 100,
    borderRadius: 50,
    backgroundColor: colors.borderMedium,
    borderWidth: 3,
    borderColor: colors.white,
  },
  chatStartedBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.white,
  },

  // Name - SENIOR-FRIENDLY: Larger, readable
  name: {
    maxWidth: 120,
    textAlign: "center",
    fontSize: 17,
  },

  // Time remaining - SENIOR-FRIENDLY: Clear text instead of abbreviations
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.backgroundLight,
  },
  timeWarning: {
    backgroundColor: colors.warningLight,
  },
  timeCritical: {
    backgroundColor: colors.errorLight,
  },

  // Already chatting badge
  chattingBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.successLight,
  },

  // Call to action button - SENIOR-FRIENDLY: Clear, tappable
  chatButton: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.accentMint,
    borderWidth: 2,
    borderColor: colors.accentTeal,
  },
  chatButtonUrgent: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
});
