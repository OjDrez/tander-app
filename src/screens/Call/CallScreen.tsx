/**
 * Shared Call Screen Component
 * Used for both voice and video calls
 * Features: Modern UI, animations, pulse effects, intuitive controls
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Vibration,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList, CallScreenParams } from "@/src/navigation/NavigationTypes";
import { useCall, ConnectionQuality } from "@/src/hooks/useCall";
import { CallStatus } from "@/src/types/chat";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Connection quality indicator component
const ConnectionQualityIndicator = ({ quality }: { quality: ConnectionQuality }) => {
  const getQualityBars = () => {
    switch (quality) {
      case "excellent":
        return [1, 1, 1, 1];
      case "good":
        return [1, 1, 1, 0.3];
      case "fair":
        return [1, 1, 0.3, 0.3];
      case "poor":
        return [1, 0.3, 0.3, 0.3];
      default:
        return [0.3, 0.3, 0.3, 0.3];
    }
  };

  const getQualityColor = () => {
    switch (quality) {
      case "excellent":
      case "good":
        return colors.success;
      case "fair":
        return colors.warning;
      case "poor":
        return colors.danger;
      default:
        return colors.textMuted;
    }
  };

  const bars = getQualityBars();
  const barColor = getQualityColor();

  return (
    <View style={qualityStyles.container} accessibilityLabel={`Connection quality: ${quality}`}>
      {bars.map((opacity, index) => (
        <View
          key={index}
          style={[
            qualityStyles.bar,
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
};

const qualityStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 8,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});

// ==================== ANIMATED PULSE RING ====================
function PulseRing({ delay = 0, color = colors.accentTeal }: { delay?: number; color?: string }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const animation = Animated.loop(
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
      ])
    );
    animation.start();
    return () => animation.stop();
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

// ==================== CONTROL BUTTON ====================
/**
 * ControlButton - Accessible call control button
 *
 * Accessibility Features:
 * - Minimum 64px touch target (exceeds 48px minimum)
 * - Large 80px buttons for important actions (accept/decline/end)
 * - Clear labels visible below buttons
 * - Screen reader support with accessibilityLabel and accessibilityHint
 * - Visual feedback on press
 */
type ControlButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label?: string;
  active?: boolean;
  onPress?: () => void;
  danger?: boolean;
  success?: boolean;
  disabled?: boolean;
  size?: "normal" | "large";
  accessibilityHint?: string;
};

function ControlButton({
  icon,
  label,
  active = false,
  onPress,
  danger = false,
  success = false,
  disabled = false,
  size = "normal",
  accessibilityHint,
}: ControlButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const isLarge = size === "large";
  // Larger touch targets for better accessibility
  const buttonSize = isLarge ? 80 : 64; // Increased from 72/56
  const iconSize = isLarge ? 36 : 28; // Increased from 28/22

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={label || icon}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled, selected: active }}
        activeOpacity={0.8}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.controlButton,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          danger && styles.dangerButton,
          success && styles.successButton,
          active && styles.activeButton,
          disabled && styles.disabledButton,
        ]}
      >
        <Ionicons name={icon} size={iconSize} color={colors.white} />
      </TouchableOpacity>
      {label && (
        <AppText
          size="small"
          weight="semibold"
          color="rgba(255,255,255,0.9)"
          style={styles.controlLabel}
        >
          {label}
        </AppText>
      )}
    </Animated.View>
  );
}

// ==================== UTILITIES ====================
const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const getStatusText = (status: CallStatus, isIncoming?: boolean): string => {
  switch (status) {
    case "idle":
      return "Initializing...";
    case "calling":
      return "Calling...";
    case "ringing":
      return isIncoming ? "Incoming call" : "Ringing...";
    case "connecting":
      return "Connecting...";
    case "connected":
      return "Connected";
    case "ended":
      return "Call ended";
    case "rejected":
      return "Call declined";
    case "missed":
      return "Missed call";
    case "busy":
      return "User is busy";
    default:
      return "...";
  }
};

const getStatusColor = (status: CallStatus): string => {
  switch (status) {
    case "connected":
      return colors.success;
    case "ended":
    case "rejected":
    case "missed":
      return colors.danger;
    case "calling":
    case "ringing":
    case "connecting":
      return colors.primary;
    default:
      return colors.textSecondary;
  }
};

// ==================== MAIN COMPONENT ====================
interface CallScreenProps {
  route: {
    params: CallScreenParams;
  };
  isVideoCall?: boolean;
}

export default function CallScreen({ route, isVideoCall = false }: CallScreenProps) {
  const {
    userId,
    username,
    callType,
    roomId: initialRoomId,
    callId: initialCallId,
    isIncoming,
    callerName,
  } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [hasStartedCall, setHasStartedCall] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const {
    callStatus,
    roomId,
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
    onCallEnded: (payload) => {
      console.log("[CallScreen] Call ended by:", payload.endedBy, "reason:", payload.reason, "duration:", payload.duration);
      Vibration.cancel();
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    },
    onCallRejected: (payload) => {
      console.log("[CallScreen] Call rejected by:", payload.rejectedBy, "reason:", payload.reason);
      Vibration.cancel();
      // Give user time to see "Call declined" message
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    },
    initialIncomingCall:
      isIncoming && initialRoomId && initialCallId
        ? {
            roomId: initialRoomId,
            callId: initialCallId,
            callerId: userId,
            callerUsername: username,
            callType,
          }
        : undefined,
  });

  // Entry animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  // Determine effective call type - use isVideoCall prop as fallback
  const effectiveCallType = callType || (isVideoCall ? "video" : "audio");

  // Start or handle incoming call
  useEffect(() => {
    if (hasStartedCall) return;

    if (isIncoming) {
      Vibration.vibrate([0, 500, 200, 500], true);
    } else {
      setHasStartedCall(true);
      console.log("[CallScreen] Starting call with type:", effectiveCallType);
      startCall(userId, effectiveCallType, callerName).catch(console.error);
    }

    return () => {
      Vibration.cancel();
    };
  }, [isIncoming, userId, effectiveCallType, callerName, startCall, hasStartedCall]);

  const handleAccept = useCallback(async () => {
    Vibration.cancel();
    setHasStartedCall(true);
    await acceptCall();
  }, [acceptCall]);

  const handleDecline = useCallback(() => {
    Vibration.cancel();
    declineCall("rejected");
    navigation.goBack();
  }, [declineCall, navigation]);

  const handleHangUp = useCallback(() => {
    hangUp("user_ended");
    navigation.goBack();
  }, [hangUp, navigation]);

  // Display logic (Messenger-like):
  // - Local camera: Show immediately when we have localStream (video calls only)
  // - Remote video: Show when we have remoteStream with tracks (video calls only)
  // - Audio calls: Just show avatar with connection status
  const isVideoMode = effectiveCallType === "video";
  const hasLocalVideo = isVideoMode && localStream;

  // Debug logging for video stream
  console.log("[CallScreen] isVideoMode:", isVideoMode, "hasLocalVideo:", hasLocalVideo, "localStream:", !!localStream);

  // Check if remote stream has actual tracks for more reliable connection detection
  const remoteHasTracks = remoteStream && remoteStream.getTracks().length > 0;
  const hasRemoteVideo = isVideoMode && remoteHasTracks;

  // Show incoming UI only when truly in ringing state
  const showIncomingUI = isIncoming && (callStatus === "ringing" || callStatus === "idle");

  // Show connected UI when we have remote tracks OR callStatus is connected
  // This works for both video AND audio calls
  const showConnectedUI = callStatus === "connected" || remoteHasTracks;

  // Show pulse animation when waiting for connection
  const showPulse = !showConnectedUI && (callStatus === "ringing" || callStatus === "calling" || callStatus === "connecting");

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=200`;
  const displayName = callerName || username;

  return (
    <FullScreen statusBarStyle="light" style={styles.screen}>
      {/* Background - Remote video (full screen) or gradient */}
      {hasRemoteVideo ? (
        <RTCView
          streamURL={remoteStream!.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        />
      )}

      {/* Dark overlay for video */}
      {hasRemoteVideo && <View style={styles.videoOverlay} />}

      {/* Content */}
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Top Section - User Info */}
        <SafeAreaView edges={["top"]} style={styles.topSection}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color={colors.white} />
          </TouchableOpacity>

          {/* Call type indicator */}
          <View style={styles.callTypeIndicator}>
            <Ionicons
              name={effectiveCallType === "video" ? "videocam" : "call"}
              size={16}
              color={colors.white}
            />
            <AppText size="small" weight="semibold" color={colors.white}>
              {effectiveCallType === "video" ? "Video Call" : "Voice Call"}
            </AppText>
          </View>

          {/* Switch camera button (video only - show when we have local video) */}
          {hasLocalVideo ? (
            <TouchableOpacity style={styles.switchCameraBtn} onPress={switchCamera}>
              <Ionicons name="camera-reverse" size={22} color={colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </SafeAreaView>

        {/* Center Section - Avatar & Status */}
        <View style={styles.centerSection}>
          {/* Pulse rings - show during calling/ringing/connecting when no remote video */}
          {showPulse && !hasRemoteVideo && (
            <View style={styles.pulseContainer}>
              <PulseRing delay={0} color={colors.accentTeal} />
              <PulseRing delay={600} color={colors.accentTeal} />
              <PulseRing delay={1200} color={colors.accentTeal} />
            </View>
          )}

          {/* Avatar - show when no remote video */}
          {!hasRemoteVideo && (
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            </View>
          )}

          {/* User name */}
          <AppText size="h2" weight="bold" color={colors.white} style={styles.userName}>
            {displayName}
          </AppText>

          {/* Status */}
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(callStatus) },
              ]}
            />
            <AppText size="body" color="rgba(255,255,255,0.8)" style={styles.statusText}>
              {isReconnecting
                ? "Reconnecting..."
                : showConnectedUI
                ? formatDuration(callDuration)
                : getStatusText(callStatus, isIncoming)}
            </AppText>
          </View>

          {/* Connection quality indicator - show when connected */}
          {showConnectedUI && (
            <View style={styles.qualityRow}>
              <ConnectionQualityIndicator quality={connectionQuality} />
              <AppText size="small" color="rgba(255,255,255,0.6)">
                {connectionQuality === "excellent" || connectionQuality === "good"
                  ? "Good connection"
                  : connectionQuality === "fair"
                  ? "Fair connection"
                  : connectionQuality === "poor"
                  ? "Poor connection"
                  : ""}
              </AppText>
            </View>
          )}

          {/* Error message */}
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="warning" size={16} color={colors.danger} />
              <AppText size="small" color={colors.danger} style={styles.errorText}>
                {error}
              </AppText>
            </View>
          )}
        </View>

        {/* Local video preview - Show immediately when we have local stream (Messenger-like) */}
        {hasLocalVideo && (
          <View style={styles.localPreviewContainer}>
            <RTCView
              streamURL={localStream!.toURL()}
              style={styles.localVideo}
              objectFit="cover"
              mirror={true}
            />
            {!isCameraOn && (
              <View style={styles.cameraOffOverlay}>
                <Ionicons name="videocam-off" size={24} color={colors.white} />
              </View>
            )}
          </View>
        )}

        {/* Bottom Section - Controls */}
        <SafeAreaView edges={["bottom"]} style={styles.bottomSection}>
          {showIncomingUI ? (
            // Incoming call controls - Large, clear buttons
            <View style={styles.incomingControls}>
              <ControlButton
                icon="close"
                label="Decline"
                danger
                size="large"
                onPress={handleDecline}
                accessibilityHint="Double tap to decline this call"
              />

              <ControlButton
                icon={effectiveCallType === "video" ? "videocam" : "call"}
                label="Accept"
                success
                size="large"
                onPress={handleAccept}
                accessibilityHint={`Double tap to accept this ${callType} call`}
              />
            </View>
          ) : (
            // Active call controls - Clear labels and large targets
            <View style={styles.activeControls}>
              <View style={styles.controlsRow}>
                <ControlButton
                  icon={isMuted ? "mic-off" : "mic"}
                  label={isMuted ? "Unmute" : "Mute"}
                  active={isMuted}
                  onPress={toggleMute}
                  accessibilityHint={isMuted ? "Double tap to unmute your microphone" : "Double tap to mute your microphone"}
                />

                {isVideoMode && (
                  <ControlButton
                    icon={isCameraOn ? "videocam" : "videocam-off"}
                    label={isCameraOn ? "Camera On" : "Camera Off"}
                    active={!isCameraOn}
                    onPress={toggleCamera}
                    accessibilityHint={isCameraOn ? "Double tap to turn off your camera" : "Double tap to turn on your camera"}
                  />
                )}

                <ControlButton
                  icon={isSpeakerOn ? "volume-high" : "volume-mute"}
                  label={isSpeakerOn ? "Speaker On" : "Speaker Off"}
                  active={!isSpeakerOn}
                  onPress={toggleSpeaker}
                  accessibilityHint={isSpeakerOn ? "Double tap to turn off speaker" : "Double tap to turn on speaker"}
                />
              </View>

              <View style={styles.endCallContainer}>
                <ControlButton
                  icon="call"
                  label="End Call"
                  danger
                  size="large"
                  onPress={handleHangUp}
                  accessibilityHint="Double tap to end this call"
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </Animated.View>
    </FullScreen>
  );
}

// ==================== STYLES ====================
/**
 * CallScreen Styles
 *
 * Accessibility Optimizations:
 * - Larger touch targets (64px minimum, 80px for critical buttons)
 * - High contrast text on dark backgrounds
 * - Clear visual feedback for button states
 * - Larger avatar and status indicators
 * - Increased spacing for easier navigation
 */
const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.black,
  },
  gradientBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  contentContainer: {
    flex: 1,
  },

  // Top Section
  topSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  backButton: {
    // Minimum 48px touch target
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  callTypeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  switchCameraBtn: {
    // Minimum 48px touch target
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Center Section
  centerSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  pulseContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 160, // Larger pulse for visibility
    height: 160,
    borderRadius: 80,
  },
  avatarContainer: {
    // Larger avatar for better visibility
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: "hidden",
    backgroundColor: colors.backgroundDark,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  userName: {
    marginTop: 28,
    textAlign: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  statusDot: {
    // Larger status dot for visibility
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    textAlign: "center",
  },
  qualityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    backgroundColor: "rgba(255,0,0,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
  },
  errorText: {
    flex: 1,
  },

  // Local Preview - Larger for better visibility
  localPreviewContainer: {
    position: "absolute",
    right: 20,
    top: 120,
    width: 130, // Larger preview
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.black,
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  localVideo: {
    flex: 1,
  },
  cameraOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bottom Section
  bottomSection: {
    paddingHorizontal: 28,
    paddingBottom: Platform.OS === "ios" ? 20 : 28,
  },
  incomingControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
    paddingVertical: 24,
  },
  activeControls: {
    alignItems: "center",
    gap: 28, // Increased spacing
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 40, // Increased spacing between buttons
  },
  endCallContainer: {
    marginTop: 12,
  },

  // Control Button - Larger for accessibility
  controlButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  activeButton: {
    backgroundColor: colors.accentBlue,
  },
  dangerButton: {
    backgroundColor: colors.danger,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  disabledButton: {
    opacity: 0.5,
  },
  controlLabel: {
    marginTop: 10, // Increased spacing
    textAlign: "center",
    minWidth: 80, // Ensure labels don't wrap awkwardly
  },
});
