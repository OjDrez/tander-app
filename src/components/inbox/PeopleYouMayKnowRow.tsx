import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
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
 * Format hours remaining into a human-readable countdown
 */
const formatTimeRemaining = (hours?: number): string => {
  if (hours === undefined || hours < 0) return "";
  if (hours < 1) return "<1h";
  if (hours < 24) return `${Math.floor(hours)}h`;
  return `${Math.floor(hours / 24)}d`;
};

/**
 * Get countdown badge color based on urgency
 */
const getCountdownColor = (hours?: number): string => {
  if (hours === undefined) return colors.primary;
  if (hours <= 3) return colors.error; // Critical - red
  if (hours <= 6) return colors.warning; // Warning - orange
  if (hours <= 12) return colors.accentTeal; // Moderate - teal
  return colors.primary; // Safe - primary
};

export default function PeopleYouMayKnowRow({
  people,
  onSelect,
  onStartChat,
}: PeopleYouMayKnowRowProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Your Matches</Text>
        <View style={styles.headerRight}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.expiryHint}>24h to chat</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {people.map((person) => {
          const timeRemaining = formatTimeRemaining(person.hoursUntilExpiration);
          const countdownColor = getCountdownColor(person.hoursUntilExpiration);
          const isUrgent = (person.hoursUntilExpiration ?? 24) <= 6;

          return (
            <TouchableOpacity
              key={person.id}
              style={[styles.item, isUrgent && styles.itemUrgent]}
              onPress={() => onStartChat ? onStartChat(person.id) : onSelect(person.id)}
              activeOpacity={0.9}
              accessibilityLabel={`Match with ${person.name}, ${timeRemaining} remaining to start chat`}
            >
              <View style={styles.avatarContainer}>
                <Image source={{ uri: person.avatar }} style={styles.avatar} />
                {/* Countdown badge - Bumble style */}
                {timeRemaining && !person.chatStarted && (
                  <View style={[styles.countdownBadge, { backgroundColor: countdownColor }]}>
                    <Ionicons name="time" size={10} color={colors.white} />
                    <Text style={styles.countdownText}>{timeRemaining}</Text>
                  </View>
                )}
                {/* Chat started badge */}
                {person.chatStarted && (
                  <View style={[styles.countdownBadge, { backgroundColor: colors.success }]}>
                    <Ionicons name="chatbubble" size={10} color={colors.white} />
                  </View>
                )}
              </View>
              <Text style={styles.name} numberOfLines={1}>{person.name}</Text>
              {!person.chatStarted && (
                <Text style={[styles.tapToChat, isUrgent && { color: countdownColor }]}>
                  Tap to chat
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  expiryHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  row: {
    gap: 14,
    paddingRight: 8,
  },
  item: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  itemUrgent: {
    backgroundColor: "rgba(255, 59, 48, 0.08)",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    height: 66,
    width: 66,
    borderRadius: 33,
    backgroundColor: colors.borderMedium,
  },
  countdownBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    minWidth: 32,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 2,
    borderColor: colors.white,
  },
  countdownText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.white,
  },
  name: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textPrimary,
    maxWidth: 70,
    textAlign: "center",
  },
  tapToChat: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.primary,
  },
});
