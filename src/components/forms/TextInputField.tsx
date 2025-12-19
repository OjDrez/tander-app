import React from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import colors from "../../config/colors";

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  touched?: boolean;
  placeholder?: string;
  keyboardType?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
}

export default function TextInputField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  placeholder = `Enter your ${label.toLowerCase()}`,
  keyboardType,
  autoCapitalize = "sentences",
  autoCorrect = true,
  maxLength,
  multiline = false,
  numberOfLines = 1,
}: TextInputFieldProps) {
  const [isFocused, setIsFocused] = React.useState(false);

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: error && touched ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [error, touched]);

  const handleFocus = () => {
    setIsFocused(true);
    Animated.spring(scaleAnim, {
      toValue: 1.01,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
  };

  const handleBlur = () => {
    setIsFocused(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 3,
    }).start();
    onBlur?.();
  };

  const getBorderColor = () => {
    if (touched && error) return colors.errorBorder;
    if (isFocused) return colors.accentTeal;
    return colors.borderMedium;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <Animated.View
        style={[
          styles.inputWrapper,
          {
            borderColor: getBorderColor(),
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            multiline && styles.multilineInput,
            Platform.OS === "android" && styles.androidAdjust,
          ]}
          value={value}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          keyboardType={keyboardType as any}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          multiline={multiline}
          numberOfLines={numberOfLines}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </Animated.View>

      {touched && error && (
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
    fontWeight: "700",
    marginBottom: 8,
    fontSize: 16,
    color: colors.textPrimary,
  },

  inputWrapper: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "android" ? 10 : 18,
    minHeight: 60,
  },

  input: {
    fontSize: Platform.OS === "android" ? 17 : 18,
    color: colors.textPrimary,
    padding: 0,
    fontWeight: "600",
  },

  androidAdjust: {
    paddingVertical: 2,
    includeFontPadding: false,
  },

  multilineInput: {
    minHeight: 100,
    paddingTop: 10,
  },

  errorText: {
    marginTop: 8,
    fontSize: 15,
    color: colors.errorBorder,
    fontWeight: "600",
  },
});
