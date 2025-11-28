// src/components/common/AppTextInput.tsx

import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import colors from "../../config/colors";

interface Props extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string | null;
  containerStyle?: ViewStyle;
}

export default function AppTextInput({
  icon,
  error,
  containerStyle,
  secureTextEntry,
  ...otherProps
}: Props) {
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* INPUT WRAPPER */}
      <View
        style={[
          styles.inputWrapper,
          error && { borderColor: colors.danger, borderWidth: 1 },
        ]}
      >
        {/* LEFT ICON */}
        {icon && (
          <Ionicons
            name={icon}
            size={22}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
        )}

        {/* TEXT INPUT */}
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidePassword}
          {...otherProps}
        />

        {/* RIGHT PASSWORD TOGGLE */}
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setHidePassword(!hidePassword)}>
            <Ionicons
              name={hidePassword ? "eye-off-outline" : "eye-outline"}
              size={22}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* ERROR MESSAGE */}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 40,
    backgroundColor: colors.backgroundLight,
    borderWidth: 0,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },

  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: 4,
    marginLeft: 10,
  },
});
