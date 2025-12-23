// import AppNavigator from "./src/navigation/AppNavigator";

// export default function App() {
//   return <AppNavigator />;
// }
import { NavigationContainer } from "@react-navigation/native";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { AuthProvider } from "./src/auth/AuthProvider";
import { ActiveCallProvider } from "./src/context/ActiveCallContext";
import { RealTimeProvider } from "./src/context/RealTimeProvider";
import { ToastProvider } from "./src/context/ToastProvider";
import { navigationRef } from "./src/navigation/NavigationService";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  useEffect(() => {
    const prepare = async () => {
      // wait one frame to avoid white flash
      await new Promise((resolve) => setTimeout(resolve, 300));
      await SplashScreen.hideAsync();
    };

    prepare();
  }, []);
  return (
    <ToastProvider>
      <AuthProvider>
        {/* RealTimeProvider initializes socket and matching service globally */}
        <RealTimeProvider>
          <ActiveCallProvider>
            <NavigationContainer ref={navigationRef}>
              <RootNavigator />
            </NavigationContainer>
          </ActiveCallProvider>
        </RealTimeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
