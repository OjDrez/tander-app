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

export default useDebounce;
