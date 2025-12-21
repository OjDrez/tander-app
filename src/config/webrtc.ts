/**
 * WebRTC Configuration
 * Centralized configuration for WebRTC calls
 *
 * Uses 100% FREE TURN servers from Open Relay Project
 * These servers are maintained by the community and are free to use
 */

/**
 * Type definitions for RTCIceServer (react-native-webrtc compatible)
 */
export interface RTCIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

/**
 * Get 100% FREE TURN servers from Open Relay Project
 * https://www.metered.ca/tools/openrelay/
 *
 * These are community-maintained free TURN servers.
 * They work reliably for most use cases.
 */
const getFreeTurnServers = (): RTCIceServer[] => {
  return [
    // Open Relay TURN servers - 100% FREE
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
  ];
};

/**
 * Get FREE STUN servers from Google and Twilio
 * STUN servers are always free as they only help with NAT discovery
 */
const getFreeStunServers = (): RTCIceServer[] => {
  return [
    // Google STUN servers - FREE
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Twilio STUN server - FREE
    { urls: 'stun:global.stun.twilio.com:3478' },
  ];
};

/**
 * ICE Server Configuration
 * Returns all FREE STUN + TURN servers
 */
export const getIceServers = (): RTCIceServer[] => {
  const stunServers = getFreeStunServers();
  const turnServers = getFreeTurnServers();

  console.log('[WebRTC] Using FREE STUN servers:', stunServers.length);
  console.log('[WebRTC] Using FREE TURN servers:', turnServers.length);

  return [...stunServers, ...turnServers];
};

/**
 * Async version (same as sync since we're using free servers)
 * Kept for API compatibility
 */
export const getIceServersAsync = async (): Promise<RTCIceServer[]> => {
  return getIceServers();
};

/**
 * Fetch TURN credentials - returns free servers
 * Kept for API compatibility
 */
export const fetchTurnCredentials = async (): Promise<RTCIceServer[]> => {
  return getFreeTurnServers();
};

/**
 * Clear cached TURN credentials - no-op since we use free servers
 * Kept for API compatibility
 */
export const clearTurnCredentialsCache = (): void => {
  // No-op - free servers don't need caching
};

/**
 * Call Timeout Configuration
 * Centralized timeout values for call operations
 */
export const CALL_TIMEOUTS = {
  /** Time to wait for call to be answered (ms) */
  RING_TIMEOUT: 60000,
  /** Time to attempt reconnection after disconnect (ms) */
  RECONNECT_TIMEOUT: 30000,
  /** Maximum reconnection attempts */
  RECONNECT_ATTEMPTS: 5,
  /** Time to wait for ICE gathering (ms) */
  ICE_GATHERING_TIMEOUT: 15000,
  /** Time to establish WebRTC connection (ms) - reduced from 45s to 10s for faster failure detection */
  CONNECTION_TIMEOUT: 10000,
  /** Delay before attempting ICE restart (ms) */
  ICE_RESTART_DELAY: 2000,
  /** Delay before resending offer (ms) - reduced for faster offer delivery */
  OFFER_RESEND_DELAY: 500,
  /** Interval between offer resends (ms) - reduced for more responsive retries */
  OFFER_RESEND_INTERVAL: 2000,
  /** Maximum number of offer resend attempts */
  MAX_OFFER_RESENDS: 5,
  /** Heartbeat interval for connection monitoring (ms) */
  HEARTBEAT_INTERVAL: 5000,
  /** Batch delay for ICE candidates (ms) */
  CANDIDATE_BATCH_DELAY: 100,
} as const;

/**
 * Connection Quality Thresholds
 * Used to determine connection quality based on network metrics
 */
export const QUALITY_THRESHOLDS = {
  /** Packet loss percentage considered poor (10%) */
  PACKET_LOSS_POOR: 0.1,
  /** Packet loss percentage considered fair (5%) */
  PACKET_LOSS_FAIR: 0.05,
  /** Round-trip time considered poor (ms) */
  RTT_POOR: 300,
  /** Round-trip time considered fair (ms) */
  RTT_FAIR: 150,
} as const;

/**
 * WebRTC Peer Connection Configuration
 */
export const getPeerConnectionConfig = (): RTCConfiguration => ({
  iceServers: getIceServers(),
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
});

/**
 * WebRTC Peer Connection Configuration (async version)
 */
export const getPeerConnectionConfigAsync = async (): Promise<RTCConfiguration> => ({
  iceServers: await getIceServersAsync(),
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy,
});

/**
 * Media Constraints for getUserMedia
 */
export const getMediaConstraints = (isVideo: boolean) => ({
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
});

/**
 * Maximum ICE restart attempts before giving up
 */
export const MAX_ICE_RESTART_ATTEMPTS = 5;

export default {
  getIceServers,
  getIceServersAsync,
  fetchTurnCredentials,
  clearTurnCredentialsCache,
  CALL_TIMEOUTS,
  QUALITY_THRESHOLDS,
  getPeerConnectionConfig,
  getPeerConnectionConfigAsync,
  getMediaConstraints,
  MAX_ICE_RESTART_ATTEMPTS,
};
