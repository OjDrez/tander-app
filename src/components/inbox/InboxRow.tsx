import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type InboxRowProps = {
  id: string;
  name: string;
  message: string;
  timestamp: string;
  avatar: string;
  isFavorite?: boolean;
  onPress: (userId: string) => void;
  onToggleFavorite?: (userId: string) => void;
  onPressAvatar?: (userId: string) => void;
};

export default function InboxRow({
  id,
  name,
  message,
  timestamp,
  avatar,
  isFavorite,
  onPress,
  onToggleFavorite,
  onPressAvatar,
}: InboxRowProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => onPress(id)}
    >
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={() => onPressAvatar?.(id)}
        activeOpacity={0.9}
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </TouchableOpacity>

      <View style={styles.meta}>
        <View style={styles.titleRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.time}>{timestamp}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={2}>
          {message}
        </Text>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => onToggleFavorite?.(id)}
        activeOpacity={0.85}
        style={styles.favoriteButton}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={18}
          color={isFavorite ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    gap: 12,
  },
  avatarWrapper: {
    height: 52,
    width: 52,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: colors.borderMedium,
  },
  avatar: {
    height: 52,
    width: 52,
    borderRadius: 26,
  },
  meta: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  preview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  favoriteButton: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundLight,
  },
});
