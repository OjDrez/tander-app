import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import OnboardingNavigator from "./OnboardingNavigator";
// import AuthNavigator from "./AuthNavigator";
import AppNavigator from "./AppNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      {/* <Stack.Screen name="Auth" component={AuthNavigator} /> */}
      <Stack.Screen name="App" component={AppNavigator} />
    </Stack.Navigator>
  );
}
