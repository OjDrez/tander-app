import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import DashboardScreen from "../screens/Profile/DashboardScreen";
import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
import PaymentMethodsScreen from "../screens/Settings/PaymentMethodsScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";

type SettingStackParamList = {
  SettingsScreen: undefined;
  EditBasicInfoScreen: undefined;
  EditAboutYouScreen: undefined;
  ViewProfileDetailsScreen: { userId?: string } | undefined;
  DashboardScreen: undefined;
  PaymentMethodsScreen: undefined;
  PrivacyScreen: undefined;
};

const Stack = createNativeStackNavigator<SettingStackParamList>();

export default function SettingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen
        name="EditBasicInfoScreen"
        component={EditBasicInfoScreen}
      />
      <Stack.Screen name="EditAboutYouScreen" component={EditAboutYouScreen} />
      <Stack.Screen
        name="ViewProfileDetailsScreen"
        component={ViewProfileDetailsScreen}
      />
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen
        name="PaymentMethodsScreen"
        component={PaymentMethodsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyScreen"
        component={PrivacyScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
