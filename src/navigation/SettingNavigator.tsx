import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import ChangePasswordScreen from "../screens/Settings/ChangePasswordScreen";
import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
import HelpCenterScreen from "../screens/Settings/HelpCenterScreen";
import PaymentMethodsScreen from "../screens/Settings/PaymentMethodsScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";
// ID Verification uses the Registration screen

type SettingStackParamList = {
  SettingsScreen: undefined;
  EditBasicInfoScreen: undefined;
  EditAboutYouScreen: undefined;
  ViewProfileDetailsScreen: { userId?: string } | undefined;
  PaymentMethodsScreen: undefined;
  AddPaymentMethodScreen: undefined;
  PrivacyScreen: undefined;
  ChangePasswordScreen: undefined;

  HelpCenterScreen: undefined;
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
      <Stack.Screen
        name="ChangePasswordScreen"
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpCenterScreen"
        component={HelpCenterScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
