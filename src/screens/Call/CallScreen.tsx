/**
 * Shared Call Screen Component
 * Used for both voice and video calls
 * Features: Modern UI, animations, pulse effects, intuitive controls
 */
import React, { useCallback, useEffect, useRef, useState, Component, ErrorInfo, ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Animated,
  BackHandler,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Image,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RTCView } from "react-native-webrtc";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList, CallScreenParams } from "@/src/navigation/NavigationTypes";
import { useCall } from "@/src/hooks/useCall";
import { CallStatus } from "@/src/types/chat";
import { isNativeAudioAvailable } from "@/src/utility/audioManager";
import { useActiveCall } from "@/src/context/ActiveCallContext";
import { callLogger as logger } from "@/src/utility/logger";
import { useCallNetworkMonitor, NetworkQuality } from "@/src/hooks/useNetworkStatus";
import { playHapticFeedback, stopCallSound } from "@/src/utility/callSounds";
// Use extracted, memoized components
import {
  ConnectionQualityIndicator,
  AudioModeIndicator,
  PulseRing,
  ControlButton,
} from "@/src/components/call";

// ==================== ERROR BOUNDARY ====================
interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CallScreenErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[CallScreen] Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <FullScreen statusBarStyle="light" style={errorBoundaryStyles.screen}>
          <LinearGradient
            colors={["#1a1a2e", "#16213e", "#0f3460"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={errorBoundaryStyles.gradient}
          />
          <View style={errorBoundaryStyles.content}>
            <Ionicons name="warning" size={64} color={colors.danger} />
            <AppText size="h3" weight="bold" color={colors.white} style={errorBoundaryStyles.title}>
              Call Error
            </AppText>
            <AppText size="body" color="rgba(255,255,255,0.7)" style={errorBoundaryStyles.message}>
              Something went wrong with the call. Please try again.
            </AppText>
            <AppText size="small" color="rgba(255,255,255,0.5)" style={errorBoundaryStyles.errorDetail}>
              {this.state.error?.message || 'Unknown error'}
            </AppText>
          </View>
        </FullScreen>
      );
    }

    return this.props.children;
  }
}

const errorBoundaryStyles = StyleSheet.create({
  screen: { backgroundColor: colors.black },
  gradient: { ...StyleSheet.absoluteFillObject },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  title: { marginTop: 20, textAlign: 'center' },
  message: { marginTop: 12, textAlign: 'center' },
  errorDetail: { marginTop: 8, textAlign: 'center' },
});


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

function CallScreenContent({ route, isVideoCall = false }: CallScreenProps) {
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

  // Get global call state from context
  const activeCallContext = useActiveCall();
  const {
    isReturningToCall,
    setIsReturningToCall,
    // Get persisted state when returning to call
    localStream: contextLocalStream,
    remoteStream: contextRemoteStream,
    callStatus: contextCallStatus,
    isMuted: contextIsMuted,
    isCameraOn: contextIsCameraOn,
    isSpeakerOn: contextIsSpeakerOn,
    callDuration: contextCallDuration,
    peerConnection: contextPeerConnection,
  } = activeCallContext;

  const [hasStartedCall, setHasStartedCall] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Use the hook for call management
  const callHook = useCall({
    onCallEnded: (payload) => {
      logger.debug("Call ended by:", payload.endedBy, "reason:", payload.reason, "duration:", payload.duration);
      Vibration.cancel();
      activeCallContext.clearActiveCall();
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    },
    onCallRejected: (payload) => {
      logger.debug("Call rejected by:", payload.rejectedBy, "reason:", payload.reason);
      Vibration.cancel();
      activeCallContext.clearActiveCall();
      // Give user time to see "Call declined" message
      setTimeout(() => {
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      }, 1500);
    },
    initialIncomingCall:
      isIncoming && initialRoomId && initialCallId && callType
        ? {
            roomId: initialRoomId,
            callId: initialCallId,
            callerId: userId,
            callerUsername: username,
            callType: callType,
          }
        : undefined,
    // Pass context state for syncing
    activeCallContext,
  });

  // When returning to an existing call, use the persisted context state
  // Otherwise use the hook's state
  const isReturning = isReturningToCall && contextPeerConnection !== null;

  const callStatus = isReturning ? contextCallStatus : callHook.callStatus;
  const roomId = isReturning ? activeCallContext.activeCall?.roomId : callHook.roomId;
  const localStream = isReturning ? contextLocalStream : callHook.localStream;
  const remoteStream = isReturning ? contextRemoteStream : callHook.remoteStream;
  const isMuted = isReturning ? contextIsMuted : callHook.isMuted;
  const isCameraOn = isReturning ? contextIsCameraOn : callHook.isCameraOn;
  const isSpeakerOn = isReturning ? contextIsSpeakerOn : callHook.isSpeakerOn;
  const callDuration = isReturning ? contextCallDuration : callHook.callDuration;

  // Note: Stream URLs are generated directly in RTCView render
  // to avoid timing issues with memoization

  // These always come from hook
  const {
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
  } = callHook;

  // Network status tracking during call
  const [networkWarning, setNetworkWarning] = useState<string | null>(null);

  // Monitor network during active call
  useCallNetworkMonitor({
    isActive: callStatus === 'connected' || callStatus === 'connecting',
    onNetworkLost: () => {
      logger.debug('[CallScreen] Network lost during call');
      setNetworkWarning('Network connection lost. Attempting to reconnect...');
      playHapticFeedback('warning');
    },
    onNetworkRestored: () => {
      logger.debug('[CallScreen] Network restored');
      setNetworkWarning(null);
      playHapticFeedback('success');
    },
    onQualityChange: (quality: NetworkQuality) => {
      if (quality === 'poor') {
        setNetworkWarning('Poor network connection. Call quality may be affected.');
      } else if (quality === 'offline') {
        setNetworkWarning('No network connection.');
      } else {
        setNetworkWarning(null);
      }
    },
  });

  // Clear the returning flag once we've rendered
  useEffect(() => {
    if (isReturningToCall) {
      // Small delay to ensure we've used the context state
      const timer = setTimeout(() => {
        setIsReturningToCall(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReturningToCall, setIsReturningToCall]);

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

  // Handle hardware back button press - minimize call (don't end it)
  useEffect(() => {
    const backAction = () => {
      // If call is active, just go back (minimize) - don't end the call
      // User can return via the ActiveCallBanner
      if (callStatus === 'connected' || callStatus === 'connecting' || callStatus === 'calling' || callStatus === 'ringing') {
        // Just navigate back - call continues in background
        navigation.goBack();
        return true; // Prevent default back action (we handled it)
      }
      // If call is ended/rejected/missed, allow normal back navigation
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [callStatus, navigation]);

  // Determine effective call type - use isVideoCall prop as fallback
  const effectiveCallType = callType || (isVideoCall ? "video" : "audio");

  // Track active call in global context for return-to-call functionality
  // Only set when NOT returning to an existing call
  useEffect(() => {
    // Don't update context if we're returning to existing call
    if (isReturning) return;

    // Set active call data when call starts
    if (roomId && callStatus !== 'idle' && callStatus !== 'ended' && callStatus !== 'rejected' && callStatus !== 'missed') {
      activeCallContext.setActiveCall({
        roomId,
        callId: initialCallId,
        userId,
        username,
        callType: effectiveCallType,
        callerName,
        isIncoming: isIncoming || false,
        startTime: Date.now(),
      });
    }
  }, [roomId, effectiveCallType, userId, username, callerName, initialCallId, isIncoming, callStatus, isReturning, activeCallContext]);

  // Update call status in global context
  useEffect(() => {
    // Don't update if returning (context already has the status)
    if (isReturning) return;

    activeCallContext.updateCallStatus(callStatus);

    // Clear active call when call ends
    if (callStatus === 'ended' || callStatus === 'rejected' || callStatus === 'missed') {
      // Delay clearing to allow UI to show ended state
      const timeout = setTimeout(() => {
        activeCallContext.clearActiveCall();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [callStatus, isReturning, activeCallContext]);

  // Track if vibration is active to properly clean up
  const vibrationActiveRef = useRef(false);

  // Start or handle incoming call
  // Skip if returning to existing call
  useEffect(() => {
    // If returning to existing call, don't start a new one
    if (isReturning) {
      logger.debug("Returning to existing call - skipping call start");
      setHasStartedCall(true);
      return;
    }

    if (hasStartedCall) return;

    if (isIncoming) {
      vibrationActiveRef.current = true;
      Vibration.vibrate([0, 500, 200, 500], true);
    } else {
      setHasStartedCall(true);
      logger.debug("Starting call with type:", effectiveCallType);
      startCall(userId, effectiveCallType, callerName)
        .then((success) => {
          if (!success) {
            // Call failed to start - clear the active call context immediately
            logger.debug("Call failed to start - clearing active call context");
            activeCallContext.clearActiveCall();
            // Navigate back after showing error briefly
            setTimeout(() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }, 1500);
          }
        })
        .catch((err) => {
          logger.error("Failed to start call:", err);
          activeCallContext.clearActiveCall();
          setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }, 1500);
        });
    }

    // Cleanup function - only cancel vibration on unmount
    return () => {
      if (vibrationActiveRef.current) {
        Vibration.cancel();
        vibrationActiveRef.current = false;
      }
    };
  }, [isIncoming, userId, effectiveCallType, callerName, startCall, hasStartedCall, isReturning, activeCallContext, navigation]);

  const handleAccept = useCallback(async () => {
    vibrationActiveRef.current = false;
    Vibration.cancel();
    setHasStartedCall(true);
    try {
      await acceptCall();
    } catch (err) {
      logger.error("Failed to accept call:", err);
    }
  }, [acceptCall]);

  const handleDecline = useCallback(() => {
    vibrationActiveRef.current = false;
    Vibration.cancel();
    declineCall("rejected");
    navigation.goBack();
  }, [declineCall, navigation]);

  const handleHangUp = useCallback(() => {
    hangUp("user_ended");
    navigation.goBack();
  }, [hangUp, navigation]);

  // Handle back button press - minimize call (don't end it)
  const handleBackPress = useCallback(() => {
    // Just go back - call continues in background
    // User can return via the ActiveCallBanner floating button
    navigation.goBack();
  }, [navigation]);

  // Display logic (Messenger-like):
  // - Local camera: Show immediately when we have localStream (video calls only)
  // - Remote video: Show when we have remoteStream with tracks (video calls only)
  // - Audio calls: Just show avatar with connection status
  const isVideoMode = effectiveCallType === "video";
  const hasLocalVideo = isVideoMode && localStream !== null;

  // Debug logging for video display
  useEffect(() => {
    logger.debug('[CallScreen] Display state:', {
      isVideoMode,
      hasLocalStream: localStream !== null,
      localStreamTracks: localStream?.getTracks().length ?? 0,
      hasLocalVideo,
      callStatus,
      effectiveCallType,
    });
  }, [isVideoMode, localStream, hasLocalVideo, callStatus, effectiveCallType]);

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
      {hasRemoteVideo && remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
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
          {/* Back button - minimizes call (call continues in background) */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBackPress}
            activeOpacity={0.7}
            accessibilityLabel="Minimize call"
            accessibilityHint="Double tap to minimize call. Call will continue and you can return via the banner."
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

          {/* Connection quality and audio mode indicators - show when connected */}
          {showConnectedUI && (
            <View style={styles.indicatorsContainer}>
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
              <AudioModeIndicator isSpeakerOn={isSpeakerOn} isNativeAvailable={isNativeAudioAvailable()} />
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

          {/* Network warning banner */}
          {networkWarning && !error && (
            <View style={styles.networkWarningBanner}>
              <Ionicons name="cellular-outline" size={16} color={colors.warning} />
              <AppText size="small" color={colors.warning} style={styles.errorText}>
                {networkWarning}
              </AppText>
            </View>
          )}

          {/* Reconnecting indicator */}
          {isReconnecting && (
            <View style={styles.reconnectingBanner}>
              <Animated.View style={styles.reconnectingSpinner}>
                <Ionicons name="refresh" size={18} color={colors.accentTeal} />
              </Animated.View>
              <AppText size="small" color={colors.accentTeal} style={styles.errorText}>
                Reconnecting...
              </AppText>
            </View>
          )}
        </View>

        {/* Local video preview - Show immediately when we have local stream (Messenger-like) */}
        {hasLocalVideo && localStream && (
          <View style={styles.localPreviewContainer}>
            <RTCView
              streamURL={localStream.toURL()}
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
            <View style={styles.incomingControlsContainer}>
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

              {/* Audio-only option for video calls */}
              {effectiveCallType === "video" && (
                <TouchableOpacity
                  style={styles.audioOnlyButton}
                  onPress={() => {
                    // Accept but immediately turn off camera
                    handleAccept();
                    // Camera will be off by default - user can enable later
                    setTimeout(() => toggleCamera(), 500);
                  }}
                  accessibilityLabel="Accept as audio only"
                  accessibilityHint="Double tap to accept this call with your camera off"
                >
                  <Ionicons name="mic" size={18} color={colors.white} />
                  <AppText size="small" weight="medium" color={colors.white}>
                    Accept as Audio Only
                  </AppText>
                </TouchableOpacity>
              )}
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
                  icon={isSpeakerOn ? "volume-high" : "ear"}
                  label={isSpeakerOn ? "Speaker" : "Earpiece"}
                  active={isSpeakerOn}
                  onPress={toggleSpeaker}
                  accessibilityHint={isSpeakerOn ? "Double tap to switch to earpiece" : "Double tap to switch to speaker"}
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

// ==================== EXPORTED COMPONENT WITH ERROR BOUNDARY ====================
export default function CallScreen(props: CallScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const activeCallContext = useActiveCall();

  const handleError = useCallback((error: Error) => {
    logger.error('[CallScreen] Fatal error, cleaning up:', error);
    // Clean up call state on error
    activeCallContext.clearActiveCall();
    // Navigate back after a short delay
    setTimeout(() => {
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }, 3000);
  }, [activeCallContext, navigation]);

  return (
    <CallScreenErrorBoundary onError={handleError}>
      <CallScreenContent {...props} />
    </CallScreenErrorBoundary>
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
  indicatorsContainer: {
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  qualityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
  networkWarningBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    backgroundColor: "rgba(255,165,0,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  reconnectingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    backgroundColor: "rgba(0,200,200,0.2)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  reconnectingSpinner: {
    // Simple rotation would need Animated - just static for now
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
  incomingControlsContainer: {
    alignItems: "center",
  },
  incomingControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 32,
    paddingVertical: 24,
    width: "100%",
  },
  audioOnlyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 8,
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
