import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from "react-native";
import colors from "../../config/colors";

interface OutlineButtonProps {
  title: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function OutlineButton({
  title,
  onPress,
  style,
}: OutlineButtonProps) {
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          borderColor: pressed ? colors.pressed.primary : colors.primary,
        },
        style,
      ]}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.text,
          { color: pressed ? colors.pressed.primary : colors.primary },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    paddingVertical: 14,
    borderWidth: 2,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "600",
  },
});
