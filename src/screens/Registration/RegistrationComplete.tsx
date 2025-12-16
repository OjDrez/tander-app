import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ConfettiCannon from "react-native-confetti-cannon";

import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";

export default function RegistrationComplete() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    // Start animations
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger confetti after a short delay
    setTimeout(() => {
      confettiRef.current?.start();
    }, 500);
  }, []);

  const handleGoToLogin = () => {
    NavigationService.reset("Auth", { screen: "LoginScreen" });
  };

  return (
    <FullScreen statusBarStyle="dark">
      <LinearGradient
        colors={["#C8E6E2", "#FFE2C1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.container}>
        {/* Success Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={64} color={colors.white} />
          </View>
        </Animated.View>

        {/* Title and Message */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.title}>Welcome to Tander!</Text>
          <Text style={styles.subtitle}>
            Your registration is complete.{"\n"}
            You're ready to connect with others.
          </Text>
        </Animated.View>

        {/* What's Next Card */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Text style={styles.cardTitle}>What's Next?</Text>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Log In</Text>
              <Text style={styles.stepDesc}>
                Use your username and password to sign in
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Discover People</Text>
              <Text style={styles.stepDesc}>
                Browse profiles and find connections
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Start Chatting</Text>
              <Text style={styles.stepDesc}>
                Message your matches and make friends
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Login Button */}
        <Animated.View
          style={[
            styles.buttonContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleGoToLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
            <Ionicons name="arrow-forward" size={22} color={colors.white} />
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Thank you for joining the Tander community!
          </Text>
        </Animated.View>

        {/* Confetti */}
        <ConfettiCannon
          ref={confettiRef}
          count={100}
          origin={{ x: -10, y: 0 }}
          fadeOut
          autoStart={false}
          fallSpeed={3000}
        />
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 24,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.success,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.success,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 26,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    width: "100%",
    marginBottom: 32,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: "center",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.white,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  loginButton: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    width: "100%",
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  loginButtonText: {
    fontSize: 19,
    fontWeight: "700",
    color: colors.white,
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
