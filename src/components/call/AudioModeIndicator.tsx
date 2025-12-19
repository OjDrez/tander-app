/**
 * Audio Mode Indicator Component
 * Shows current audio output mode (speaker/earpiece)
 */
import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';

interface AudioModeIndicatorProps {
  isSpeakerOn: boolean;
  isNativeAvailable: boolean;
}

function AudioModeIndicator({ isSpeakerOn, isNativeAvailable }: AudioModeIndicatorProps) {
  return (
    <View style={styles.container} accessibilityRole="text">
      <Ionicons
        name={isSpeakerOn ? 'volume-high' : 'ear'}
        size={14}
        color={colors.white}
      />
      <AppText size="small" weight="medium" color={colors.white}>
        {isSpeakerOn ? 'Speaker' : 'Earpiece'}
        {!isNativeAvailable && ' (UI)'}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
  },
});

export default memo(AudioModeIndicator);
