import { useState, useCallback } from "react";
import { userApi, UserProfile } from "@/src/api/userApi";

/**
 * Custom hook for managing profile data fetching and state.
 * Provides loading, error, and refresh capabilities.
 *
 * Senior-friendly considerations:
 * - Clear error messages
 * - Simple interface
 * - Automatic retry capability
 */
export function useProfileData() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await userApi.getCurrentUser();
      setProfile(data);
      return data;
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      const errorMessage = err.message || "Failed to load profile. Please try again.";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    // Silent refresh without showing loading state
    try {
      const data = await userApi.getCurrentUser();
      setProfile(data);
      setError(null);
      return data;
    } catch (err: any) {
      console.error("Failed to refresh profile:", err);
      // Don't update error on silent refresh to avoid disrupting UI
      throw err;
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    refreshProfile,
    setProfile,
    clearError,
  };
}

export default useProfileData;
