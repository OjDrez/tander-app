/**
 * Network Status Hook
 * Monitors network connectivity for calls and provides connection quality info
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';

export type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'offline';

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetInfoStateType;
  quality: NetworkQuality;
  isWifi: boolean;
  isCellular: boolean;
  cellularGeneration: string | null;
  details: string;
}

/**
 * Determine network quality based on connection type
 */
const getNetworkQuality = (state: NetInfoState): NetworkQuality => {
  if (!state.isConnected) return 'offline';
  if (state.isInternetReachable === false) return 'offline';

  switch (state.type) {
    case 'wifi':
      return 'excellent';
    case 'cellular':
      // Check cellular generation
      const details = state.details as any;
      const generation = details?.cellularGeneration;
      switch (generation) {
        case '5g':
          return 'excellent';
        case '4g':
          return 'good';
        case '3g':
          return 'fair';
        case '2g':
          return 'poor';
        default:
          return 'good'; // Assume 4G if unknown
      }
    case 'ethernet':
      return 'excellent';
    case 'vpn':
      return 'good';
    default:
      return 'fair';
  }
};

/**
 * Get human-readable network details
 */
const getNetworkDetails = (state: NetInfoState): string => {
  if (!state.isConnected) return 'No connection';
  if (state.isInternetReachable === false) return 'No internet access';

  switch (state.type) {
    case 'wifi':
      return 'WiFi';
    case 'cellular':
      const details = state.details as any;
      const generation = details?.cellularGeneration?.toUpperCase() || 'Cellular';
      return generation;
    case 'ethernet':
      return 'Ethernet';
    case 'vpn':
      return 'VPN';
    default:
      return state.type || 'Unknown';
  }
};

/**
 * Hook to monitor network status
 * Useful for showing connection warnings during calls
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: 'unknown' as NetInfoStateType,
    quality: 'good',
    isWifi: false,
    isCellular: false,
    cellularGeneration: null,
    details: 'Checking...',
  });

  useEffect(() => {
    // Initial fetch
    NetInfo.fetch().then((state) => {
      const details = state.details as any;
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        quality: getNetworkQuality(state),
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        cellularGeneration: details?.cellularGeneration || null,
        details: getNetworkDetails(state),
      });
    });

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const details = state.details as any;
      setStatus({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        quality: getNetworkQuality(state),
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        cellularGeneration: details?.cellularGeneration || null,
        details: getNetworkDetails(state),
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}

/**
 * Hook specifically for call-related network monitoring
 * Provides callbacks for network changes during a call
 */
export function useCallNetworkMonitor(options: {
  onNetworkLost?: () => void;
  onNetworkRestored?: () => void;
  onQualityChange?: (quality: NetworkQuality) => void;
  isActive?: boolean;
}) {
  const { onNetworkLost, onNetworkRestored, onQualityChange, isActive = true } = options;
  const wasConnectedRef = useRef(true);
  const lastQualityRef = useRef<NetworkQuality>('good');
  const status = useNetworkStatus();

  useEffect(() => {
    if (!isActive) return;

    // Check for connection loss
    if (wasConnectedRef.current && !status.isConnected) {
      console.log('[CallNetwork] Network lost');
      onNetworkLost?.();
    }

    // Check for connection restore
    if (!wasConnectedRef.current && status.isConnected) {
      console.log('[CallNetwork] Network restored');
      onNetworkRestored?.();
    }

    // Check for quality change
    if (lastQualityRef.current !== status.quality) {
      console.log('[CallNetwork] Quality changed:', lastQualityRef.current, '->', status.quality);
      onQualityChange?.(status.quality);
    }

    wasConnectedRef.current = status.isConnected;
    lastQualityRef.current = status.quality;
  }, [status, isActive, onNetworkLost, onNetworkRestored, onQualityChange]);

  return status;
}

/**
 * Check if network is suitable for calls
 */
export function isNetworkSuitableForCall(status: NetworkStatus): {
  suitable: boolean;
  warning: string | null;
} {
  if (!status.isConnected || status.quality === 'offline') {
    return {
      suitable: false,
      warning: 'No internet connection. Please check your network.',
    };
  }

  if (status.quality === 'poor') {
    return {
      suitable: true,
      warning: 'Poor network connection. Call quality may be affected.',
    };
  }

  if (status.isCellular && status.cellularGeneration === '3g') {
    return {
      suitable: true,
      warning: '3G connection detected. Consider switching to WiFi for better quality.',
    };
  }

  if (status.isCellular && status.cellularGeneration === '2g') {
    return {
      suitable: false,
      warning: '2G connection is too slow for calls. Please connect to WiFi or move to an area with better signal.',
    };
  }

  return {
    suitable: true,
    warning: null,
  };
}

export default useNetworkStatus;
