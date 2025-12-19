/**
 * MainStackNavigationContext
 *
 * Provides access to the main stack navigation from anywhere in the app.
 * This context is used by components that need to navigate to screens
 * outside of their immediate navigation context (e.g., ActiveCallBanner, TandyScreen).
 */
import { NavigationProp } from "@react-navigation/native";
import React, { createContext, useContext, ReactNode } from "react";
import { AppStackParamList } from "../navigation/NavigationTypes";

// Type for the main stack navigation
export type MainStackNavigation = NavigationProp<AppStackParamList>;

// Create context with null default
const MainStackNavigationContext = createContext<MainStackNavigation | null>(null);

/**
 * Hook to access the main stack navigation.
 * Returns null if used outside of the provider (e.g., before navigation is initialized).
 */
export function useMainStackNavigation(): MainStackNavigation | null {
  return useContext(MainStackNavigationContext);
}

/**
 * Provider props
 */
interface MainStackNavigationProviderProps {
  navigation: MainStackNavigation | null;
  children: ReactNode;
}

/**
 * Provider component to wrap the app and provide main stack navigation.
 */
export function MainStackNavigationProvider({
  navigation,
  children,
}: MainStackNavigationProviderProps) {
  return (
    <MainStackNavigationContext.Provider value={navigation}>
      {children}
    </MainStackNavigationContext.Provider>
  );
}

export default MainStackNavigationContext;
