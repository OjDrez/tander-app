import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from "react-native-webrtc";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import {
  ensureSocketConnection,
  registerSocketListener,
  socket,
} from "@/src/services/socket";

type ControlButtonProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active?: boolean;
  onPress?: () => void;
  danger?: boolean;
};

type IncomingCallPayload = {
  callerId: string;
  roomId: string;
};

type CallResponsePayload = {
  roomId: string;
  acceptedBy: string;
};

type OfferPayload = {
  roomId: string;
  offer: RTCSessionDescriptionInit;
  callerId: string;
};

type AnswerPayload = {
  roomId: string;
  answer: RTCSessionDescriptionInit;
};

type IceCandidatePayload = {
  roomId: string;
  candidate: RTCIceCandidateInit;
};

export default function VideoCallScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "VideoCallScreen">) {
  const { userId, roomId: initialRoomId, callerId } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callStatus, setCallStatus] = useState("Ringing...");
  const [roomId, setRoomId] = useState(initialRoomId);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localUserId = callerId ?? "current-user";

  const createPeerConnection = useCallback(() => {
    const connection = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    connection.onicecandidate = (event) => {
      if (event.candidate && roomId) {
        socket.emit("iceCandidate", {
          roomId,
          candidate: event.candidate,
          senderId: localUserId,
        });
      }
    };

    connection.onconnectionstatechange = () => {
      if (connection.connectionState === "connected") {
        setCallStatus("Connected");
      }
    };

    peerConnectionRef.current = connection;
    return connection;
  }, [localUserId, roomId]);

  const handleIncomingCall = useCallback(
    (payload: IncomingCallPayload) => {
      setRoomId(payload.roomId);
      setCallStatus("Incoming call");

      if (payload.callerId !== userId) {
        navigation.navigate("VideoCallScreen", {
          userId: payload.callerId,
          roomId: payload.roomId,
          callerId: payload.callerId,
        });
      }
    },
    [navigation, userId]
  );

  const handleOffer = useCallback(
    async (payload: OfferPayload) => {
      if (roomId && payload.roomId !== roomId) return;

      setRoomId(payload.roomId);

      const connection = peerConnectionRef.current ?? createPeerConnection();
      await connection.setRemoteDescription(new RTCSessionDescription(payload.offer));
      const answer = await connection.createAnswer();
      await connection.setLocalDescription(answer);

      socket.emit("answer", {
        roomId: payload.roomId,
        answer,
        responderId: localUserId,
      });

      setCallStatus("Answering...");
    },
    [createPeerConnection, localUserId, roomId]
  );

  const handleAnswer = useCallback(
    async (payload: AnswerPayload) => {
      if (payload.roomId !== roomId) return;

      const connection = peerConnectionRef.current ?? createPeerConnection();
      await connection.setRemoteDescription(new RTCSessionDescription(payload.answer));
      setCallStatus("Connected");
    },
    [createPeerConnection, roomId]
  );

  const handleIceCandidate = useCallback(
    async (payload: IceCandidatePayload) => {
      if (payload.roomId !== roomId || !payload.candidate) return;

      const connection = peerConnectionRef.current ?? createPeerConnection();
      await connection.addIceCandidate(new RTCIceCandidate(payload.candidate));
    },
    [createPeerConnection, roomId]
  );

  useEffect(() => {
    ensureSocketConnection();

    const cleanupIncomingCall = registerSocketListener<IncomingCallPayload>(
      "incomingCall",
      handleIncomingCall
    );

    const cleanupCallAccepted = registerSocketListener<CallResponsePayload>(
      "callAccepted",
      (payload) => {
        if (payload.roomId !== roomId) return;
        setCallStatus("Call connected");
        peerConnectionRef.current ?? createPeerConnection();
      }
    );

    const cleanupCallRejected = registerSocketListener<CallResponsePayload>(
      "callRejected",
      (payload) => {
        if (payload.roomId !== roomId) return;
        setCallStatus("Call declined");
        navigation.goBack();
      }
    );

    const cleanupOffer = registerSocketListener<OfferPayload>("offer", handleOffer);
    const cleanupAnswer = registerSocketListener<AnswerPayload>(
      "answer",
      handleAnswer
    );
    const cleanupIceCandidate = registerSocketListener<IceCandidatePayload>(
      "iceCandidate",
      handleIceCandidate
    );

    return () => {
      cleanupIncomingCall();
      cleanupCallAccepted();
      cleanupCallRejected();
      cleanupOffer();
      cleanupAnswer();
      cleanupIceCandidate();
      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;
    };
  }, [
    createPeerConnection,
    handleAnswer,
    handleIceCandidate,
    handleIncomingCall,
    handleOffer,
    navigation,
    roomId,
  ]);

  return (
    <FullScreen statusBarStyle="light" style={styles.screen}>
      <View style={styles.remoteVideo}>
        {/* TODO: Attach remote WebRTC stream to this view */}
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
            Preparing video...
          </AppText>
          <AppText size="small" color={colors.white} style={styles.placeholderSubtitle}>
            Waiting for {userId} to join
          </AppText>
        </LinearGradient>
      </View>

      <View style={styles.overlay} pointerEvents="box-none">
        <SafeAreaView edges={["top", "left", "right"]} style={styles.topBar} pointerEvents="box-none">
          <View style={styles.callInfo}>
            <AppText size="h4" weight="bold" color={colors.white}>
              {userId}
            </AppText>
            <AppText size="small" weight="medium" color={colors.white} style={styles.callStatus}>
              {callStatus}
            </AppText>
          </View>
        </SafeAreaView>

        <View style={styles.localPreviewContainer}>
          {/* TODO: Attach local WebRTC stream to this view */}
          <View style={styles.localVideo}>
            <View style={styles.localPlaceholder}>
              <Ionicons name="person-circle" size={34} color={colors.white} />
              <AppText size="tiny" color={colors.white}>
                Your preview
              </AppText>
            </View>
          </View>
        </View>

        <SafeAreaView edges={["bottom", "left", "right"]} style={styles.bottomSafeArea}>
          <View style={styles.controlsPanel}>
            <ControlButton
              icon={isMuted ? "mic-off" : "mic"}
              label={isMuted ? "Unmute" : "Mute"}
              active={isMuted}
              onPress={() => setIsMuted((prev) => !prev)}
            />
            <ControlButton
              icon={isCameraOn ? "videocam" : "videocam-off"}
              label={isCameraOn ? "Camera" : "Camera Off"}
              active={!isCameraOn}
              onPress={() => setIsCameraOn((prev) => !prev)}
            />
            <ControlButton
              icon={isSpeakerOn ? "volume-high" : "volume-mute"}
              label={isSpeakerOn ? "Speaker" : "Muted"}
              active={!isSpeakerOn}
              onPress={() => setIsSpeakerOn((prev) => !prev)}
            />
            <ControlButton
              icon="call"
              label="End"
              danger
              onPress={() => navigation.goBack()}
            />
          </View>
          <GradientButton title="Send message" onPress={() => navigation.goBack()} style={styles.secondaryAction} />
        </SafeAreaView>
      </View>
    </FullScreen>
  );
}

function ControlButton({ icon, label, active = false, onPress, danger = false }: ControlButtonProps) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      activeOpacity={0.9}
      onPress={onPress}
      style={[styles.controlButton, danger && styles.dangerButton, active && styles.activeButton]}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
      <AppText size="tiny" weight="medium" color={colors.white} style={styles.controlLabel}>
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
  callStatus: {
    opacity: 0.9,
  },
  localPreviewContainer: {
    position: "absolute",
    right: 20,
    top: 100,
    width: 140,
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: colors.black,
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  localVideo: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: colors.accentBlue,
    alignItems: "center",
    justifyContent: "center",
  },
  localPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  bottomSafeArea: {
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  controlLabel: {
    textAlign: "center",
    opacity: 0.9,
  },
  secondaryAction: {
    marginTop: 4,
  },
});
