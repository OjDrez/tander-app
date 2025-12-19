/**
 * Connection Quality Indicator Component
 * Displays visual bars indicating WebRTC connection quality
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import colors from '@/src/config/colors';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

interface ConnectionQualityIndicatorProps {
  quality: ConnectionQuality;
}

const getQualityBars = (quality: ConnectionQuality): number[] => {
  switch (quality) {
    case 'excellent':
      return [1, 1, 1, 1];
    case 'good':
      return [1, 1, 1, 0.3];
    case 'fair':
      return [1, 1, 0.3, 0.3];
    case 'poor':
      return [1, 0.3, 0.3, 0.3];
    default:
      return [0.3, 0.3, 0.3, 0.3];
  }
};

const getQualityColor = (quality: ConnectionQuality): string => {
  switch (quality) {
    case 'excellent':
    case 'good':
      return colors.success;
    case 'fair':
      return colors.warning;
    case 'poor':
      return colors.danger;
    default:
      return colors.textMuted;
  }
};

function ConnectionQualityIndicator({ quality }: ConnectionQualityIndicatorProps) {
  const bars = getQualityBars(quality);
  const barColor = getQualityColor(quality);

  return (
    <View
      style={styles.container}
      accessibilityLabel={`Connection quality: ${quality}`}
      accessibilityRole="text"
    >
      {bars.map((opacity, index) => (
        <View
          key={index}
          style={[
            styles.bar,
            {
              height: 8 + index * 4,
              backgroundColor: barColor,
              opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

export default memo(ConnectionQualityIndicator);
