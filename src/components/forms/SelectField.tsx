import React from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import colors from "../../config/colors";

interface SelectFieldProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  error?: string;
  touched?: boolean;
  onPress?: () => void;
}

export default function SelectField({
  label,
  value,
  placeholder,
  error,
  touched,
  onPress,
}: SelectFieldProps) {
  const showError = touched && error;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (showError) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [showError]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.helper}>Tap to select from options</Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[styles.box, showError && styles.errorBox]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`Select ${label}`}
          accessibilityHint="Opens selection menu"
        >
          <Text style={[styles.valueText, !value && styles.placeholder]}>
            {value || placeholder}
          </Text>

          <Image
            source={require("../../assets/icons/chevron-down.png")}
            style={styles.icon}
          />
        </Pressable>
      </Animated.View>

      {showError && (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: colors.textPrimary,
  },

  helper: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: "500",
  },

  box: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: colors.backgroundSecondary,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 14,
    minHeight: 60,

    shadowColor: colors.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },

    borderWidth: 2,
    borderColor: colors.borderMedium,
  },

  valueText: {
    fontSize: 18,
    color: colors.textPrimary,
    fontWeight: "600",
  },

  placeholder: {
    color: colors.placeholder,
    fontWeight: "500",
  },

  icon: {
    width: 18,
    height: 18,
    tintColor: colors.textSecondary,
  },

  errorBox: {
    borderColor: colors.errorBorder,
  },

  errorText: {
    color: colors.errorBorder,
    fontSize: 15,
    marginTop: 8,
    fontWeight: "600",
  },
});
