import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AuthNavigator from "./AuthNavigator";
import OnboardingNavigator from "./OnboardingNavigator";

// ⬅️ Import RootStackParamList
import AppLayout from "./AppLayout";
import { RootStackParamList } from "./NavigationTypes";
import SettingNavigator from "./SettingNavigator";

// ⬅️ Type your Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      {/* <Stack.Screen name="HomeScreen" component={AppNavigator} /> */}
      <Stack.Screen name="HomeScreen" component={AppLayout} />
      <Stack.Screen name="Settings" component={SettingNavigator} />
    </Stack.Navigator>
  );
}
