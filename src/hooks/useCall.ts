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
} from '../services/callService';
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
import {
  initializeCallAudio,
  setAudioToSpeaker,
  setAudioToEarpiece,
  cleanupCallAudio,
  isSpeakerEnabled,
} from '../utility/audioManager';
import {
  getIceServers,
  getIceServersAsync,
  CALL_TIMEOUTS,
  QUALITY_THRESHOLDS,
  MAX_ICE_RESTART_ATTEMPTS,
  getMediaConstraints,
} from '../config/webrtc';
import { webrtcLogger as logger } from '../utility/logger';

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

// Import ActiveCallContext type
interface ActiveCallContextType {
  activeCall: any;
  callStatus: CallStatus;
  hasActiveCall: boolean;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeakerOn: boolean;
  callDuration: number;
  isReturningToCall: boolean;
  setActiveCall: (call: any) => void;
  updateCallStatus: (status: CallStatus) => void;
  clearActiveCall: () => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsMuted: (muted: boolean) => void;
  setIsCameraOn: (on: boolean) => void;
  setIsSpeakerOn: (on: boolean) => void;
  setCallDuration: (duration: number) => void;
  setIsReturningToCall: (returning: boolean) => void;
}

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
  // Optional context for syncing state globally
  activeCallContext?: ActiveCallContextType;
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
    activeCallContext,
  } = options;

  // Check if we're returning to an existing call
  const isReturningToExistingCall = activeCallContext?.isReturningToCall &&
    activeCallContext?.peerConnection !== null;

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
  const isMountedRef = useRef(true);

  // Additional refs for enhanced reliability
  const offerResendCountRef = useRef(0);
  const offerResendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const candidateBatchRef = useRef<RTCIceCandidateInit[]>([]);
  const candidateBatchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionEstablishedRef = useRef(false);
  const remoteDescriptionSetRef = useRef(false);

  // Sync state with context when returning to existing call
  useEffect(() => {
    if (isReturningToExistingCall && activeCallContext) {
      logger.debug('[useCall] Returning to existing call - restoring state from context');

      // Restore peer connection reference
      if (activeCallContext.peerConnection) {
        peerConnectionRef.current = activeCallContext.peerConnection;
      }

      // Restore streams
      if (activeCallContext.localStream) {
        localStreamRef.current = activeCallContext.localStream;
        setLocalStream(activeCallContext.localStream);
      }

      if (activeCallContext.remoteStream) {
        setRemoteStream(activeCallContext.remoteStream);
      }

      // Restore call state
      setCallStatus(activeCallContext.callStatus);
      setIsMuted(activeCallContext.isMuted);
      setIsCameraOn(activeCallContext.isCameraOn);
      setIsSpeakerOn(activeCallContext.isSpeakerOn);
      setCallDuration(activeCallContext.callDuration);

      // Restore room ID from active call data
      if (activeCallContext.activeCall?.roomId) {
        setRoomId(activeCallContext.activeCall.roomId);
        roomIdRef.current = activeCallContext.activeCall.roomId;
      }

      // Mark as already connected
      connectionEstablishedRef.current = true;
      isInitializedRef.current = true;
      hasAcceptedRef.current = true;
    }
  }, [isReturningToExistingCall, activeCallContext]);

  // Sync local state changes to context (for persistence when navigating away)
  useEffect(() => {
    if (activeCallContext && !isReturningToExistingCall) {
      // Sync peer connection
      if (peerConnectionRef.current !== activeCallContext.peerConnection) {
        activeCallContext.setPeerConnection(peerConnectionRef.current);
      }
    }
  }, [activeCallContext, isReturningToExistingCall]);

  // Sync local stream to context
  useEffect(() => {
    if (activeCallContext && localStream && !isReturningToExistingCall) {
      activeCallContext.setLocalStream(localStream);
    }
  }, [activeCallContext, localStream, isReturningToExistingCall]);

  // Sync remote stream to context
  useEffect(() => {
    if (activeCallContext && remoteStream && !isReturningToExistingCall) {
      activeCallContext.setRemoteStream(remoteStream);
    }
  }, [activeCallContext, remoteStream, isReturningToExistingCall]);

  // Sync mute state to context
  useEffect(() => {
    if (activeCallContext && !isReturningToExistingCall) {
      activeCallContext.setIsMuted(isMuted);
    }
  }, [activeCallContext, isMuted, isReturningToExistingCall]);

  // Sync camera state to context
  useEffect(() => {
    if (activeCallContext && !isReturningToExistingCall) {
      activeCallContext.setIsCameraOn(isCameraOn);
    }
  }, [activeCallContext, isCameraOn, isReturningToExistingCall]);

  // Sync speaker state to context
  useEffect(() => {
    if (activeCallContext && !isReturningToExistingCall) {
      activeCallContext.setIsSpeakerOn(isSpeakerOn);
    }
  }, [activeCallContext, isSpeakerOn, isReturningToExistingCall]);

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

      logger.debug('[useCall] Initializing as receiver:', initialIncomingCall);

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
      logger.debug('[useCall] Getting local media for type:', type);
      const isVideo = type === 'video';

      // Initialize audio manager for call
      await initializeCallAudio(isVideo);

      // Use enhanced constraints for better call quality
      // Note: react-native-webrtc supports limited audio constraints
      // Cast to any to avoid TypeScript issues with react-native-webrtc types
      const constraints: any = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: isVideo ? {
          facingMode: 'user',
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          frameRate: { ideal: 24, max: 30 },
        } : false,
      };
      logger.debug('[useCall] Media constraints:', JSON.stringify(constraints));
      logger.debug('[useCall] Enhanced audio: echoCancellation, noiseSuppression, autoGainControl enabled');

      const stream = await mediaDevices.getUserMedia(constraints);

      // Check if component is still mounted
      if (!isMountedRef.current) {
        logger.debug('[useCall] Component unmounted during media acquisition, stopping tracks');
        stream.getTracks().forEach((track) => track.stop());
        return null;
      }

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      logger.debug('[useCall] Got local media stream:', stream.id);
      logger.debug('[useCall] Video tracks:', videoTracks.length, 'Audio tracks:', audioTracks.length);
      if (videoTracks.length > 0) {
        logger.debug('[useCall] Video track settings:', JSON.stringify(videoTracks[0].getSettings()));
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      logger.debug('[useCall] Local stream set to state');
      return stream;
    } catch (err) {
      logger.error('[useCall] Failed to get local media:', err);
      if (isMountedRef.current) {
        setError('Failed to access camera/microphone. Please check permissions.');
      }
      return null;
    }
  }, []);

  const stopLocalMedia = useCallback(() => {
    logger.debug('[useCall] Stopping local media');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        track.stop();
        logger.debug('[useCall] Stopped track:', track.kind);
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
        logger.debug('[useCall] Connection timeout reached, ICE state:', pc.iceConnectionState);

        if (iceRestartAttemptRef.current < MAX_ICE_RESTART_ATTEMPTS && pc.signalingState !== 'closed') {
          iceRestartAttemptRef.current++;
          logger.debug('[useCall] Attempting ICE restart', iceRestartAttemptRef.current, 'of', MAX_ICE_RESTART_ATTEMPTS);
          setError(`Connection slow, retrying... (${iceRestartAttemptRef.current}/${MAX_ICE_RESTART_ATTEMPTS})`);

          try {
            // Restart ICE
            pc.restartIce();

            // If we're the caller, create a new offer with ICE restart
            if (isCallerRef.current && pc.signalingState === 'have-local-offer') {
              logger.debug('[useCall] Creating new offer for ICE restart');
              const offer = await pc.createOffer({ iceRestart: true });
              await pc.setLocalDescription(offer);
              if (offer.sdp) {
                sendOffer(currentRoomId, offer.sdp, 'offer');
              }
            }

            // Restart the timeout
            startConnectionTimeout(pc, currentRoomId);
          } catch (err) {
            logger.error('[useCall] ICE restart failed:', err);
          }
        } else {
          logger.debug('[useCall] Max ICE restart attempts reached');
          setError('Connection failed. Please check your network and try again.');
          setCallStatus('ended');
          onCallDisconnected?.();
        }
      }
    }, CALL_TIMEOUTS.CONNECTION_TIMEOUT);
  }, [clearConnectionTimeout, onCallDisconnected]);

  /**
   * Batch and send ICE candidates for more reliable delivery
   */
  const flushCandidateBatch = useCallback((currentRoomId: string) => {
    if (candidateBatchRef.current.length === 0) return;

    const candidates = [...candidateBatchRef.current];
    candidateBatchRef.current = [];

    logger.debug('[useCall] Flushing', candidates.length, 'batched ICE candidates');
    candidates.forEach(candidate => {
      sendIceCandidate(
        currentRoomId,
        JSON.stringify(candidate),
        candidate.sdpMid || '',
        candidate.sdpMLineIndex || 0
      );
    });
  }, []);

  /**
   * Queue ICE candidate with batching for reliability
   */
  const queueIceCandidate = useCallback((candidate: any, currentRoomId: string) => {
    const candidateInit: RTCIceCandidateInit = {
      candidate: candidate.candidate,
      sdpMid: candidate.sdpMid || '',
      sdpMLineIndex: candidate.sdpMLineIndex || 0,
    };

    candidateBatchRef.current.push(candidateInit);

    // Clear existing timer
    if (candidateBatchTimerRef.current) {
      clearTimeout(candidateBatchTimerRef.current);
    }

    // Set timer to flush batch
    candidateBatchTimerRef.current = setTimeout(() => {
      flushCandidateBatch(currentRoomId);
    }, CALL_TIMEOUTS.CANDIDATE_BATCH_DELAY);
  }, [flushCandidateBatch]);

  const createPeerConnection = useCallback(async (currentRoomId: string): Promise<RTCPeerConnection> => {
    logger.debug('[useCall] Creating peer connection for room:', currentRoomId);

    // Reset counters for new connection
    iceRestartAttemptRef.current = 0;
    offerResendCountRef.current = 0;
    connectionEstablishedRef.current = false;
    remoteDescriptionSetRef.current = false;

    // Close existing connection if any
    if (peerConnectionRef.current) {
      logger.debug('[useCall] Closing existing peer connection');
      // Remove event listeners before closing to prevent memory leaks
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onicegatheringstatechange = null;
      peerConnectionRef.current.close();
    }

    // Clear any pending timers
    if (offerResendTimerRef.current) {
      clearTimeout(offerResendTimerRef.current);
      offerResendTimerRef.current = null;
    }
    if (candidateBatchTimerRef.current) {
      clearTimeout(candidateBatchTimerRef.current);
      candidateBatchTimerRef.current = null;
    }
    candidateBatchRef.current = [];

    // Fetch fresh TURN credentials for best connection reliability
    const iceServers = await getIceServersAsync();

    // Use aggressive ICE policy for faster connection
    const pc = new RTCPeerConnection({
      iceServers,
      iceCandidatePoolSize: 10, // Pre-fetch ICE candidates for faster connection
      bundlePolicy: 'max-bundle',
      rtcpMuxPolicy: 'require',
    });

    // @ts-ignore - react-native-webrtc types don't perfectly match web WebRTC types
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        // Use batching for more reliable delivery
        logger.debug('[useCall] Queueing ICE candidate:', event.candidate.candidate?.substring(0, 50));
        queueIceCandidate(event.candidate, currentRoomId);
      } else {
        logger.debug('[useCall] ICE gathering complete');
        // Flush any remaining candidates
        flushCandidateBatch(currentRoomId);
      }
    };

    // @ts-ignore - react-native-webrtc types
    pc.onicegatheringstatechange = () => {
      logger.debug('[useCall] ICE gathering state:', pc.iceGatheringState);
    };

    // @ts-ignore - react-native-webrtc types
    pc.oniceconnectionstatechange = () => {
      logger.debug('[useCall] ICE connection state:', pc.iceConnectionState);
      switch (pc.iceConnectionState) {
        case 'new':
          logger.debug('[useCall] ICE connection: new');
          setConnectionQuality('unknown');
          break;
        case 'checking':
          logger.debug('[useCall] ICE connection: checking...');
          setCallStatus('connecting');
          setConnectionQuality('unknown');
          // Start connection timeout when we begin checking
          startConnectionTimeout(pc, currentRoomId);
          break;
        case 'connected':
          logger.debug('[useCall] ICE connection: CONNECTED!');
          clearConnectionTimeout();
          iceRestartAttemptRef.current = 0;
          offerResendCountRef.current = 0;
          connectionEstablishedRef.current = true;
          // Clear offer resend timer since connection is established
          if (offerResendTimerRef.current) {
            clearTimeout(offerResendTimerRef.current);
            offerResendTimerRef.current = null;
          }
          setError(null); // Clear any retry error messages
          setCallStatus('connected');
          setIsReconnecting(false);
          setReconnectAttempt(0);
          startDurationTimer();
          startQualityMonitor();
          break;
        case 'completed':
          logger.debug('[useCall] ICE connection: COMPLETED!');
          clearConnectionTimeout();
          iceRestartAttemptRef.current = 0;
          offerResendCountRef.current = 0;
          connectionEstablishedRef.current = true;
          // Clear offer resend timer since connection is established
          if (offerResendTimerRef.current) {
            clearTimeout(offerResendTimerRef.current);
            offerResendTimerRef.current = null;
          }
          setError(null);
          setCallStatus('connected');
          setIsReconnecting(false);
          setReconnectAttempt(0);
          startDurationTimer();
          startQualityMonitor();
          break;
        case 'disconnected':
          logger.debug('[useCall] ICE connection: disconnected (may reconnect)');
          setConnectionQuality('poor');
          // Give WebRTC time to auto-recover before taking action
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            if (pc.iceConnectionState === 'disconnected') {
              logger.debug('[useCall] Still disconnected after timeout, attempting ICE restart');
              // Try ICE restart first
              if (pc.signalingState !== 'closed' && iceRestartAttemptRef.current < MAX_ICE_RESTART_ATTEMPTS) {
                iceRestartAttemptRef.current++;
                pc.restartIce();
              } else {
                onCallDisconnected?.();
              }
            }
          }, CALL_TIMEOUTS.ICE_RESTART_DELAY);
          break;
        case 'failed':
          logger.debug('[useCall] ICE connection: FAILED');
          clearConnectionTimeout();
          setConnectionQuality('poor');
          stopQualityMonitor();

          // Try ICE restart before giving up
          if (pc.signalingState !== 'closed' && iceRestartAttemptRef.current < MAX_ICE_RESTART_ATTEMPTS) {
            iceRestartAttemptRef.current++;
            logger.debug('[useCall] Attempting ICE restart after failure', iceRestartAttemptRef.current);
            setError(`Connection failed, retrying... (${iceRestartAttemptRef.current}/${MAX_ICE_RESTART_ATTEMPTS})`);

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
          logger.debug('[useCall] ICE connection: closed');
          clearConnectionTimeout();
          stopQualityMonitor();
          break;
      }
    };

    // @ts-ignore - react-native-webrtc types
    pc.onconnectionstatechange = () => {
      logger.debug('[useCall] Connection state:', pc.connectionState);
      // Also check connection state as a fallback
      if (pc.connectionState === 'connected') {
        logger.debug('[useCall] Connection state CONNECTED - setting call as connected');
        clearConnectionTimeout();
        setError(null);
        setCallStatus('connected');
        startDurationTimer();
      } else if (pc.connectionState === 'failed') {
        // Handle connection state failed (some browsers report this instead of ICE failed)
        if (iceRestartAttemptRef.current < MAX_ICE_RESTART_ATTEMPTS && pc.signalingState !== 'closed') {
          iceRestartAttemptRef.current++;
          logger.debug('[useCall] Connection failed, attempting restart', iceRestartAttemptRef.current);
          pc.restartIce();
        }
      }
    };

    // @ts-ignore - react-native-webrtc types
    pc.onsignalingstatechange = () => {
      logger.debug('[useCall] Signaling state:', pc.signalingState);
    };

    // @ts-ignore - react-native-webrtc types
    pc.ontrack = (event: any) => {
      logger.debug('[useCall] Received remote track:', event.track.kind, 'readyState:', event.track.readyState);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        logger.debug('[useCall] Setting remote stream, tracks:', stream.getTracks().length);
        setRemoteStream(stream);

        // If we're receiving tracks, we're definitely connected
        // This is a reliable fallback for connection detection
        if (stream.getTracks().length > 0) {
          logger.debug('[useCall] Remote tracks received - connection confirmed');
          clearConnectionTimeout();
          setError(null);
          setCallStatus('connected');
          startDurationTimer();
        }
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, [onCallDisconnected, startConnectionTimeout, clearConnectionTimeout, queueIceCandidate, flushCandidateBatch]);

  const addLocalTracksToConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    logger.debug('[useCall] Adding local tracks to connection');
    stream.getTracks().forEach((track) => {
      logger.debug('[useCall] Adding track:', track.kind);
      pc.addTrack(track, stream);
    });
  }, []);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) return;
    logger.debug('[useCall] Starting duration timer');
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => {
        const newDuration = prev + 1;
        // Sync to context if available (context doesn't have its own timer)
        if (activeCallContext) {
          activeCallContext.setCallDuration(newDuration);
        }
        return newDuration;
      });
    }, 1000);
  }, [activeCallContext]);

  /**
   * Monitor connection quality using WebRTC stats
   */
  const startQualityMonitor = useCallback(() => {
    if (qualityMonitorRef.current) return;
    logger.debug('[useCall] Starting connection quality monitor');

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
        logger.debug('[useCall] Connection quality:', quality, 'packetLoss:', (packetLoss * 100).toFixed(1) + '%', 'rtt:', roundTripTime.toFixed(0) + 'ms');
      } catch (err) {
        logger.warn('[useCall] Failed to get stats:', err);
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
    if (offerResendTimerRef.current) {
      clearTimeout(offerResendTimerRef.current);
      offerResendTimerRef.current = null;
    }
    if (candidateBatchTimerRef.current) {
      clearTimeout(candidateBatchTimerRef.current);
      candidateBatchTimerRef.current = null;
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
    clearConnectionTimeout();
  }, [clearConnectionTimeout]);

  const cleanup = useCallback(async (preserveCallData: boolean = false) => {
    logger.debug('[useCall] Cleaning up call resources, preserveCallData:', preserveCallData);

    clearAllTimeouts();
    stopQualityMonitor();

    if (peerConnectionRef.current) {
      // Remove all event listeners before closing to prevent memory leaks
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.oniceconnectionstatechange = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.onsignalingstatechange = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onnegotiationneeded = null;
      peerConnectionRef.current.ondatachannel = null;
      peerConnectionRef.current.onicegatheringstatechange = null;

      try {
        peerConnectionRef.current.close();
      } catch (e) {
        logger.debug('[useCall] Error closing peer connection:', e);
      }
      peerConnectionRef.current = null;
    }

    stopLocalMedia();

    // Clean up audio manager
    await cleanupCallAudio();

    setRemoteStream(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsCameraOn(true);
    setIsSpeakerOn(true); // Reset speaker state
    setError(null);
    setConnectionQuality('unknown');
    setIsReconnecting(false);
    setReconnectAttempt(0);
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    hasAcceptedRef.current = false;
    iceRestartAttemptRef.current = 0;

    // Reset enhanced reliability refs
    offerResendCountRef.current = 0;
    lastOfferRef.current = null;
    candidateBatchRef.current = [];
    connectionEstablishedRef.current = false;
    remoteDescriptionSetRef.current = false;

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

    logger.debug('[useCall] Starting ring timeout:', CALL_TIMEOUTS.RING_TIMEOUT, 'ms');
    ringTimeoutRef.current = setTimeout(() => {
      logger.debug('[useCall] Call timed out - no answer');
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
        logger.debug('[useCall] Starting call to user:', targetUserId, 'type:', type);
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
        logger.debug('[useCall] Initiating call on server');
        const result = await initiateCall(targetUserId, type, callerName);

        if (!result.success || !result.roomId) {
          logger.error('[useCall] Failed to initiate call:', result.error);
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
        const pc = await createPeerConnection(callRoomId);
        addLocalTracksToConnection(pc, stream);

        // Step 4: Create and send offer with robust resend logic
        // Wait a short moment for the receiver to receive the incoming-call event
        // and join the room before we send the offer
        logger.debug('[useCall] Creating offer');
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: type === 'video',
        });
        await pc.setLocalDescription(offer);

        if (offer.sdp) {
          // Store offer for potential resends
          lastOfferRef.current = offer;
          offerResendCountRef.current = 0;

          // Small delay to allow receiver to process incoming-call event
          await new Promise(resolve => setTimeout(resolve, CALL_TIMEOUTS.OFFER_RESEND_DELAY));
          logger.debug('[useCall] Sending initial offer');
          sendOffer(callRoomId, offer.sdp, 'offer');

          // Set up robust offer resend mechanism
          const scheduleOfferResend = () => {
            // Don't resend if connection is established or we've exceeded max attempts
            if (connectionEstablishedRef.current ||
                offerResendCountRef.current >= CALL_TIMEOUTS.MAX_OFFER_RESENDS ||
                !peerConnectionRef.current ||
                peerConnectionRef.current.signalingState === 'closed') {
              return;
            }

            offerResendTimerRef.current = setTimeout(() => {
              const pc = peerConnectionRef.current;
              if (pc && !connectionEstablishedRef.current &&
                  (pc.iceConnectionState === 'new' || pc.iceConnectionState === 'checking') &&
                  lastOfferRef.current?.sdp) {
                offerResendCountRef.current++;
                logger.debug('[useCall] Re-sending offer (attempt', offerResendCountRef.current, 'of', CALL_TIMEOUTS.MAX_OFFER_RESENDS, ')');
                sendOffer(callRoomId, lastOfferRef.current.sdp, 'offer');
                // Schedule next resend
                scheduleOfferResend();
              }
            }, CALL_TIMEOUTS.OFFER_RESEND_INTERVAL);
          };

          // Start the resend schedule
          scheduleOfferResend();
        }

        return true;
      } catch (err) {
        logger.error('[useCall] Failed to start call:', err);
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
        logger.error('[useCall] No incoming call data to accept');
        setError('No incoming call to accept');
        return false;
      }

      logger.debug('[useCall] Accepting call in room:', callData.roomId);
      setError(null);
      hasAcceptedRef.current = true;
      isCallerRef.current = false;

      // Step 1: Get local media FIRST (Messenger-like: show own camera)
      setCallStatus('connecting');
      const stream = await getLocalMedia(callData.callType);
      if (!stream) {
        logger.error('[useCall] Failed to get local media');
        setCallStatus('idle');
        return false;
      }

      // Step 2: Notify server we accepted
      logger.debug('[useCall] Notifying server of call acceptance');
      const result = await answerCall(callData.roomId);
      if (!result.success) {
        logger.error('[useCall] Failed to answer call on server:', result.error);
        stopLocalMedia();
        setCallStatus('idle');
        setError(result.error || 'Failed to answer call');
        return false;
      }

      // Step 3: Create peer connection and add tracks
      const pc = await createPeerConnection(callData.roomId);
      addLocalTracksToConnection(pc, stream);

      // Step 4: Process pending offer if available
      const pendingOffer = pendingOfferRef.current;
      if (pendingOffer) {
        logger.debug('[useCall] Processing pending offer');
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'offer', sdp: pendingOffer.sdp })
          );

          logger.debug('[useCall] Creating answer');
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          if (answer.sdp) {
            logger.debug('[useCall] Sending answer');
            sendAnswer(callData.roomId, answer.sdp, 'answer');
          }

          // Process pending ICE candidates
          logger.debug('[useCall] Processing', pendingCandidatesRef.current.length, 'pending ICE candidates');
          for (const candidateInit of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
              logger.debug('[useCall] Added pending ICE candidate');
            } catch (iceErr) {
              // ICE candidate errors are often non-fatal
              logger.debug('[useCall] Pending ICE candidate result:', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
          pendingOfferRef.current = null;
        } catch (offerErr) {
          logger.error('[useCall] Failed to process pending offer:', offerErr);
          setError('Failed to establish connection');
        }
      } else {
        logger.debug('[useCall] No pending offer yet, waiting for offer...');
      }

      return true;
    } catch (err) {
      logger.error('[useCall] Failed to accept call:', err);
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
      logger.debug('[useCall] Declining call, reason:', reason);
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
      logger.debug('[useCall] Hanging up call, reason:', reason);
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
      logger.error('[useCall] No call data available for reconnection');
      setError('Cannot reconnect - no previous call data');
      return false;
    }

    if (reconnectAttempt >= CALL_TIMEOUTS.RECONNECT_ATTEMPTS) {
      logger.error('[useCall] Max reconnection attempts reached');
      setError('Failed to reconnect after multiple attempts');
      cleanup();
      return false;
    }

    const attempt = reconnectAttempt + 1;
    setReconnectAttempt(attempt);
    setIsReconnecting(true);
    setError(null);

    logger.debug('[useCall] Reconnection attempt', attempt, 'of', CALL_TIMEOUTS.RECONNECT_ATTEMPTS);
    onReconnecting?.(attempt);

    // Close existing peer connection if any
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    try {
      // Exponential backoff: 1s, 2s, 4s
      const delay = 1000 * Math.pow(2, attempt - 1);
      logger.debug('[useCall] Waiting', delay, 'ms before reconnection');
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Start a new call to the same user
      const success = await startCall(
        callData.targetUserId,
        callData.callType,
        callData.callerName
      );

      if (success) {
        logger.debug('[useCall] Reconnection successful');
        setIsReconnecting(false);
        onReconnected?.();
        return true;
      } else {
        logger.debug('[useCall] Reconnection failed, will retry');
        // Retry recursively
        return reconnect();
      }
    } catch (err) {
      logger.error('[useCall] Reconnection error:', err);
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
        logger.debug('[useCall] Audio track enabled:', track.enabled);
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
        logger.debug('[useCall] Video track enabled:', track.enabled);
      });
      setIsCameraOn((prev) => !prev);
    }
  }, []);

  const toggleSpeaker = useCallback(async () => {
    try {
      const currentSpeakerState = isSpeakerEnabled();
      if (currentSpeakerState) {
        // Currently on speaker, switch to earpiece
        await setAudioToEarpiece();
        setIsSpeakerOn(false);
        logger.debug('[useCall] Switched to earpiece');
      } else {
        // Currently on earpiece, switch to speaker
        await setAudioToSpeaker();
        setIsSpeakerOn(true);
        logger.debug('[useCall] Switched to speaker');
      }
    } catch (error) {
      logger.error('[useCall] Failed to toggle speaker:', error);
      // Fallback to just updating state
      setIsSpeakerOn((prev) => !prev);
    }
  }, []);

  const switchCamera = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream && callType === 'video') {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        // @ts-ignore - _switchCamera exists on mobile
        videoTrack._switchCamera?.();
        logger.debug('[useCall] Switched camera');
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
          logger.debug('[useCall] User is busy - rejecting incoming call from:', payload.callerUsername);
          // Reject the call with 'busy' reason
          rejectCall(payload.roomId, 'busy');
          // Notify the app about the missed call due to busy status
          onCallBusy?.(payload);
          return;
        }

        logger.debug('[useCall] Incoming call:', payload);
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

    // Receiver is ready - the right time to send/resend offer
    const cleanupReceiverReady = registerSocketListener<{ roomId: string; receiverId: number; receiverUsername: string; timestamp: number }>(
      'receiver-ready',
      async (payload) => {
        logger.debug('[useCall] Receiver ready:', payload);
        if (payload.roomId === roomIdRef.current && isCallerRef.current) {
          // Receiver is in the room and ready - send the offer now
          const pc = peerConnectionRef.current;
          if (pc && lastOfferRef.current?.sdp && !connectionEstablishedRef.current) {
            logger.debug('[useCall] Sending offer to ready receiver');
            sendOffer(payload.roomId, lastOfferRef.current.sdp, 'offer');
          }
        }
      }
    );

    // Call answered by receiver
    const cleanupAnswered = registerSocketListener<CallAnsweredPayload>(
      'call-answered',
      (payload) => {
        logger.debug('[useCall] Call answered:', payload);
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
        logger.debug('[useCall] Call rejected:', payload);
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
        logger.debug('[useCall] Call ended:', payload);
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
        logger.debug('[useCall] Received offer, senderId:', payload.senderId, 'myUserId:', myUserId);

        // Ignore our own offers
        if (payload.senderId === myUserId) {
          logger.debug('[useCall] Ignoring own offer');
          return;
        }

        // Check room match
        if (payload.roomId !== roomIdRef.current) {
          logger.debug('[useCall] Ignoring offer for different room');
          return;
        }

        // If we're the caller, ignore offers
        if (isCallerRef.current) {
          logger.debug('[useCall] Ignoring offer - we are the caller');
          return;
        }

        // If we haven't accepted yet, store for later
        if (!hasAcceptedRef.current) {
          logger.debug('[useCall] Storing offer for later (not yet accepted)');
          pendingOfferRef.current = payload;
          return;
        }

        // Process offer immediately
        logger.debug('[useCall] Processing offer immediately');
        const pc = peerConnectionRef.current;
        if (!pc) {
          logger.error('[useCall] No peer connection to process offer');
          return;
        }

        try {
          if (pc.signalingState !== 'stable') {
            logger.debug('[useCall] Cannot process offer - signaling state:', pc.signalingState);
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
              logger.debug('[useCall] Added pending ICE candidate (offer handler)');
            } catch (iceErr) {
              logger.debug('[useCall] Pending ICE candidate result (offer handler):', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          logger.error('[useCall] Failed to handle offer:', err);
        }
      }
    );

    // WebRTC answer from receiver
    const cleanupAnswer = registerSocketListener<AnswerPayload>(
      'receive-answer',
      async (payload) => {
        logger.debug('[useCall] Received answer, senderId:', payload.senderId, 'myUserId:', myUserId);

        // Ignore our own answers
        if (payload.senderId === myUserId) {
          logger.debug('[useCall] Ignoring own answer');
          return;
        }

        // Check room match
        if (payload.roomId !== roomIdRef.current) {
          logger.debug('[useCall] Ignoring answer for different room');
          return;
        }

        // Only caller should process answers
        if (!isCallerRef.current) {
          logger.debug('[useCall] Ignoring answer - we are not the caller');
          return;
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
          logger.error('[useCall] No peer connection to set answer');
          return;
        }

        try {
          if (pc.signalingState !== 'have-local-offer') {
            logger.debug('[useCall] Cannot set answer - signaling state:', pc.signalingState);
            return;
          }

          logger.debug('[useCall] Setting remote answer');
          await pc.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: payload.sdp })
          );

          // Process pending ICE candidates
          logger.debug('[useCall] Processing', pendingCandidatesRef.current.length, 'pending ICE candidates (answer handler)');
          for (const candidateInit of pendingCandidatesRef.current) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
              logger.debug('[useCall] Added pending ICE candidate (answer handler)');
            } catch (iceErr) {
              logger.debug('[useCall] Pending ICE candidate result (answer handler):', iceErr);
            }
          }
          pendingCandidatesRef.current = [];
        } catch (err) {
          logger.error('[useCall] Failed to handle answer:', err);
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
            logger.warn('[useCall] Invalid candidate format');
            return;
          }
        } catch (parseErr) {
          logger.warn('[useCall] Failed to parse ICE candidate:', parseErr);
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
      cleanupReceiverReady();
      cleanupAnswered();
      cleanupRejected();
      cleanupEnded();
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
    };
  }, [cleanup, onIncomingCall, onCallEnded, onCallRejected, onCallBusy, onCallTimeout, onCallDisconnected, onReconnecting, onReconnected]);

  // Handle app backgrounding
  // Track if camera was on before backgrounding
  const cameraWasOnBeforeBackgroundRef = useRef(true);

  useEffect(() => {
    const appStateRef = { current: AppState.currentState };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      logger.debug('[useCall] App state changed:', previousState, '->', nextAppState);

      // App going to background
      if (nextAppState === 'background' && callStatus === 'connected') {
        logger.debug('[useCall] App backgrounded during active call');
        // Keep the call alive - WebRTC should maintain the connection
        // Audio will continue in background on iOS with proper background modes
        // On Android, the call should continue if properly configured

        // Disable video when backgrounded to save resources
        const stream = localStreamRef.current;
        if (stream && callType === 'video') {
          const videoTracks = stream.getVideoTracks();
          // Remember if camera was on before backgrounding
          cameraWasOnBeforeBackgroundRef.current = isCameraOn;
          videoTracks.forEach((track) => {
            track.enabled = false;
            logger.debug('[useCall] Disabled video track (backgrounded)');
          });
          // Update state to reflect actual track state
          setIsCameraOn(false);
        }
      }

      // App coming to foreground
      if (previousState === 'background' && nextAppState === 'active') {
        logger.debug('[useCall] App foregrounded');

        // Check if call is still connected
        const pc = peerConnectionRef.current;
        if (pc && (callStatus === 'connected' || callStatus === 'connecting')) {
          const iceState = pc.iceConnectionState;
          logger.debug('[useCall] Call state on foreground:', iceState);

          // Re-enable video if it was on before backgrounding
          if (callType === 'video' && cameraWasOnBeforeBackgroundRef.current) {
            const stream = localStreamRef.current;
            if (stream) {
              const videoTracks = stream.getVideoTracks();
              videoTracks.forEach((track) => {
                track.enabled = true;
                logger.debug('[useCall] Re-enabled video track (foregrounded)');
              });
              setIsCameraOn(true);
            }
          }

          // If connection was lost while in background, try to reconnect
          if (iceState === 'disconnected' || iceState === 'failed') {
            logger.debug('[useCall] Connection lost while backgrounded, attempting reconnect');
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
  // BUT: Don't cleanup if there's an active call (user just navigated away)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;

      // Check if there's an active call - if so, don't cleanup (user is just minimizing)
      const hasActiveCallInContext = activeCallContext?.hasActiveCall;
      const callIsActive = callStatus === 'connected' || callStatus === 'connecting' ||
        callStatus === 'calling' || callStatus === 'ringing';

      if (hasActiveCallInContext && callIsActive) {
        logger.debug('[useCall] Component unmounting but call is active - NOT cleaning up (call minimized)');
        // Don't cleanup - call continues in background
      } else {
        logger.debug('[useCall] Component unmounting, cleaning up');
        cleanup();
      }
    };
  }, [cleanup, activeCallContext, callStatus]);

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
