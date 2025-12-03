import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

export type MainNavigationTab =
  | "Home"
  | "Inbox"
  | "Matches"
  | "ViewMe"
  | "Profile";

type MainNavigationBarProps = {
  activeTab?: MainNavigationTab;
  onTabPress?: (tab: MainNavigationTab) => void;
  style?: ViewStyle | ViewStyle[];
  matchesBadgeCount?: number;
};

const TABS: { key: MainNavigationTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "Home", label: "Home", icon: "home" },
  { key: "Inbox", label: "Inbox", icon: "chatbox-ellipses" },
  { key: "Matches", label: "Matches", icon: "heart" },
  { key: "ViewMe", label: "View Me", icon: "eye" },
  { key: "Profile", label: "My Profile", icon: "person" },
];

export default function MainNavigationBar({
  activeTab,
  onTabPress,
  style,
  matchesBadgeCount = 0,
}: MainNavigationBarProps) {
  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        const showBadge = tab.key === "Matches" && matchesBadgeCount > 0;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => onTabPress?.(tab.key)}
          >
            <View style={styles.iconWrapper}>
              <Ionicons
                name={tab.icon}
                size={20}
                color={isActive ? colors.primary : colors.textSecondary}
              />

              {showBadge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{matchesBadgeCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderMedium,
  },
  item: {
    alignItems: "center",
    gap: 6,
    justifyContent: "flex-end",
  },
  itemActive: {
    transform: [{ translateY: -2 }],
  },
  iconWrapper: {
    position: "relative",
    paddingHorizontal: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
  },
});
