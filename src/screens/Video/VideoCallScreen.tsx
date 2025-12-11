import React, { useEffect, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Platform, StyleSheet, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useCall } from "@/src/hooks/useCall";
import { useSocketConnection } from "@/src/hooks/useSocket";
import { CallType, IncomingCallPayload, CallEndedPayload, CallRejectedPayload } from "@/src/types/chat";

type ControlButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active?: boolean;
  onPress?: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export default function VideoCallScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "VideoCallScreen">) {
  const { userId, username, callType = "video", isIncoming, incomingCallData } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { isConnected } = useSocketConnection();
  const hasInitialized = useRef(false);

  // Initialize the call hook with incoming call data if this is an incoming call
  const {
    callStatus,
    localStream,
    remoteStream,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    callDuration,
    error,
    connectionQuality,
    isReconnecting,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
  } = useCall({
    initialIncomingCall: isIncoming && incomingCallData ? {
      roomId: incomingCallData.roomId,
      callId: incomingCallData.callId,
      callerId: incomingCallData.callerId,
      callerUsername: incomingCallData.callerUsername,
      callType: incomingCallData.callType as CallType,
    } : undefined,
    onCallEnded: (payload: CallEndedPayload) => {
      console.log('[VideoCallScreen] Call ended:', payload.reason);
      navigation.goBack();
    },
    onCallRejected: (payload: CallRejectedPayload) => {
      console.log('[VideoCallScreen] Call rejected:', payload.reason);
      if (payload.reason === 'busy') {
        Alert.alert('User Busy', 'The user is currently on another call.');
      }
      navigation.goBack();
    },
    onCallTimeout: () => {
      console.log('[VideoCallScreen] Call timed out');
      Alert.alert('No Answer', 'The call was not answered.');
      navigation.goBack();
    },
    onCallDisconnected: () => {
      console.log('[VideoCallScreen] Call disconnected');
      Alert.alert('Call Disconnected', 'The connection was lost.');
      navigation.goBack();
    },
  });

  // Start outgoing call when screen mounts (if not incoming)
  useEffect(() => {
    const initiateCall = async () => {
      if (!isIncoming && !hasInitialized.current && isConnected) {
        hasInitialized.current = true;
        console.log('[VideoCallScreen] Starting outgoing call to:', userId, 'type:', callType);

        try {
          const success = await startCall(userId, callType as CallType || 'video', username);
          if (!success) {
            console.log('[VideoCallScreen] Failed to start call, error:', error);
            // Give time for error state to update
            setTimeout(() => {
              Alert.alert('Call Failed', 'Could not start the call. Please try again.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            }, 100);
          }
        } catch (err) {
          console.error('[VideoCallScreen] Error starting call:', err);
          Alert.alert('Call Failed', 'An error occurred while starting the call.', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        }
      }
    };

    initiateCall();
  }, [isIncoming, isConnected, userId, callType, username, startCall, navigation]);

  // Handle accepting incoming call
  const handleAcceptCall = async () => {
    console.log('[VideoCallScreen] Accepting call');
    const success = await acceptCall();
    if (!success) {
      Alert.alert('Error', 'Failed to accept the call.');
      navigation.goBack();
    }
  };

  // Handle declining/ending call
  const handleEndCall = () => {
    if (callStatus === 'ringing' && isIncoming) {
      declineCall('rejected');
    } else {
      hangUp();
    }
    navigation.goBack();
  };

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status text
  const getStatusText = (): string => {
    if (isReconnecting) return 'Reconnecting...';
    switch (callStatus) {
      case 'idle': return 'Initializing...';
      case 'calling': return 'Calling...';
      case 'ringing': return isIncoming ? 'Incoming call' : 'Ringing...';
      case 'connecting': return 'Connecting...';
      case 'connected': return formatDuration(callDuration);
      case 'ended': return 'Call ended';
      case 'rejected': return 'Call declined';
      case 'missed': return 'Missed call';
      case 'busy': return 'User busy';
      default: return callStatus;
    }
  };

  // Get connection quality indicator
  const getQualityColor = (): string => {
    switch (connectionQuality) {
      case 'excellent': return colors.success;
      case 'good': return colors.success;
      case 'fair': return colors.warning;
      case 'poor': return colors.danger;
      default: return colors.textMuted;
    }
  };

  return (
    <FullScreen statusBarStyle="light" style={styles.screen}>
      {/* Remote Video (Full Screen) */}
      <View style={styles.remoteVideo}>
        {remoteStream ? (
          <RTCView
            streamURL={remoteStream.toURL()}
            style={styles.remoteRTCView}
            objectFit="cover"
            mirror={false}
          />
        ) : (
          <LinearGradient
            colors={[colors.accentBlue, colors.backgroundDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.remotePlaceholder}
          >
            <View style={styles.avatarShell}>
              <Ionicons name="person" size={40} color={colors.white} />
            </View>
            <AppText size="h3" weight="bold" color={colors.white} style={styles.placeholderTitle}>
              {callStatus === 'connected' ? 'Camera off' : 'Connecting...'}
            </AppText>
            <AppText size="small" color={colors.white} style={styles.placeholderSubtitle}>
              {username || `User ${userId}`}
            </AppText>
          </LinearGradient>
        )}
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        {/* Top Bar */}
        <SafeAreaView edges={["top", "left", "right"]} style={styles.topBar} pointerEvents="box-none">
          <View style={styles.callInfo}>
            <View style={styles.callHeader}>
              <AppText size="h4" weight="bold" color={colors.white}>
                {username || `User ${userId}`}
              </AppText>
              {callStatus === 'connected' && (
                <View style={[styles.qualityIndicator, { backgroundColor: getQualityColor() }]} />
              )}
            </View>
            <AppText size="small" weight="medium" color={colors.white} style={styles.callStatus}>
              {getStatusText()}
            </AppText>
            {error && (
              <AppText size="tiny" color={colors.danger} style={styles.errorText}>
                {error}
              </AppText>
            )}
          </View>
        </SafeAreaView>

        {/* Local Preview (Picture-in-Picture) */}
        <View style={styles.localPreviewContainer}>
          {localStream ? (
            <RTCView
              streamURL={localStream.toURL()}
              style={styles.localRTCView}
              objectFit="cover"
              mirror={true}
              zOrder={1}
            />
          ) : (
            <View style={styles.localVideo}>
              <View style={styles.localPlaceholder}>
                <Ionicons name="person-circle" size={34} color={colors.white} />
                <AppText size="tiny" color={colors.white}>
                  {callStatus === 'calling' || callStatus === 'ringing' ? 'Starting camera...' : 'Camera off'}
                </AppText>
              </View>
            </View>
          )}
          {/* Camera switch button */}
          {localStream && callType === 'video' && (
            <TouchableOpacity style={styles.switchCameraButton} onPress={switchCamera}>
              <Ionicons name="camera-reverse" size={20} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>

        {/* Bottom Controls */}
        <SafeAreaView edges={["bottom", "left", "right"]} style={styles.bottomSafeArea}>
          {/* Incoming call - show accept/decline */}
          {callStatus === 'ringing' && isIncoming ? (
            <View style={styles.incomingCallControls}>
              <TouchableOpacity
                style={[styles.callActionButton, styles.declineButton]}
                onPress={handleEndCall}
              >
                <Ionicons name="call" size={32} color={colors.white} style={{ transform: [{ rotate: '135deg' }] }} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.callActionButton, styles.acceptButton]}
                onPress={handleAcceptCall}
              >
                <Ionicons name="call" size={32} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.controlsPanel}>
              <ControlButton
                icon={isMuted ? "mic-off" : "mic"}
                label={isMuted ? "Unmute" : "Mute"}
                active={isMuted}
                onPress={toggleMute}
                disabled={callStatus !== 'connected' && callStatus !== 'connecting'}
              />
              <ControlButton
                icon={isCameraOn ? "videocam" : "videocam-off"}
                label={isCameraOn ? "Camera" : "Camera Off"}
                active={!isCameraOn}
                onPress={toggleCamera}
                disabled={callStatus !== 'connected' && callStatus !== 'connecting'}
              />
              <ControlButton
                icon={isSpeakerOn ? "volume-high" : "volume-mute"}
                label={isSpeakerOn ? "Speaker" : "Earpiece"}
                active={!isSpeakerOn}
                onPress={toggleSpeaker}
                disabled={callStatus !== 'connected' && callStatus !== 'connecting'}
              />
              <ControlButton
                icon="call"
                label="End"
                danger
                onPress={handleEndCall}
              />
            </View>
          )}
        </SafeAreaView>
      </View>
    </FullScreen>
  );
}

function ControlButton({ icon, label, active = false, onPress, danger = false, disabled = false }: ControlButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.controlButton,
        danger && styles.dangerButton,
        active && styles.activeButton,
        disabled && styles.disabledButton,
      ]}
    >
      <Ionicons name={icon} size={22} color={disabled ? colors.textMuted : colors.white} />
      <AppText
        size="tiny"
        weight="medium"
        color={disabled ? colors.textMuted : colors.white}
        style={styles.controlLabel}
      >
        {label}
      </AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.black,
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteRTCView: {
    flex: 1,
    backgroundColor: colors.black,
  },
  remotePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  avatarShell: {
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: colors.backgroundDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.shadowMedium,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  placeholderTitle: {
    textAlign: "center",
    marginBottom: 6,
  },
  placeholderSubtitle: {
    textAlign: "center",
    opacity: 0.85,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  callInfo: {
    alignItems: "flex-start",
    gap: 4,
  },
  callHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qualityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  callStatus: {
    opacity: 0.9,
  },
  errorText: {
    marginTop: 4,
  },
  localPreviewContainer: {
    position: "absolute",
    right: 20,
    top: 100,
    width: 120,
    height: 160,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.black,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  localRTCView: {
    flex: 1,
    backgroundColor: colors.black,
  },
  localVideo: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  localPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  switchCameraButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSafeArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  incomingCallControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingVertical: 20,
  },
  callActionButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  acceptButton: {
    backgroundColor: colors.success,
  },
  declineButton: {
    backgroundColor: colors.danger,
  },
  controlsPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.backgroundDark,
    borderRadius: 24,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
    opacity: Platform.OS === "ios" ? 0.92 : 0.94,
  },
  controlButton: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: colors.black,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  activeButton: {
    backgroundColor: colors.accentBlue,
    borderColor: colors.accentBlue,
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlLabel: {
    textAlign: "center",
    opacity: 0.9,
  },
});
