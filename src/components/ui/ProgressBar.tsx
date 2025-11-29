import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

interface ProgressBarProps {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: ProgressBarProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: step / total,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [step]);

  return (
    <View style={styles.track}>
      <Animated.View
        style={[
          styles.bar,
          {
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    backgroundColor: "#ddd",
    borderRadius: 20,
    width: "100%",
    marginBottom: 20,
  },
  bar: {
    height: 6,
    backgroundColor: "#222",
    borderRadius: 20,
  },
});
