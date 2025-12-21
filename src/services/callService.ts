/**
 * Call Service
 * Uses Raw WebSocket for Azure deployment.
 */

import { wsService } from './websocket';

// Types
export type CallType = 'video' | 'audio';
export type MessageCallback = (payload: any) => void;

/**
 * Get current user ID
 */
export const getCurrentUserId = (): number | null => {
  return wsService.getCurrentUserId();
};

/**
 * Get current username
 */
export const getCurrentUsername = (): string | null => {
  return wsService.getCurrentUsername();
};

/**
 * Generate call room ID
 */
export const generateCallRoomId = (userId1: number, userId2: number): string => {
  const minId = Math.min(userId1, userId2);
  const maxId = Math.max(userId1, userId2);
  return `call_${minId}_${maxId}`;
};

/**
 * Check if a user is currently online
 * Uses the WebSocket's tracked online users set
 */
export const isUserOnline = (userId: number): boolean => {
  return wsService.isUserOnline(userId);
};

/**
 * Initiate a call
 */
export const initiateCall = async (
  targetUserId: number,
  callType: CallType,
  callerName?: string
): Promise<{ success: boolean; roomId?: string; callId?: number; error?: string }> => {
  console.log('[CALL] initiateCall: targetUserId=', targetUserId, 'callType=', callType, 'callerName=', callerName);

  try {
    const userId = wsService.getCurrentUserId();
    console.log('[CALL] Current user ID:', userId, 'WS connected:', wsService.isConnected());

    if (!userId) {
      console.error('[CALL] User not authenticated - getCurrentUserId returned null');
      return { success: false, error: 'User not authenticated' };
    }

    if (!wsService.isConnected()) {
      console.error('[CALL] WebSocket not connected');
      return { success: false, error: 'WebSocket not connected' };
    }

    const roomId = generateCallRoomId(userId, targetUserId);
    console.log('[CALL] Generated roomId:', roomId);

    // Send initiate call message via WebSocket
    wsService.initiateCall(targetUserId, callType, callerName);
    console.log('[CALL] Sent initiate_call to backend');

    return {
      success: true,
      roomId,
      callId: Date.now() // Generate a call ID
    };
  } catch (error: any) {
    console.error('[CALL] initiateCall error:', error);
    return { success: false, error: error?.message || 'Failed to initiate call' };
  }
};

/**
 * Answer a call
 */
export const answerCall = async (
  roomId: string
): Promise<{ success: boolean; error?: string }> => {
  console.log('[CALL] answerCall: roomId=', roomId);
  try {
    if (!wsService.isConnected()) {
      console.error('[CALL] Cannot answer - WebSocket not connected');
      return { success: false, error: 'WebSocket not connected' };
    }
    wsService.answerCall(roomId);
    console.log('[CALL] Sent answer_call to backend');
    return { success: true };
  } catch (error: any) {
    console.error('[CALL] answerCall error:', error);
    return { success: false, error: error?.message || 'Failed to answer call' };
  }
};

/**
 * Reject a call
 */
export const rejectCall = (roomId: string, reason: string = 'rejected'): void => {
  console.log('[CALL] rejectCall: roomId=', roomId, 'reason=', reason);
  wsService.rejectCall(roomId, reason);
};

/**
 * End a call
 */
export const endCall = (roomId: string, reason: string = 'ended'): void => {
  console.log('[CALL] endCall: roomId=', roomId, 'reason=', reason);
  wsService.endCall(roomId, reason);
};

/**
 * Send WebRTC offer
 */
export const sendOffer = (roomId: string, sdp: string, _type: string = 'offer'): void => {
  console.log('[CALL] sendOffer: roomId=', roomId, 'sdp length=', sdp?.length || 0);
  wsService.sendOffer(roomId, sdp);
};

/**
 * Send WebRTC answer
 */
export const sendAnswer = (roomId: string, sdp: string, _type: string = 'answer'): void => {
  console.log('[CALL] sendAnswer: roomId=', roomId, 'sdp length=', sdp?.length || 0);
  wsService.sendAnswer(roomId, sdp);
};

/**
 * Send ICE candidate
 */
export const sendIceCandidate = (
  roomId: string,
  candidate: string,
  sdpMid: string,
  sdpMLineIndex: number
): void => {
  wsService.sendIceCandidate(roomId, candidate, sdpMid, sdpMLineIndex);
};

/**
 * Register a listener for call events
 * Returns an unsubscribe function
 */
export const registerSocketListener = <T = unknown>(
  event: string,
  callback: (payload: T) => void
): (() => void) => {
  console.log('[CALL] registerSocketListener for event:', event);

  // Map Socket.IO event names to raw WebSocket message types
  const eventToTypeMap: Record<string, string> = {
    'incoming-call': 'incoming_call',
    'call-answered': 'call_answered',
    'call-rejected': 'call_rejected',
    'call-ended': 'call_ended',
    'call-error': 'call_error',
    'receiver-ready': 'receiver_ready',
    'receive-offer': 'webrtc_offer',
    'receive-answer': 'webrtc_answer',
    'receive-ice-candidate': 'webrtc_ice',
  };

  const wsType = eventToTypeMap[event];

  if (!wsType) {
    console.warn('[CALL] Unknown event type:', event);
    return () => {};
  }

  // Subscribe based on event category
  if (wsType.startsWith('webrtc_')) {
    return wsService.onWebRTC((message) => {
      if (message.type === wsType) {
        console.log('[CALL] Received WebRTC event:', event, 'type:', wsType);
        // Transform message to match expected payload format
        const payload = transformWebRTCPayload(message, event);
        callback(payload as T);
      }
    });
  } else {
    return wsService.onCall((message) => {
      if (message.type === wsType) {
        console.log('[CALL] Received call event:', event, 'type:', wsType, 'payload:', JSON.stringify(message).substring(0, 200));
        // Transform message to match expected payload format
        const payload = transformCallPayload(message, event);
        callback(payload as T);
      }
    });
  }
};

/**
 * Transform raw WebSocket call message to expected format
 */
const transformCallPayload = (message: any, event: string): any => {
  switch (event) {
    case 'incoming-call':
      return {
        roomId: message.roomId,
        callId: message.callId || Date.now(),
        callerId: message.callerId,
        callerUsername: message.callerUsername,
        callerName: message.callerName || message.callerUsername,
        callType: message.callType || 'audio',
        timestamp: message.timestamp || Date.now(),
      };
    case 'call-answered':
      return {
        roomId: message.roomId,
        answeredBy: message.username || message.userId?.toString(),
        timestamp: message.timestamp || Date.now(),
      };
    case 'call-rejected':
      return {
        roomId: message.roomId,
        reason: message.reason || 'rejected',
        rejectedBy: message.userId,
        timestamp: message.timestamp || Date.now(),
      };
    case 'call-ended':
      return {
        roomId: message.roomId,
        reason: message.reason || 'ended',
        endedBy: message.userId,
        timestamp: message.timestamp || Date.now(),
      };
    case 'receiver-ready':
      return {
        roomId: message.roomId,
        receiverId: message.userId,
        receiverUsername: message.username,
        timestamp: message.timestamp || Date.now(),
      };
    case 'call-error':
      return {
        error: message.error || 'unknown_error',
        message: message.message || 'Call failed',
        targetUserId: message.targetUserId,
        roomId: message.roomId,
        timestamp: message.timestamp || Date.now(),
      };
    default:
      return message;
  }
};

/**
 * Transform raw WebSocket WebRTC message to expected format
 */
const transformWebRTCPayload = (message: any, event: string): any => {
  const basePayload = {
    roomId: message.roomId,
    senderId: message.fromUserId,
    timestamp: message.timestamp || Date.now(),
  };

  switch (event) {
    case 'receive-offer':
      return {
        ...basePayload,
        sdp: message.sdp,
        type: 'offer',
      };
    case 'receive-answer':
      return {
        ...basePayload,
        sdp: message.sdp,
        type: 'answer',
      };
    case 'receive-ice-candidate':
      return {
        ...basePayload,
        candidate: message.candidate,
        // Provide defaults if backend doesn't send these fields
        sdpMid: message.sdpMid ?? '0',
        sdpMLineIndex: message.sdpMLineIndex ?? 0,
      };
    default:
      return message;
  }
};

// Re-export wsService for direct access if needed
export { wsService } from './websocket';
