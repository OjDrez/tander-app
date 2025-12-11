import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  mediaDevices,
  MediaStream,
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import {
  answerCall,
  endCall,
  getCurrentUserId,
  initiateCall,
  registerSocketListener,
  rejectCall,
  sendAnswer,
  sendIceCandidate,
  sendOffer,
} from '../services/socket';
import {
  AnswerPayload,
  CallAnsweredPayload,
  CallEndedPayload,
  CallRejectedPayload,
  CallStatus,
  CallType,
  IceCandidatePayload,
  IncomingCallPayload,
  OfferPayload,
} from '../types/chat';

// STUN/TURN server configuration for NAT traversal
// Multiple TURN servers for high reliability (90%+ connection rate)
const ICE_SERVERS = [
  // Google STUN servers (free, reliable, fast)
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // Twilio STUN (reliable backup)
  { urls: 'stun:global.stun.twilio.com:3478' },
  // Metered.ca free TURN servers (multiple protocols for firewall bypass)
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:80?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  {
    urls: 'turns:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject',
  },
  // Xirsys free TURN (backup)
  {
    urls: 'turn:turn.bistri.com:80',
    username: 'homeo',
    credential: 'homeo',
  },
];

// Connection quality thresholds
const QUALITY_THRESHOLDS = {
  PACKET_LOSS_POOR: 0.1, // 10% packet loss = poor
  PACKET_LOSS_FAIR: 0.05, // 5% packet loss = fair
  RTT_POOR: 300, // 300ms RTT = poor
  RTT_FAIR: 150, // 150ms RTT = fair
};

// Call timeout configuration
const CALL_TIMEOUTS = {
  RING_TIMEOUT: 60000, // 60 seconds to answer
  RECONNECT_TIMEOUT: 30000, // 30 seconds to reconnect after disconnect
  RECONNECT_ATTEMPTS: 3, // Max reconnection attempts
  ICE_GATHERING_TIMEOUT: 10000, // 10 seconds for ICE gathering
  CONNECTION_TIMEOUT: 30000, // 30 seconds to establish connection
  ICE_RESTART_DELAY: 3000, // 3 seconds before ICE restart attempt
};

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

interface UseCallOptions {
  onIncomingCall?: (payload: IncomingCallPayload) => void;
  onCallEnded?: (payload: CallEndedPayload) => void;
  onCallRejected?: (payload: CallRejectedPayload) => void;
  onCallBusy?: (payload: IncomingCallPayload) => void; // Called when user is busy
  onCallTimeout?: () => void; // Called when call times out (no answer)
  onCallDisconnected?: () => void; // Called when call disconnects unexpectedly
  onReconnecting?: (attempt: number) => void; // Called during reconnection attempts
  onReconnected?: () => void; // Called when reconnection succeeds
  initialIncomingCall?: {
    roomId: string;
    callId: number;
    callerId: number;
    callerUsername: string;
    callType: CallType;
  };
}

interface UseCallReturn {
  callStatus: CallStatus;
  callType: CallType | null;
  roomId: string | null;
  callId: number | null;
  remoteUserId: number | null;
  remoteUsername: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  error: string | null;
  connectionQuality: ConnectionQuality;
  isReconnecting: boolean;
  reconnectAttempt: number;
  startCall: (targetUserId: number, type: CallType, callerName?: string) => Promise<boolean>;
  acceptCall: () => Promise<boolean>;
  declineCall: (reason?: string) => void;
  hangUp: (reason?: string) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
  switchCamera: () => void;
  reconnect: () => Promise<boolean>; // Manual reconnection
}

/**
 * Hook for managing voice/video calls with WebRTC
 * Implements Messenger-like call flow:
 * 1. Caller: Opens camera immediately, waits for accept
 * 2. Receiver: Shows incoming call UI, opens camera on accept
 * 3. Both: See each other after WebRTC connection established
 */
export const useCall = (options: UseCallOptions = {}): UseCallReturn => {
  const {
    onIncomingCall,
    onCallEnded,
    onCallRejected,
    onCallBusy,
    onCallTimeout,
    onCallDisconnected,
    onReconnecting,
    onReconnected,
    initialIncomingCall,
  } = options;

  // Call state
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [callType, setCallType] = useState<CallType | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [callId, setCallId] = useState<number | null>(null);
  const [remoteUserId, setRemoteUserId] = useState<number | null>(null);
  const [remoteUsername, setRemoteUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Media state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // Duration tracking
  const [callDuration, setCallDuration] = useState(0);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Connection quality monitoring
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQuality>('unknown');
  const qualityMonitorRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reconnection state
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Call timeout tracking
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store call data for reconnection
  const lastCallDataRef = useRef<{
    targetUserId: number;
    callType: CallType;
    callerName?: string;
  } | null>(null);

  // Refs for stable references
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingOfferRef = useRef<OfferPayload | null>(null);
  const incomingCallDataRef = useRef<IncomingCallPayload | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const isCallerRef = useRef(false);
  const isInitializedRef = useRef(false);
  const hasAcceptedRef = useRef(false);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iceRestartAttemptRef = useRef(0);
  const maxIceRestartAttempts = 3;
  const isMountedRef = useRef(true);

  // Keep roomIdRef in sync
  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  // ==================== INITIALIZATION ====================

  useEffect(() => {
    if (initialIncomingCall && !isInitializedRef.current) {
      isInitializedRef.current = true;
      isCallerRef.current = false;
      hasAcceptedRef.current = false;

      console.log('[useCall] Initializing as receiver:', initialIncomingCall);

      const incomingPayload: IncomingCallPayload = {
        roomId: initialIncomingCall.roomId,
        callId: initialIncomingCall.callId,
        callerId: initialIncomingCall.callerId,
        callerUsername: initialIncomingCall.callerUsername,
        callerName: initialIncomingCall.callerUsername,
        callType: initialIncomingCall.callType,
        timestamp: Date.now(),
      };

      incomingCallDataRef.current = incomingPayload;
      roomIdRef.current = initialIncomingCall.roomId;

      setCallStatus('ringing');
      setCallType(initialIncomingCall.callType);
      setRoomId(initialIncomingCall.roomId);
      setCallId(initialIncomingCall.callId);
      setRemoteUserId(initialIncomingCall.callerId);
      setRemoteUsername(initialIncomingCall.callerUsername);
    }
  }, [initialIncomingCall]);

  // ==================== MEDIA FUNCTIONS ====================

  const getLocalMedia = useCallback(async (type: CallType): Promise<MediaStream | null> => {
    try {
      console.log('[useCall] Getting local media for type:', type);
      const isVideo = type === 'video';
      const constraints = {
        audio: true,
        video: isVideo ? { facingMode: 'user', width: 640, height: 480 } : false,
      };
      console.log('[useCall] Media constraints:', JSON.stringify(constraints));

      const stream = await mediaDevices.getUserMedia(constraints);

      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('[useCall] Component unmounted during media acquisition, stopping tracks');
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      console.log('[useCall] Got local media stream:', stream.id);
      console.log('[useCall] Video tracks:', videoTracks.length, 'Audio tracks:', audioTracks.length);
      if (videoTracks.length > 0) {
        console.log('[useCall] Video track settings:', JSON.stringify(videoTracks[0].getSettings()));
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      console.log('[useCall] Local stream set to state');
      return stream;
    } catch (err) {
      console.error('[useCall] Failed to get local media:', err);
      if (isMountedRef.current) {
        setError('Failed to access camera/microphone. Please check permissions.');
      }
      return null;
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    console.log('[useCall] Stopping local media');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log('[useCall] Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    setLocalStream(null);
  }, []);

  // ==================== PEER CONNECTION ====================

  /**
   * Clear connection timeout
   */
  const clearConnectionTimeout = useCallback(() => {
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start connection timeout - if no connection within timeout, attempt ICE restart
   */
  const startConnectionTimeout = useCallback((pc: RTCPeerConnection, currentRoomId: string) => {
    clearConnectionTimeout();

    connectionTimeoutRef.current = setTimeout(async () => {
      if (pc.iceConnectionState !== 'connected' && pc.iceConnectionState !== 'completed') {
        console.log('[useCall] Connection timeout reached, ICE state:', pc.iceConnectionState);

        if (iceRestartAttemptRef.current < maxIceRestartAttempts && pc.signalingState !== 'closed') {
          iceRestartAttemptRef.current++;
          console.log('[useCall] Attempting ICE restart', iceRestartAttemptRef.current, 'of', maxIceRestartAttempts);
          setError(`Connection slow, retrying... (${iceRestartAttemptRef.current}/${maxIceRestartAttempts})`);

          try {
            // Restart ICE
            pc.restartIce();

            // If we're the caller, create a new offer with ICE restart
            if (isCallerRef.current && pc.signalingState === 'have-local-offer') {
              console.log('[useCall] Creating new offer for ICE restart');
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              if (offer.sdp) {
                sendOffer(currentRoomId, offer.sdp, 'offer');
              }
            }

            // Restart the timeout
            startConnectionTimeout(pc, currentRoomId);
          } catch (err) {
            console.error('[useCall] ICE restart failed:', err);
          }
        } else {
          console.log('[useCall] Max ICE restart attempts reached');
          setError('Connection failed. Please check your network and try again.');
          setCallStatus('ended');
          onCallDisconnected?.();
        }
      }
    }, CALL_TIMEOUTS.CONNECTION_TIMEOUT);
  }, [clearConnectionTimeout, onCallDisconnected]);

  const createPeerConnection = useCallback((currentRoomId: string): RTCPeerConnection => {
    console.log('[useCall] Creating peer connection for room:', currentRoomId);

    // Reset ICE restart counter for new connection
    iceRestartAttemptRef.current = 0;

    // Close existing connection if any
    if (peerConnectionRef.current) {
      console.log('[useCall] Closing existing peer connection');
      peerConnectionRef.current.close();
    }

    // Use aggressive ICE policy for faster connection
    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceCandidatePoolSize: 10, // Pre-fetch ICE candidates for faster connection
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidates immediately (trickle ICE)
        console.log('[useCall] Sending ICE candidate:', event.candidate.candidate?.substring(0, 50));
        sendIceCandidate(
          currentRoomId,
          JSON.stringify(event.candidate),
          event.candidate.sdpMid || '',
          event.candidate.sdpMLineIndex || 0
        );
      } else {
        console.log('[useCall] ICE gathering complete');
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log('[useCall] ICE gathering state:', pc.iceGatheringState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[useCall] ICE connection state:', pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case 'new':
          console.log('[useCall] ICE connection: new');
          setConnectionQuality('unknown');
          break;
        case 'checking':
          console.log('[useCall] ICE connection: checking...');
          setCallStatus('connecting');
          setConnectionQuality('unknown');
          // Start connection timeout when we begin checking
          startConnectionTimeout(pc, currentRoomId);
          break;
        case 'connected':
          console.log('[useCall] ICE connection: CONNECTED!');
          clearConnectionTimeout();
          iceRestartAttemptRef.current = 0;
          setError(null); // Clear any retry error messages
          setCallStatus('connected');
          setIsReconnecting(false);
          setReconnectAttempt(0);
          startDurationTimer();
          startQualityMonitor();
          break;
        case 'completed':
          console.log('[useCall] ICE connection: COMPLETED!');
          clearConnectionTimeout();
          iceRestartAttemptRef.current = 0;
          setError(null);
          setCallStatus('connected');
          setIsReconnecting(false);
          setReconnectAttempt(0);
          startDurationTimer();
          startQualityMonitor();
          break;
        case 'disconnected':
          console.log('[useCall] ICE connection: disconnected (may reconnect)');
          setConnectionQuality('poor');
          // Give WebRTC time to auto-recover before taking action
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected') {
              console.log('[useCall] Still disconnected after timeout, attempting ICE restart');
              // Try ICE restart first
              if (pc.signalingState !== 'closed' && iceRestartAttemptRef.current < maxIceRestartAttempts) {
                iceRestartAttemptRef.current++;
                pc.restartIce();
              } else {
                onCallDisconnected?.();
              }
            }
          }, CALL_TIMEOUTS.ICE_RESTART_DELAY);
          break;
        case 'failed':
          console.log('[useCall] ICE connection: FAILED');
          clearConnectionTimeout();
          setConnectionQuality('poor');
          stopQualityMonitor();

          // Try ICE restart before giving up
          if (pc.signalingState !== 'closed' && iceRestartAttemptRef.current < maxIceRestartAttempts) {
            iceRestartAttemptRef.current++;
            console.log('[useCall] Attempting ICE restart after failure', iceRestartAttemptRef.current);
            setError(`Connection failed, retrying... (${iceRestartAttemptRef.current}/${maxIceRestartAttempts})`);

            setTimeout(() => {
              if (pc.signalingState !== 'closed') {
                pc.restartIce();
                // If caller, create new offer
                if (isCallerRef.current) {
                  pc.createOffer({ iceRestart: true })
                    .then(offer => pc.setLocalDescription(offer))
                    .then(() => {
                      if (pc.localDescription?.sdp) {
                        sendOffer(currentRoomId, pc.localDescription.sdp, 'offer');
                      }
                    })
                    .catch(console.error);
                }
                // Restart timeout
                startConnectionTimeout(pc, currentRoomId);
              }
            }, CALL_TIMEOUTS.ICE_RESTART_DELAY);
          } else {
            setError('Connection failed. Please try again.');
            setCallStatus('ended');
            onCallDisconnected?.();
          }
          break;
        case 'closed':
          console.log('[useCall] ICE connection: closed');
          clearConnectionTimeout();
          stopQualityMonitor();
          break;
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[useCall] Connection state:', pc.connectionState);
      // Also check connection state as a fallback
      if (pc.connectionState === 'connected') {
        console.log('[useCall] Connection state CONNECTED - setting call as connected');
        clearConnectionTimeout();
        setError(null);
        setCallStatus('connected');
        startDurationTimer();
      } else if (pc.connectionState === 'failed') {
        // Handle connection state failed (some browsers report this instead of ICE failed)
        if (iceRestartAttemptRef.current < maxIceRestartAttempts && pc.signalingState !== 'closed') {
          iceRestartAttemptRef.current++;
          console.log('[useCall] Connection failed, attempting restart', iceRestartAttemptRef.current);
          pc.restartIce();
        }
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[useCall] Signaling state:', pc.signalingState);
    };

    pc.ontrack = (event) => {
      console.log('[useCall] Received remote track:', event.track.kind, 'readyState:', event.track.readyState);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        console.log('[useCall] Setting remote stream, tracks:', stream.getTracks().length);
        setRemoteStream(stream);

        // If we're receiving tracks, we're definitely connected
        // This is a reliable fallback for connection detection
        if (stream.getTracks().length > 0) {
          console.log('[useCall] Remote tracks received - connection confirmed');
          clearConnectionTimeout();
          setError(null);
          setCallStatus('connected');
          startDurationTimer();
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [onCallDisconnected, startConnectionTimeout, clearConnectionTimeout]);

  const addLocalTracksToConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    console.log('[useCall] Adding local tracks to connection');
    stream.getTracks().forEach((track) => {
      console.log('[useCall] Adding track:', track.kind);
      pc.addTrack(track, stream);
    });
  }, []);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) return;
    console.log('[useCall] Starting duration timer');
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  }, []);

  /**
   * Monitor connection quality using WebRTC stats
   */
  const startQualityMonitor = useCallback(() => {
    if (qualityMonitorRef.current) return;
    console.log('[useCall] Starting connection quality monitor');

    qualityMonitorRef.current = setInterval(async () => {
      const pc = peerConnectionRef.current;
      if (!pc || pc.connectionState !== 'connected') {
        return;
      }

      try {
        const stats = await pc.getStats();
        let packetLoss = 0;
        let roundTripTime = 0;
        let packetsReceived = 0;
        let packetsLost = 0;

        stats.forEach((report: any) => {
          // Check inbound RTP for packet loss
          if (report.type === 'inbound-rtp' && report.kind === 'video') {
            packetsReceived = report.packetsReceived || 0;
            packetsLost = report.packetsLost || 0;
            if (packetsReceived + packetsLost > 0) {
              packetLoss = packetsLost / (packetsReceived + packetsLost);
            }
          }

          // Check candidate pair for RTT
          if (report.type === 'candidate-pair' && report.state === 'succeeded') {
            roundTripTime = report.currentRoundTripTime
              ? report.currentRoundTripTime * 1000
              : 0;
          }
        });

        // Determine quality based on thresholds
        let quality: ConnectionQuality = 'excellent';

        if (packetLoss > QUALITY_THRESHOLDS.PACKET_LOSS_POOR || roundTripTime > QUALITY_THRESHOLDS.RTT_POOR) {
          quality = 'poor';
        } else if (packetLoss > QUALITY_THRESHOLDS.PACKET_LOSS_FAIR || roundTripTime > QUALITY_THRESHOLDS.RTT_FAIR) {
          quality = 'fair';
        } else if (packetLoss > 0.02 || roundTripTime > 100) {
          quality = 'good';
        }

        setConnectionQuality(quality);

        // Log quality changes
        console.log('[useCall] Connection quality:', quality, 'packetLoss:', (packetLoss * 100).toFixed(1) + '%', 'rtt:', roundTripTime.toFixed(0) + 'ms');
      } catch (err) {
        console.warn('[useCall] Failed to get stats:', err);
      }
    }, 3000); // Check every 3 seconds
  }, []);

  const stopQualityMonitor = useCallback(() => {
    if (qualityMonitorRef.current) {
      clearInterval(qualityMonitorRef.current);
      qualityMonitorRef.current = null;
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    clearConnectionTimeout();
  }, [clearConnectionTimeout]);

  const cleanup = useCallback((preserveCallData: boolean = false) => {
    console.log('[useCall] Cleaning up call resources, preserveCallData:', preserveCallData);

    clearAllTimeouts();
    stopQualityMonitor();

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    stopLocalMedia();

    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOn(true);
    setError(null);
    setConnectionQuality('unknown');
    setIsReconnecting(false);
    setReconnectAttempt(0);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    hasAcceptedRef.current = false;
    iceRestartAttemptRef.current = 0;

    // Only clear call data if not preserving for reconnection
    if (!preserveCallData) {
      lastCallDataRef.current = null;
    }
  }, [stopLocalMedia, stopQualityMonitor, clearAllTimeouts]);

  // ==================== CALL ACTIONS ====================

  /**
   * Start ringing timeout - auto-end call if not answered
   */
  const startRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
    }

    console.log('[useCall] Starting ring timeout:', CALL_TIMEOUTS.RING_TIMEOUT, 'ms');
    ringTimeoutRef.current = setTimeout(() => {
      console.log('[useCall] Call timed out - no answer');
      setError('No answer');
      setCallStatus('ended');
      onCallTimeout?.();
      cleanup();
    }, CALL_TIMEOUTS.RING_TIMEOUT);
  }, [cleanup, onCallTimeout]);

  /**
   * Clear ring timeout (called when call is answered or ended)
   */
  const clearRingTimeout = useCallback(() => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }
  }, []);

  /**
   * Start an outgoing call (Caller flow)
   * 1. Get local media (show own camera)
   * 2. Initiate call on server
   * 3. Create WebRTC offer
   * 4. Wait for answer
   */
  const startCall = useCallback(
    async (targetUserId: number, type: CallType, callerName?: string): Promise<boolean> => {
      try {
        console.log('[useCall] Starting call to user:', targetUserId, 'type:', type);
        setError(null);
        isCallerRef.current = true;
        isInitializedRef.current = true;

        // Store call data for potential reconnection
        lastCallDataRef.current = { targetUserId, callType: type, callerName };

        // Step 1: Get local media FIRST (Messenger-like: show own camera immediately)
        setCallStatus('calling');
        setCallType(type);
        setRemoteUserId(targetUserId);

        const stream = await getLocalMedia(type);
        if (!stream) {
          setCallStatus('idle');
          return false;
        }

        // Step 2: Initiate call on server
        console.log('[useCall] Initiating call on server');
        const result = await initiateCall(targetUserId, type, callerName);

        if (!result.success || !result.roomId) {
          console.error('[useCall] Failed to initiate call:', result.error);
          stopLocalMedia();
          setCallStatus('idle');
          setError(result.error || 'Failed to initiate call');
          return false;
        }

        const callRoomId = result.roomId;
        roomIdRef.current = callRoomId;
        setRoomId(callRoomId);
        setCallId(result.callId || null);
        setCallStatus('ringing');

        // Start timeout for unanswered calls
        startRingTimeout();

        // Step 3: Create peer connection and add tracks
        const pc = createPeerConnection(callRoomId);
        addLocalTracksToConnection(pc, stream);

        // Step 4: Create and send offer
        // Wait a short moment for the receiver to receive the incoming-call event
        // and join the room before we send the offer
        console.log('[useCall] Creating offer');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await pc.setLocalDescription(offer);

        if (offer.sdp) {
          // Small delay to allow receiver to process incoming-call event
          await new Promise(resolve => setTimeout(resolve, 500));
          console.log('[useCall] Sending offer');
          sendOffer(callRoomId, offer.sdp, 'offer');

          // Re-send offer after 2 seconds in case receiver wasn't ready
          // This helps with timing issues where receiver hasn't accepted yet
          setTimeout(() => {
            if (peerConnectionRef.current?.iceConnectionState === 'new' ||
                peerConnectionRef.current?.iceConnectionState === 'checking') {
              console.log('[useCall] Re-sending offer (receiver may not have been ready)');
              if (offer.sdp) {
                sendOffer(callRoomId, offer.sdp, 'offer');
              }
            }
          }, 3000);
        }

        return true;
      } catch (err) {
        console.error('[useCall] Failed to start call:', err);
        setError('Failed to start call');
        setCallStatus('idle');
        stopLocalMedia();
        return false;
      }
    },
    [getLocalMedia, stopLocalMedia, createPeerConnection, addLocalTracksToConnection, startRingTimeout]
  );

  /**
   * Accept an incoming call (Receiver flow)
   * 1. Get local media (show own camera)
   * 2. Notify server we accepted
   * 3. Process pending offer and create answer
   */
  const acceptCall = useCallback(async (): Promise<boolean> => {
    try {
      const callData = incomingCallDataRef.current;
      if (!callData) {
        console.error('[useCall] No incoming call data to accept');
        setError('No incoming call to accept');
        return false;
      }

      console.log('[useCall] Accepting call in room:', callData.roomId);
      setError(null);
      hasAcceptedRef.current = true;
      isCallerRef.current = false;

      // Step 1: Get local media FIRST (Messenger-like: show own camera)
      setCallStatus('connecting');
      const stream = await getLocalMedia(callData.callType);
      if (!stream) {
        console.error('[useCall] Failed to get local media');
        setCallStatus('idle');
        return false;
      }

      // Step 2: Notify server we accepted
      console.log('[useCall] Notifying server of call acceptance');
      const result = await answerCall(callData.roomId);
      if (!result.success) {
        console.error('[useCall] Failed to answer call on server:', result.error);
        stopLocalMedia();
        setCallStatus('idle');
        setError(result.error || 'Failed to answer call');
        return false;
      }

      // Step 3: Create peer connection and add tracks
      const pc = createPeerConnection(callData.roomId);
      addLocalTracksToConnection(pc, stream);

      // Step 4: Process pending offer if available
      const pendingOffer = pendingOfferRef.current;
      if (pendingOffer) {
        console.log('[useCall] Processing pending offer');
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp: pendingOffer.sdp })
          );

          console.log('[useCall] Creating answer');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (answer.sdp) {
            console.log('[useCall] Sending answer');
            sendAnswer(callData.roomId, answer.sdp, 'answer');
          }

          // Process pending ICE candidates
          console.log('[useCall] Processing', pendingCandidatesRef.current.length, 'pending ICE candidates');
          for (const candidateInit of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
              console.log('[useCall] Added pending ICE candidate');
            } catch (iceErr) {
              // ICE candidate errors are often non-fatal
              console.log('[useCall] Pending ICE candidate result:', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
          pendingOfferRef.current = null;
        } catch (offerErr) {
          console.error('[useCall] Failed to process pending offer:', offerErr);
          setError('Failed to establish connection');
        }
      } else {
        console.log('[useCall] No pending offer yet, waiting for offer...');
      }

      return true;
    } catch (err) {
      console.error('[useCall] Failed to accept call:', err);
      setError('Failed to accept call');
      stopLocalMedia();
      return false;
    }
  }, [getLocalMedia, stopLocalMedia, createPeerConnection, addLocalTracksToConnection]);

  /**
   * Decline an incoming call
   */
  const declineCall = useCallback(
    (reason: string = 'rejected') => {
      console.log('[useCall] Declining call, reason:', reason);
      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        rejectCall(currentRoomId, reason);
      }
      setCallStatus('rejected');
      cleanup();
    },
    [cleanup]
  );

  /**
   * Hang up an active call
   */
  const hangUp = useCallback(
    (reason: string = 'ended') => {
      console.log('[useCall] Hanging up call, reason:', reason);
      clearRingTimeout();
      const currentRoomId = roomIdRef.current;
      if (currentRoomId) {
        endCall(currentRoomId, reason);
      }
      setCallStatus('ended');
      cleanup();
    },
    [cleanup, clearRingTimeout]
  );

  /**
   * Reconnect to a dropped call
   * Uses exponential backoff for retry attempts
   */
  const reconnect = useCallback(async (): Promise<boolean> => {
    const callData = lastCallDataRef.current;
    if (!callData) {
      console.error('[useCall] No call data available for reconnection');
      setError('Cannot reconnect - no previous call data');
      return false;
    }

    if (reconnectAttempt >= CALL_TIMEOUTS.RECONNECT_ATTEMPTS) {
      console.error('[useCall] Max reconnection attempts reached');
      setError('Failed to reconnect after multiple attempts');
      cleanup();
      return false;
    }

    const attempt = reconnectAttempt + 1;
    setReconnectAttempt(attempt);
    setIsReconnecting(true);
    setError(null);

    console.log('[useCall] Reconnection attempt', attempt, 'of', CALL_TIMEOUTS.RECONNECT_ATTEMPTS);
    onReconnecting?.(attempt);

    // Close existing peer connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    try {
      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log('[useCall] Waiting', delay, 'ms before reconnection');
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Start a new call to the same user
      const success = await startCall(
        callData.targetUserId,
        callData.callType,
        callData.callerName
      );

      if (success) {
        console.log('[useCall] Reconnection successful');
        setIsReconnecting(false);
        onReconnected?.();
        return true;
      } else {
        console.log('[useCall] Reconnection failed, will retry');
        // Retry recursively
        return reconnect();
      }
    } catch (err) {
      console.error('[useCall] Reconnection error:', err);
      // Retry recursively
      return reconnect();
    }
  }, [reconnectAttempt, startCall, cleanup, onReconnecting, onReconnected]);

  // ==================== MEDIA CONTROLS ====================

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
        console.log('[useCall] Audio track enabled:', track.enabled);
      });
      setIsMuted((prev) => !prev);
    }
  }, []);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled;
        console.log('[useCall] Video track enabled:', track.enabled);
      });
      setIsCameraOn((prev) => !prev);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => !prev);
    // Note: Actual speaker control requires native module
  }, []);

  const switchCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream && callType === 'video') {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - _switchCamera exists on mobile
        videoTrack._switchCamera?.();
        console.log('[useCall] Switched camera');
      }
    }
  }, [callType]);

  // ==================== SOCKET EVENT LISTENERS ====================

  useEffect(() => {
    const myUserId = getCurrentUserId();

    // Incoming call (only if not already initialized with initialIncomingCall)
    const cleanupIncoming = registerSocketListener<IncomingCallPayload>(
      'incoming-call',
      (payload) => {
        // Check if user is already in a call (busy)
        if (isInitializedRef.current) {
          console.log('[useCall] User is busy - rejecting incoming call from:', payload.callerUsername);
          // Reject the call with 'busy' reason
          rejectCall(payload.roomId, 'busy');
          // Notify the app about the missed call due to busy status
          onCallBusy?.(payload);
          return;
        }

        console.log('[useCall] Incoming call:', payload);
        incomingCallDataRef.current = payload;
        roomIdRef.current = payload.roomId;
        isCallerRef.current = false;

        setCallStatus('ringing');
        setCallType(payload.callType);
        setRoomId(payload.roomId);
        setCallId(payload.callId);
        setRemoteUserId(payload.callerId);
        setRemoteUsername(payload.callerUsername);

        onIncomingCall?.(payload);
      }
    );

    // Call answered by receiver
    const cleanupAnswered = registerSocketListener<CallAnsweredPayload>(
      'call-answered',
      (payload) => {
        console.log('[useCall] Call answered:', payload);
        if (payload.roomId === roomIdRef.current && isCallerRef.current) {
          // Clear ring timeout since call was answered
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
          }
          setCallStatus('connecting');
          setRemoteUsername(payload.answeredBy);
        }
      }
    );

    // Call rejected by receiver
    const cleanupRejected = registerSocketListener<CallRejectedPayload>(
      'call-rejected',
      (payload) => {
        console.log('[useCall] Call rejected:', payload);
        if (payload.roomId === roomIdRef.current) {
          // Clear ring timeout
          if (ringTimeoutRef.current) {
            clearTimeout(ringTimeoutRef.current);
            ringTimeoutRef.current = null;
          }
          setCallStatus('rejected');
          // Provide specific error for busy vs declined
          if (payload.reason === 'busy') {
            setError('User is busy on another call');
          } else {
            setError('Call declined');
          }
          onCallRejected?.(payload);
          cleanup();
        }
      }
    );

    // Call ended by either party
    const cleanupEnded = registerSocketListener<CallEndedPayload>(
      'call-ended',
      (payload) => {
        console.log('[useCall] Call ended:', payload);
        if (payload.roomId === roomIdRef.current) {
          setCallStatus('ended');
          onCallEnded?.(payload);
          cleanup();
        }
      }
    );

    // WebRTC offer from caller
    const cleanupOffer = registerSocketListener<OfferPayload>(
      'receive-offer',
      async (payload) => {
        console.log('[useCall] Received offer, senderId:', payload.senderId, 'myUserId:', myUserId);

        // Ignore our own offers
        if (payload.senderId === myUserId) {
          console.log('[useCall] Ignoring own offer');
          return;
        }

        // Check room match
        if (payload.roomId !== roomIdRef.current) {
          console.log('[useCall] Ignoring offer for different room');
          return;
        }

        // If we're the caller, ignore offers
        if (isCallerRef.current) {
          console.log('[useCall] Ignoring offer - we are the caller');
          return;
        }

        // If we haven't accepted yet, store for later
        if (!hasAcceptedRef.current) {
          console.log('[useCall] Storing offer for later (not yet accepted)');
          pendingOfferRef.current = payload;
          return;
        }

        // Process offer immediately
        console.log('[useCall] Processing offer immediately');
        const pc = peerConnectionRef.current;
        if (!pc) {
          console.error('[useCall] No peer connection to process offer');
          return;
        }

        try {
          if (pc.signalingState !== 'stable') {
            console.log('[useCall] Cannot process offer - signaling state:', pc.signalingState);
            return;
          }

          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp: payload.sdp })
          );

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (answer.sdp) {
            sendAnswer(payload.roomId, answer.sdp, 'answer');
          }

          // Process pending ICE candidates
          for (const candidateInit of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
              console.log('[useCall] Added pending ICE candidate (offer handler)');
            } catch (iceErr) {
              console.log('[useCall] Pending ICE candidate result (offer handler):', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          console.error('[useCall] Failed to handle offer:', err);
        }
      }
    );

    // WebRTC answer from receiver
    const cleanupAnswer = registerSocketListener<AnswerPayload>(
      'receive-answer',
      async (payload) => {
        console.log('[useCall] Received answer, senderId:', payload.senderId, 'myUserId:', myUserId);

        // Ignore our own answers
        if (payload.senderId === myUserId) {
          console.log('[useCall] Ignoring own answer');
          return;
        }

        // Check room match
        if (payload.roomId !== roomIdRef.current) {
          console.log('[useCall] Ignoring answer for different room');
          return;
        }

        // Only caller should process answers
        if (!isCallerRef.current) {
          console.log('[useCall] Ignoring answer - we are not the caller');
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
          console.error('[useCall] No peer connection to set answer');
          return;
        }

        try {
          if (pc.signalingState !== 'have-local-offer') {
            console.log('[useCall] Cannot set answer - signaling state:', pc.signalingState);
            return;
          }

          console.log('[useCall] Setting remote answer');
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: payload.sdp })
          );

          // Process pending ICE candidates
          console.log('[useCall] Processing', pendingCandidatesRef.current.length, 'pending ICE candidates (answer handler)');
          for (const candidateInit of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
              console.log('[useCall] Added pending ICE candidate (answer handler)');
            } catch (iceErr) {
              console.log('[useCall] Pending ICE candidate result (answer handler):', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          console.error('[useCall] Failed to handle answer:', err);
        }
      }
    );

    // ICE candidate from peer
    const cleanupIce = registerSocketListener<IceCandidatePayload>(
      'receive-ice-candidate',
      async (payload) => {
        // Ignore our own ICE candidates
        if (payload.senderId === myUserId) {
          return;
        }

        // Check room match
        if (payload.roomId !== roomIdRef.current) {
          return;
        }

        // Parse the candidate - handle various formats
        let candidateInit: RTCIceCandidateInit;
        try {
          if (typeof payload.candidate === 'string') {
            // Try to parse as JSON first (it was JSON.stringify'd when sent)
            try {
              const parsed = JSON.parse(payload.candidate);
              // The parsed object might have the candidate string nested
              candidateInit = {
                candidate: parsed.candidate || payload.candidate,
                sdpMid: parsed.sdpMid ?? payload.sdpMid ?? '0',
                sdpMLineIndex: parsed.sdpMLineIndex ?? payload.sdpMLineIndex ?? 0,
              };
            } catch {
              // If not JSON, use as raw candidate string
              candidateInit = {
                candidate: payload.candidate,
                sdpMid: payload.sdpMid ?? '0',
                sdpMLineIndex: payload.sdpMLineIndex ?? 0,
              };
            }
          } else if (payload.candidate && typeof payload.candidate === 'object') {
            // Already an object
            const c = payload.candidate as { candidate?: string; sdpMid?: string; sdpMLineIndex?: number };
            candidateInit = {
              candidate: c.candidate || '',
              sdpMid: c.sdpMid ?? payload.sdpMid ?? '0',
              sdpMLineIndex: c.sdpMLineIndex ?? payload.sdpMLineIndex ?? 0,
            };
          } else {
            console.warn('[useCall] Invalid candidate format');
            return;
          }
        } catch (parseErr) {
          console.warn('[useCall] Failed to parse ICE candidate:', parseErr);
          return;
        }

        // Skip empty candidates (end-of-candidates signal)
        if (!candidateInit.candidate || candidateInit.candidate.trim() === '') {
          return;
        }

        const pc = peerConnectionRef.current;
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
          } catch (err) {
            // ICE candidate errors are often non-fatal in WebRTC
            // The connection can still establish with remaining candidates
          }
        } else {
          // Queue for later when remote description is set
          pendingCandidatesRef.current.push(candidateInit);
        }
      }
    );

    return () => {
      cleanupIncoming();
      cleanupAnswered();
      cleanupRejected();
      cleanupEnded();
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
    };
  }, [cleanup, onIncomingCall, onCallEnded, onCallRejected, onCallBusy]);

  // Handle app backgrounding
  useEffect(() => {
    const appStateRef = { current: AppState.currentState };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      console.log('[useCall] App state changed:', previousState, '->', nextAppState);

      // App going to background
      if (nextAppState === 'background' && callStatus === 'connected') {
        console.log('[useCall] App backgrounded during active call');
        // Keep the call alive - WebRTC should maintain the connection
        // Audio will continue in background on iOS with proper background modes
        // On Android, the call should continue if properly configured

        // Optional: Disable video when backgrounded to save resources
        const stream = localStreamRef.current;
        if (stream && callType === 'video') {
          const videoTracks = stream.getVideoTracks();
          videoTracks.forEach((track) => {
            track.enabled = false;
            console.log('[useCall] Disabled video track (backgrounded)');
          });
        }
      }

      // App coming to foreground
      if (previousState === 'background' && nextAppState === 'active') {
        console.log('[useCall] App foregrounded');

        // Check if call is still connected
        const pc = peerConnectionRef.current;
        if (pc && (callStatus === 'connected' || callStatus === 'connecting')) {
          const iceState = pc.iceConnectionState;
          console.log('[useCall] Call state on foreground:', iceState);

          // Re-enable video if it was a video call
          if (callType === 'video' && isCameraOn) {
            const stream = localStreamRef.current;
            if (stream) {
              const videoTracks = stream.getVideoTracks();
              videoTracks.forEach((track) => {
                track.enabled = true;
                console.log('[useCall] Re-enabled video track (foregrounded)');
              });
            }
          }

          // If connection was lost while in background, try to reconnect
          if (iceState === 'disconnected' || iceState === 'failed') {
            console.log('[useCall] Connection lost while backgrounded, attempting reconnect');
            onCallDisconnected?.();
          }
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
    };
  }, [callStatus, callType, isCameraOn, onCallDisconnected]);

  // Track mounted state and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      console.log('[useCall] Component unmounting, cleaning up');
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  return {
    callStatus,
    callType,
    roomId,
    callId,
    remoteUserId,
    remoteUsername,
    localStream,
    remoteStream,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    callDuration,
    error,
    connectionQuality,
    isReconnecting,
    reconnectAttempt,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleCamera,
    toggleSpeaker,
    switchCamera,
    reconnect,
  };
};

export default useCall;
