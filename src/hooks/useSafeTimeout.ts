import { useCallback, useRef, useEffect } from "react";

/**
 * Custom hook for creating safe timeouts that automatically clean up on unmount.
 * Prevents memory leaks from setTimeout calls on unmounted components.
 *
 * Usage:
 * const { setSafeTimeout, clearAllTimeouts } = useSafeTimeout();
 *
 * // Set a timeout that will auto-cleanup
 * setSafeTimeout(() => {
 *   doSomething();
 * }, 300);
 */
export function useSafeTimeout() {
  const timeoutsRef = useRef<Set<NodeJS.Timeout>>(new Set());
  const isMountedRef = useRef(true);

  // Cleanup all timeouts on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      timeoutsRef.current.forEach((timeout) => {
        clearTimeout(timeout);
      });
      timeoutsRef.current.clear();
    };
  }, []);

  /**
   * Set a timeout that will automatically cleanup on component unmount.
   * The callback will NOT be called if the component has unmounted.
   *
   * @param callback - Function to call after delay
   * @param delay - Delay in milliseconds
   * @returns Timeout ID for manual cancellation if needed
   */
  const setSafeTimeout = useCallback(
    (callback: () => void, delay: number): NodeJS.Timeout | null => {
      if (!isMountedRef.current) {
        return null;
      }

      const timeoutId = setTimeout(() => {
        // Remove from tracking set
        timeoutsRef.current.delete(timeoutId);

        // Only execute if still mounted
        if (isMountedRef.current) {
          callback();
        }
      }, delay);

      // Track this timeout
      timeoutsRef.current.add(timeoutId);

      return timeoutId;
    },
    []
  );

  /**
   * Clear a specific timeout by ID.
   *
   * @param timeoutId - The timeout ID to clear
   */
  const clearSafeTimeout = useCallback((timeoutId: NodeJS.Timeout | null) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(timeoutId);
    }
  }, []);

  /**
   * Clear all active timeouts.
   */
  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    timeoutsRef.current.clear();
  }, []);

  /**
   * Check if the component is still mounted.
   */
  const isMounted = useCallback(() => isMountedRef.current, []);

  return {
    setSafeTimeout,
    clearSafeTimeout,
    clearAllTimeouts,
    isMounted,
  };
}

export default useSafeTimeout;
