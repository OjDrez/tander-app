import colors from "@/src/config/colors";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Action = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color?: string;
  onPress?: () => void;
};

type DashboardActionsRowProps = {
  actions: Action[];
};

export default function DashboardActionsRow({ actions }: DashboardActionsRowProps) {
  return (
    <View style={styles.row}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.key}
          style={[styles.circle, action.color ? { backgroundColor: action.color } : null]}
          onPress={action.onPress}
          activeOpacity={0.88}
        >
          <Ionicons
            name={action.icon}
            size={20}
            color={action.color ? colors.white : colors.textPrimary}
          />
          <Text style={styles.label}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  circle: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: colors.white,
    fontWeight: "600",
  },
});
