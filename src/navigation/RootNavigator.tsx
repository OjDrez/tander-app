import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import OnboardingNavigator from "./OnboardingNavigator";

import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="HomeScreen" component={AppNavigator} />
    </Stack.Navigator>
  );
}
