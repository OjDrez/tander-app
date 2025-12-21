/**
 * Active Call Context
 * Manages WebRTC call state globally so calls persist when navigating away
 * Users can minimize calls and return to them from anywhere in the app
 *
 * IMPORTANT: Duration tracking is handled ONLY in useCall hook to prevent
 * duplicate timers. This context only stores the duration value.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { MediaStream, RTCPeerConnection } from 'react-native-webrtc';
import { CallType, CallStatus } from '@/src/types/chat';
import { callLogger } from '@/src/utility/logger';

export interface ActiveCallData {
  roomId: string;
  callId?: number;
  userId: number;
  username: string;
  callType: CallType;
  callerName?: string;
  isIncoming: boolean;
  startTime: number;
}

export interface ActiveCallContextType {
  // Call metadata
  activeCall: ActiveCallData | null;
  callStatus: CallStatus;
  hasActiveCall: boolean;

  // WebRTC state
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Call control state
  isMuted: boolean;
  isCameraOn: boolean;
  isSpeakerOn: boolean;
  callDuration: number;

  // Actions
  setActiveCall: (call: ActiveCallData | null) => void;
  updateCallStatus: (status: CallStatus) => void;
  clearActiveCall: () => void;

  // WebRTC state setters (called by useCall hook)
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setIsMuted: (muted: boolean) => void;
  setIsCameraOn: (on: boolean) => void;
  setIsSpeakerOn: (on: boolean) => void;
  setCallDuration: (duration: number) => void;

  // Flag to know if returning to an existing call
  isReturningToCall: boolean;
  setIsReturningToCall: (returning: boolean) => void;
}

const ActiveCallContext = createContext<ActiveCallContextType | undefined>(undefined);

interface ActiveCallProviderProps {
  children: ReactNode;
}

export function ActiveCallProvider({ children }: ActiveCallProviderProps) {
  // Call metadata
  const [activeCall, setActiveCallState] = useState<ActiveCallData | null>(null);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');

  // WebRTC state - persists across screen navigation
  const [peerConnection, setPeerConnectionState] = useState<RTCPeerConnection | null>(null);
  const [localStream, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStreamState] = useState<MediaStream | null>(null);

  // Call control state
  const [isMuted, setIsMutedState] = useState(false);
  const [isCameraOn, setIsCameraOnState] = useState(true);
  const [isSpeakerOn, setIsSpeakerOnState] = useState(true);
  // Duration is set by useCall hook timer - NO timer here to avoid duplicates
  const [callDuration, setCallDurationState] = useState(0);

  // Flag for returning to call
  const [isReturningToCall, setIsReturningToCallState] = useState(false);

  const setActiveCall = useCallback((call: ActiveCallData | null) => {
    callLogger.debug('Setting active call:', call?.roomId || 'null');
    setActiveCallState(call);
    if (call && callStatus === 'idle') {
      setCallStatus('calling');
    }
  }, [callStatus]);

  const updateCallStatus = useCallback((status: CallStatus) => {
    callLogger.debug('Updating call status:', status);
    setCallStatus(status);
  }, []);

  const clearActiveCall = useCallback(() => {
    callLogger.debug('Clearing active call');

    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          callLogger.debug('Error stopping remote track:', e);
        }
      });
    }

    // Stop local stream tracks
    if (localStream) {
      localStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          callLogger.debug('Error stopping local track:', e);
        }
      });
    }

    // Remove event listeners and close peer connection
    if (peerConnection) {
      try {
        // Remove all event listeners to prevent memory leaks
        peerConnection.onicecandidate = null;
        peerConnection.oniceconnectionstatechange = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.onsignalingstatechange = null;
        peerConnection.ontrack = null;
        peerConnection.onnegotiationneeded = null;
        peerConnection.ondatachannel = null;
        peerConnection.onicegatheringstatechange = null;

        // Close the connection
        peerConnection.close();
      } catch (e) {
        callLogger.debug('Error closing peer connection:', e);
      }
    }

    // Reset all state
    setActiveCallState(null);
    setCallStatus('idle');
    setPeerConnectionState(null);
    setLocalStreamState(null);
    setRemoteStreamState(null);
    setIsMutedState(false);
    setIsCameraOnState(true);
    setIsSpeakerOnState(true);
    setCallDurationState(0);
    setIsReturningToCallState(false);
  }, [localStream, remoteStream, peerConnection]);

  const setPeerConnection = useCallback((pc: RTCPeerConnection | null) => {
    callLogger.debug('Setting peer connection:', pc ? 'exists' : 'null');
    setPeerConnectionState(pc);
  }, []);

  const setLocalStream = useCallback((stream: MediaStream | null) => {
    callLogger.debug('Setting local stream:', stream ? `${stream.getTracks().length} tracks` : 'null');
    setLocalStreamState(stream);
  }, []);

  const setRemoteStream = useCallback((stream: MediaStream | null) => {
    callLogger.debug('Setting remote stream:', stream ? `${stream.getTracks().length} tracks` : 'null');
    setRemoteStreamState(stream);
  }, []);

  const setIsMuted = useCallback((muted: boolean) => {
    setIsMutedState(muted);
  }, []);

  const setIsCameraOn = useCallback((on: boolean) => {
    setIsCameraOnState(on);
  }, []);

  const setIsSpeakerOn = useCallback((on: boolean) => {
    setIsSpeakerOnState(on);
  }, []);

  const setCallDuration = useCallback((duration: number) => {
    setCallDurationState(duration);
  }, []);

  const setIsReturningToCall = useCallback((returning: boolean) => {
    callLogger.debug('Setting isReturningToCall:', returning);
    setIsReturningToCallState(returning);
  }, []);

  const hasActiveCall = useMemo(() => {
    return activeCall !== null &&
      callStatus !== 'ended' &&
      callStatus !== 'rejected' &&
      callStatus !== 'missed' &&
      callStatus !== 'idle';
  }, [activeCall, callStatus]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<ActiveCallContextType>(() => ({
    // Call metadata
    activeCall,
    callStatus,
    hasActiveCall,

    // WebRTC state
    peerConnection,
    localStream,
    remoteStream,

    // Call control state
    isMuted,
    isCameraOn,
    isSpeakerOn,
    callDuration,

    // Actions
    setActiveCall,
    updateCallStatus,
    clearActiveCall,

    // WebRTC state setters
    setPeerConnection,
    setLocalStream,
    setRemoteStream,
    setIsMuted,
    setIsCameraOn,
    setIsSpeakerOn,
    setCallDuration,

    // Return to call flag
    isReturningToCall,
    setIsReturningToCall,
  }), [
    activeCall,
    callStatus,
    hasActiveCall,
    peerConnection,
    localStream,
    remoteStream,
    isMuted,
    isCameraOn,
    isSpeakerOn,
    callDuration,
    setActiveCall,
    updateCallStatus,
    clearActiveCall,
    setPeerConnection,
    setLocalStream,
    setRemoteStream,
    setIsMuted,
    setIsCameraOn,
    setIsSpeakerOn,
    setCallDuration,
    isReturningToCall,
    setIsReturningToCall,
  ]);

  return (
    <ActiveCallContext.Provider value={contextValue}>
      {children}
    </ActiveCallContext.Provider>
  );
}

export function useActiveCall(): ActiveCallContextType {
  const context = useContext(ActiveCallContext);
  if (context === undefined) {
    throw new Error('useActiveCall must be used within an ActiveCallProvider');
  }
  return context;
}

export default ActiveCallContext;
