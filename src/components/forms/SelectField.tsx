// // import { Pressable, StyleSheet, Text, View } from "react-native";

// // interface SelectFieldProps {
// //   label: string;
// //   value?: string | null;
// //   placeholder?: string;
// //   onPress?: () => void;
// // }

// // export default function SelectField({
// //   label,
// //   value,
// //   placeholder,
// //   onPress,
// // }: SelectFieldProps) {
// //   return (
// //     <View style={{ marginBottom: 16 }}>
// //       <Text style={styles.label}>{label}</Text>

// //       <Pressable style={styles.box} onPress={onPress}>
// //         <Text style={{ color: value ? "#000" : "#999" }}>
// //           {value || placeholder}
// //         </Text>
// //       </Pressable>
// //     </View>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   label: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
// //   box: {
// //     backgroundColor: "#F4F4F4",
// //     padding: 14,
// //     borderRadius: 10,
// //   },
// // });

// import { Pressable, StyleSheet, Text, View } from "react-native";

// interface SelectFieldProps {
//   label: string;
//   value?: string | null;
//   placeholder?: string;
//   onPress?: () => void;

//   // NEW: Validation support
//   touched?: boolean;
//   error?: string;
// }

// export default function SelectField({
//   label,
//   value,
//   placeholder,
//   onPress,
//   touched,
//   error,
// }: SelectFieldProps) {
//   const isError = touched && !!error;

//   return (
//     <View style={{ marginBottom: 18 }}>
//       {/* Label */}
//       <Text style={styles.label}>{label}</Text>

//       {/* Select Box */}
//       <Pressable
//         style={[
//           styles.box,
//           isError && { borderColor: "#D9534F", borderWidth: 1.5 }, // red border
//         ]}
//         onPress={onPress}
//       >
//         <Text style={{ color: value ? "#000" : "#999" }}>
//           {value || placeholder}
//         </Text>
//       </Pressable>

//       {/* Error Text */}
//       {isError && <Text style={styles.errorText}>{error}</Text>}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   label: {
//     fontSize: 14,
//     fontWeight: "500",
//     marginBottom: 6,
//   },
//   box: {
//     backgroundColor: "#F4F4F4",
//     padding: 14,
//     borderRadius: 10,
//   },
//   errorText: {
//     marginTop: 6,
//     fontSize: 13,
//     color: "#D9534F",
//     fontWeight: "500",
//   },
// });

import React from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

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
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.label}>{label}</Text>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          style={[styles.box, showError && styles.errorBox]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
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
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },

  box: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    backgroundColor: "#F4F4F4",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,

    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },

    borderWidth: 1,
    borderColor: "#E5E5E5",
  },

  valueText: {
    fontSize: 15,
    color: "#111",
  },

  placeholder: {
    color: "#999",
  },

  icon: {
    width: 14,
    height: 14,
    tintColor: "#888",
  },

  errorBox: {
    borderColor: "#FF6B6B",
  },

  errorText: {
    color: "#FF4D4D",
    fontSize: 12,
    marginTop: 4,
  },
});
