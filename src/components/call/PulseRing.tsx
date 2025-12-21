/**
 * Pulse Ring Animation Component
 * Animated pulsing ring effect for call initiation states
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Easing } from 'react-native';
import colors from '@/src/config/colors';

interface PulseRingProps {
  delay?: number;
  color?: string;
}

function PulseRing({ delay = 0, color = colors.accentTeal }: PulseRingProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    // Reset animation values before starting
    scaleAnim.setValue(1);
    opacityAnim.setValue(0.6);

    animationRef.current = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 2.5,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        // Reset values instantly for loop
        Animated.parallel([
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    animationRef.current.start();

    return () => {
      // Properly stop and reset animation on unmount
      if (animationRef.current) {
        animationRef.current.stop();
        animationRef.current = null;
      }
      // Reset to initial values
      scaleAnim.setValue(1);
      opacityAnim.setValue(0.6);
    };
  }, [delay, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
  },
});

export default memo(PulseRing);
