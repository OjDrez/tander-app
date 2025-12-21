/**
 * Active Call Banner Component
 * Shows a floating banner when there's an active call
 * Allows users to tap to return to the call screen
 */
import React, { useEffect, useRef, useMemo } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppText from '@/src/components/inputs/AppText';
import colors from '@/src/config/colors';
import { useActiveCall } from '@/src/context/ActiveCallContext';
import { useMainStackNavigation } from '@/src/context/MainStackNavigationContext';

export default function ActiveCallBanner() {
  const {
    activeCall,
    callStatus,
    hasActiveCall,
    callDuration,
    setIsReturningToCall,
    peerConnection,
    clearActiveCall,
  } = useActiveCall();
  const insets = useSafeAreaInsets();

  // Animation for pulsing effect
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  // Determine if the call is truly returnable (has a valid connection or is still connecting)
  // The banner should NOT show if:
  // 1. Call status is ended/rejected/missed/idle
  // 2. There's no peer connection and we're not in calling/ringing state
  const isCallReturnable = useMemo(() => {
    if (!hasActiveCall || !activeCall) return false;

    // Terminal states - never show banner
    if (callStatus === 'ended' || callStatus === 'rejected' || callStatus === 'missed' || callStatus === 'idle') {
      return false;
    }

    // For calling/ringing states - show banner even without peer connection
    // (call is being established)
    if (callStatus === 'calling' || callStatus === 'ringing') {
      return true;
    }

    // For connecting/connected states - must have a valid peer connection
    if (callStatus === 'connecting' || callStatus === 'connected') {
      // Check if peer connection exists and is not closed
      if (!peerConnection) return false;

      // Check signaling state - if closed, call is over
      try {
        if (peerConnection.signalingState === 'closed') {
          return false;
        }
      } catch (e) {
        // If we can't read state, connection is likely dead
        return false;
      }

      return true;
    }

    // For busy state - don't show return banner
    if (callStatus === 'busy') {
      return false;
    }

    return false;
  }, [hasActiveCall, activeCall, callStatus, peerConnection]);

  // Auto-clear stale call state when call becomes non-returnable
  useEffect(() => {
    if (hasActiveCall && !isCallReturnable && callStatus !== 'idle') {
      // Give a brief moment for the state to settle before clearing
      const timeout = setTimeout(() => {
        console.log('[ActiveCallBanner] Clearing stale call state, status:', callStatus);
        clearActiveCall();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [hasActiveCall, isCallReturnable, callStatus, clearActiveCall]);

  // Slide in/out animation based on returnable state
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isCallReturnable ? 0 : -100,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [isCallReturnable, slideAnim]);

  // Pulsing animation when connected
  useEffect(() => {
    if (callStatus === 'connected' && isCallReturnable) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callStatus, isCallReturnable, pulseAnim]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the MainStack navigation from context
  const mainStackNavigation = useMainStackNavigation();

  const handleReturnToCall = () => {
    if (!activeCall || !isCallReturnable) return;

    // Set flag so CallScreen knows we're returning to an existing call
    setIsReturningToCall(true);

    // Navigate using the MainStack navigation context
    const screenName = activeCall.callType === 'video' ? 'VideoCallScreen' : 'VoiceCallScreen';
    const params = {
      userId: activeCall.userId,
      username: activeCall.username,
      callType: activeCall.callType,
      roomId: activeCall.roomId,
      callId: activeCall.callId,
      isIncoming: false, // We're returning to an existing call
      callerName: activeCall.callerName,
    };

    if (mainStackNavigation) {
      console.log('[ActiveCallBanner] Navigating to:', screenName, params);
      // @ts-ignore - navigation type knows about these screens
      mainStackNavigation.navigate(screenName, params);
    } else {
      console.warn('[ActiveCallBanner] MainStack navigation not available yet');
    }
  };

  // Don't render if call is not returnable
  if (!isCallReturnable || !activeCall) {
    return null;
  }

  const getStatusText = () => {
    switch (callStatus) {
      case 'connected':
        return formatDuration(callDuration);
      case 'connecting':
        return 'Connecting...';
      case 'calling':
        return 'Calling...';
      case 'ringing':
        return 'Ringing...';
      default:
        return 'Active Call';
    }
  };

  const getBannerColor = () => {
    switch (callStatus) {
      case 'connected':
        return colors.success;
      case 'connecting':
      case 'calling':
      case 'ringing':
        return colors.primary;
      default:
        return colors.accentBlue;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + (Platform.OS === 'ios' ? 0 : 10),
          transform: [
            { translateY: slideAnim },
            { scale: pulseAnim },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[styles.banner, { backgroundColor: getBannerColor() }]}
        onPress={handleReturnToCall}
        activeOpacity={0.9}
        accessibilityLabel={`Return to ${activeCall.callType} call with ${activeCall.username}`}
        accessibilityHint="Double tap to return to the active call"
        accessibilityRole="button"
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={activeCall.callType === 'video' ? 'videocam' : 'call'}
            size={20}
            color={colors.white}
          />
        </View>

        <View style={styles.textContainer}>
          <AppText size="small" weight="bold" color={colors.white} numberOfLines={1}>
            {activeCall.callerName || activeCall.username}
          </AppText>
          <AppText size="tiny" color="rgba(255,255,255,0.9)">
            {getStatusText()} • Tap to return
          </AppText>
        </View>

        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color={colors.white} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    elevation: 10,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  arrowContainer: {
    marginLeft: 8,
  },
});
