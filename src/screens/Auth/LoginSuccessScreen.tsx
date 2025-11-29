import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import React, { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

export default function LoginSuccessScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Animate check icon
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto redirect
    const timer = setTimeout(() => {
      NavigationService.replace("HomeScreen", {
        screen: "HomeScreen",
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <FullScreen statusBarStyle="light">
      <View style={styles.container}>
        {/* Animated Circle with Checkmark */}
        <Animated.View
          style={[
            styles.circleWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../../assets/icons/check.png")}
            style={styles.checkIcon}
          />
        </Animated.View>

        {/* Success Text */}
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          Login Successful!
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: fadeAnim }]}>
          You are now logged in.
        </Animated.Text>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.accentTeal,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },

  circleWrapper: {
    width: 160,
    height: 160,
    borderRadius: 200,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",

    // green glow effect
    shadowColor: "#00ff99",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },

  checkIcon: {
    width: 80,
    height: 80,
    tintColor: "#35C759",
  },

  title: {
    color: "white",
    fontSize: 24,
    fontWeight: "700",
    marginTop: 24,
  },

  subtitle: {
    color: "white",
    fontSize: 16,
    marginTop: 6,
  },
});
