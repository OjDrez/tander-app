import React from 'react';

import LoadingIndicator from '@/src/components/common/LoadingIndicator';

/**
 * LoadingScreen component - Full screen loading state for HomeScreen
 * Uses the unified LoadingIndicator component for consistent design
 */
export function LoadingScreen() {
  return (
    <LoadingIndicator
      variant="fullscreen"
      message="Loading your dashboard..."
    />
  );
}

export default LoadingScreen;
