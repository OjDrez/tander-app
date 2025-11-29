// import {
//   StyleSheet,
//   Text,
//   TextInput,
//   TextInputProps,
//   View,
// } from "react-native";

// interface TextInputFieldProps extends TextInputProps {
//   label: string;
//   error?: string | undefined;
// }

// export default function TextInputField({
//   label,
//   error,
//   ...props
// }: TextInputFieldProps) {
//   return (
//     <View style={{ marginBottom: 16 }}>
//       <Text style={styles.label}>{label}</Text>

//       <TextInput
//         style={[styles.input, error && styles.errorInput]}
//         placeholderTextColor="#999"
//         {...props}
//       />

//       {error && <Text style={styles.errorText}>{error}</Text>}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   label: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
//   input: {
//     backgroundColor: "#F4F4F4",
//     padding: 14,
//     borderRadius: 10,
//     fontSize: 15,
//   },
//   errorInput: { borderWidth: 1, borderColor: "red" },
//   errorText: { color: "red", marginTop: 3 },
// });

import React from "react";
import { Animated, StyleSheet, Text, TextInput, View } from "react-native";

interface TextInputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string | undefined;
  touched?: boolean;
  placeholder?: string;
  keyboardType?: string; // <-- ADD THIS
}

export default function TextInputField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  touched,
  placeholder,
}: TextInputFieldProps) {
  // Fade animation for error message
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (error && touched) {
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
  }, [error, touched]);

  const borderColor = touched && error ? "#D9534F" : "#E5E5E5"; // red if invalid

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputWrapper, { borderColor }]}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="#BDBDBD"
          onChangeText={onChangeText}
          onBlur={onBlur}
        />
      </View>

      {touched && error ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text style={styles.errorText}>{error}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 18,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 14,
    color: "#333",
  },
  inputWrapper: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  input: {
    fontSize: 16,
    color: "#333",
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    color: "#D9534F", // red
    fontWeight: "500",
  },
});
