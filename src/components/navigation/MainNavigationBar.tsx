import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

export type MainNavigationTab = "Home" | "Inbox" | "Matches" | "Profile";

type MainNavigationBarProps = {
  activeTab?: MainNavigationTab;
  onTabPress?: (tab: MainNavigationTab) => void;
  style?: ViewStyle | ViewStyle[];
};

const TABS: { key: MainNavigationTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "Home", label: "Home", icon: "home" },
  { key: "Inbox", label: "Inbox", icon: "chatbox-ellipses" },
  { key: "Matches", label: "Matches", icon: "people" },
  { key: "Profile", label: "My Profile", icon: "person" },
];

export default function MainNavigationBar({
  activeTab,
  onTabPress,
  style,
}: MainNavigationBarProps) {
  return (
    <View style={[styles.container, style]}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={[styles.item, isActive && styles.itemActive]}
            onPress={() => onTabPress?.(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={20}
              color={isActive ? colors.primary : colors.textSecondary}
            />
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
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: colors.borderMedium,
  },
  item: {
    alignItems: "center",
    gap: 4,
  },
  itemActive: {
    transform: [{ translateY: -2 }],
  },
  label: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
