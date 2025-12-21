import { useCallback, useRef, useEffect } from "react";

/**
 * Custom hook for debouncing function calls.
 * Prevents rapid button taps from triggering multiple API calls.
 *
 * Senior-friendly considerations:
 * - Prevents accidental double-taps (common with older users)
 * - Provides visual feedback through loading states
 *
 * @param callback - Function to debounce
 * @param delay - Debounce delay in milliseconds (default: 500ms)
 * @returns Debounced function
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}

/**
 * Custom hook for throttling function calls.
 * Ensures a function is called at most once within a specified time window.
 * Better for actions that should execute immediately on first press but not repeat.
 *
 * @param callback - Function to throttle
 * @param delay - Throttle delay in milliseconds (default: 1000ms)
 * @returns Throttled function
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): (...args: Parameters<T>) => void {
  const lastCallRef = useRef<number>(0);
  const callbackRef = useRef(callback);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCallRef.current >= delay) {
        lastCallRef.current = now;
        callbackRef.current(...args);
      }
    },
    [delay]
  );

  return throttledCallback;
}

/**
 * Custom hook for preventing double-clicks/taps.
 * Executes immediately on first call, then blocks subsequent calls for the delay period.
 * Perfect for button handlers that should respond immediately but not repeat.
 *
 * @param callback - Function to protect
 * @param delay - Block period in milliseconds (default: 1000ms)
 * @returns Protected function and loading state
 */
export function usePreventDoubleClick<T extends (...args: any[]) => Promise<any>>(
  callback: T,
  delay: number = 1000
): [(...args: Parameters<T>) => Promise<void>, boolean] {
  const isProcessingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const [isProcessing, setIsProcessing] = useState(false);

  // Keep callback ref updated
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const protectedCallback = useCallback(
    async (...args: Parameters<T>) => {
      if (isProcessingRef.current) {
        return;
      }

      isProcessingRef.current = true;
      setIsProcessing(true);

      try {
        await callbackRef.current(...args);
      } finally {
        // Reset after delay
        timeoutRef.current = setTimeout(() => {
          isProcessingRef.current = false;
          setIsProcessing(false);
        }, delay);
      }
    },
    [delay]
  );

  return [protectedCallback, isProcessing];
}

// Need to import useState for usePreventDoubleClick
import { useState } from "react";

/**
 * Hook specifically for call button
 * Combines debounce + async lock + cooldown
 * Prevents rapid taps and accidental double-calls
 */
export function useCallButtonGuard(
  onCall: (userId: number, callType: 'audio' | 'video') => Promise<boolean>,
  options: {
    debounceMs?: number;
    cooldownMs?: number;
  } = {}
): {
  initiateCall: (userId: number, callType: 'audio' | 'video') => Promise<void>;
  isDisabled: boolean;
  isLoading: boolean;
} {
  const { debounceMs = 500, cooldownMs = 3000 } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const lastCallTimeRef = useRef<number>(0);
  const onCallRef = useRef(onCall);

  // Keep callback ref updated
  useEffect(() => {
    onCallRef.current = onCall;
  }, [onCall]);

  const initiateCall = useCallback(
    async (userId: number, callType: 'audio' | 'video') => {
      const now = Date.now();

      // Check debounce
      if (now - lastCallTimeRef.current < debounceMs) {
        console.log('[CallButton] Debounced - too fast');
        return;
      }

      // Check cooldown
      if (isOnCooldown) {
        console.log('[CallButton] On cooldown');
        return;
      }

      // Check if already loading
      if (isLoading) {
        console.log('[CallButton] Already initiating call');
        return;
      }

      lastCallTimeRef.current = now;
      setIsLoading(true);

      try {
        const success = await onCallRef.current(userId, callType);

        if (success) {
          // Start cooldown after successful call initiation
          setIsOnCooldown(true);
          setTimeout(() => {
            setIsOnCooldown(false);
          }, cooldownMs);
        }
      } catch (error) {
        console.error('[CallButton] Error initiating call:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [debounceMs, cooldownMs, isLoading, isOnCooldown]
  );

  return {
    initiateCall,
    isDisabled: isLoading || isOnCooldown,
    isLoading,
  };
}

export default useDebounce;
