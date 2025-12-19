// import AppNavigator from "./src/navigation/AppNavigator";

// export default function App() {
//   return <AppNavigator />;
// }
import { NavigationContainer } from "@react-navigation/native";
import React from "react";
import { navigationRef } from "./src/navigation/NavigationService";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/auth/AuthProvider";
import { ToastProvider } from "./src/context/ToastProvider";
import { ActiveCallProvider } from "./src/context/ActiveCallContext";
import { RealTimeProvider } from "./src/context/RealTimeProvider";

export default function App() {
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
