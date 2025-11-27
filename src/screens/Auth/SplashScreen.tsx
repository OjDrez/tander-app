// import { LinearGradient } from "expo-linear-gradient";
// import LottieView from "lottie-react-native";
// import React, { useEffect, useRef } from "react";
// import {
//   Animated,
//   Easing,
//   Platform,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import FullScreen from "../../components/layout/FullScreen";
// import NavigationService from "../../navigation/NavigationService";

// export default function SplashScreen() {
//   const opacity = useRef(new Animated.Value(0)).current;
//   const scale = useRef(new Animated.Value(0.8)).current;
//   const fadeOut = useRef(new Animated.Value(1)).current;

//   useEffect(() => {
//     // LOGO + TEXT ENTRANCE ANIMATION
//     Animated.sequence([
//       Animated.parallel([
//         Animated.timing(opacity, {
//           toValue: 1,
//           duration: 900,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scale, {
//           toValue: 1.1,
//           duration: 900,
//           easing: Easing.out(Easing.quad),
//           useNativeDriver: true,
//         }),
//       ]),

//       // Heartbeat effect
//       Animated.sequence([
//         Animated.timing(scale, {
//           toValue: 1,
//           duration: 300,
//           easing: Easing.out(Easing.cubic),
//           useNativeDriver: true,
//         }),
//         Animated.timing(scale, {
//           toValue: 1.05,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//         Animated.timing(scale, {
//           toValue: 1,
//           duration: 250,
//           useNativeDriver: true,
//         }),
//       ]),

//       Animated.delay(3000),

//       // Fade-out transition
//       Animated.timing(fadeOut, {
//         toValue: 0,
//         duration: 700,
//         useNativeDriver: true,
//       }),
//     ]).start(() => {
//       NavigationService.replace("WelcomeScreen");
//     });
//   }, []);

//   return (
//     <FullScreen statusBarStyle="light">
//       <Animated.View style={[styles.animatedContainer, { opacity: fadeOut }]}>
//         {/* BACKGROUND GRADIENT */}
//         <LinearGradient
//           colors={["#C8E6E2", "#FFE2C1"]}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.background}
//         />

//         <View style={styles.container}>
//           {/* LOGO */}
//           <Animated.Image
//             source={require("../../assets/icons/tander-logo.png")}
//             style={[
//               styles.logo,
//               {
//                 opacity,
//                 transform: [{ scale }],
//               },
//             ]}
//             resizeMode="contain"
//           />

//           {/* BRAND NAME */}
//           <Animated.Text
//             style={[
//               styles.title,
//               {
//                 opacity,
//               },
//             ]}
//           >
//             Tander
//           </Animated.Text>

//           {/* LOTTIE LOADER */}
//           <LottieView
//             source={require("../../assets/animations/loader.json")}
//             autoPlay
//             loop
//             style={styles.loader}
//           />

//           {/* VERSION TEXT */}
//           <Text style={styles.version}>v1.0.0</Text>
//           <Text style={styles.rights}>All rights reserved.</Text>
//         </View>
//       </Animated.View>
//     </FullScreen>
//   );
// }

// const styles = StyleSheet.create({
//   animatedContainer: {
//     flex: 1,
//   },

//   background: {
//     ...StyleSheet.absoluteFillObject,
//   },

//   container: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     paddingHorizontal: 24,
//   },

//   logo: {
//     width: 200,
//     height: 200,
//   },

//   title: {
//     marginTop: 12,
//     fontSize: 34,
//     fontWeight: "700",
//     color: "#000",
//     letterSpacing: 0.5,
//   },

//   loader: {
//     width: 120,
//     height: 120,
//     marginTop: 20,
//   },

//   version: {
//     position: "absolute",
//     bottom: Platform.OS === "ios" ? 70 : 60,
//     fontSize: 14,
//     color: "#333",
//     opacity: 0.8,
//   },

//   rights: {
//     position: "absolute",
//     bottom: Platform.OS === "ios" ? 50 : 40,
//     fontSize: 13,
//     color: "#333",
//     opacity: 0.8,
//   },
// });

import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import FullScreen from "../../components/layout/FullScreen";
import NavigationService from "../../navigation/NavigationService";

// Allow animation on LinearGradient
const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export default function SplashScreen() {
  /* --------------------------- Animated Values --------------------------- */
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  // Gradient movement
  const gradientAnim = useRef(new Animated.Value(0)).current;

  /* --------------------------- Entrance + Exit --------------------------- */
  useEffect(() => {
    // Animate logo entrance + heartbeat
    Animated.sequence([
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // heartbeat
      Animated.sequence([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1.05,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),

      Animated.delay(2500),

      // Fade-out whole screen
      Animated.timing(fadeOut, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start(() => {
      NavigationService.replace("WelcomeScreen");
    });

    /* -------------------- Looping gradient animation -------------------- */
    Animated.loop(
      Animated.sequence([
        Animated.timing(gradientAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(gradientAnim, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  /* ---------------- Gradient interpolated locations ---------------- */
  const loc1 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.25],
  });

  const loc2 = gradientAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  return (
    <FullScreen statusBarStyle="light">
      <Animated.View style={[styles.wrapper, { opacity: fadeOut }]}>
        {/* -------------------- Animated Background Gradient -------------------- */}
        <AnimatedGradient
          colors={["#C8E6E2", "#FFE2C1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[loc1, loc2]}
          style={StyleSheet.absoluteFill}
        />

        {/* ----------------------------- Content ----------------------------- */}
        <View style={styles.container}>
          {/* Logo */}
          <Animated.Image
            source={require("../../assets/icons/tander-logo.png")}
            style={[
              styles.logo,
              { opacity: logoOpacity, transform: [{ scale: logoScale }] },
            ]}
            resizeMode="contain"
          />

          {/* Brand Text */}
          <Animated.Text style={[styles.title, { opacity: logoOpacity }]}>
            Tander
          </Animated.Text>

          {/* Loader */}
          <LottieView
            source={require("../../assets/animations/loader.json")}
            autoPlay
            loop
            style={styles.loader}
          />

          {/* Version Text */}
          <Text style={styles.version}>v1.0.0</Text>
          <Text style={styles.rights}>All rights reserved.</Text>
        </View>
      </Animated.View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  logo: {
    width: 200,
    height: 200,
  },

  title: {
    marginTop: 12,
    fontSize: 34,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.5,
  },

  loader: {
    width: 120,
    height: 120,
    marginTop: 20,
  },

  version: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 70 : 60,
    fontSize: 14,
    color: "#333",
    opacity: 0.8,
  },

  rights: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 40,
    fontSize: 13,
    color: "#333",
    opacity: 0.8,
  },
});
