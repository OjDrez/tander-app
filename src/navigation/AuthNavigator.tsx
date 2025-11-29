import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import LoginScreen from "../screens/Auth/LoginScreen";
import LoginSuccessScreen from "../screens/Auth/LoginSuccessScreen";

export type AuthStackParamList = {
  LoginScreen: undefined;
  LoginSuccessScreen: { method: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="LoginSuccessScreen" component={LoginSuccessScreen} />
    </Stack.Navigator>
  );
}
