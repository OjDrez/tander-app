import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import BlockedUsersScreen from "../screens/Settings/BlockedUsersScreen";
import ChangePasswordScreen from "../screens/Settings/ChangePasswordScreen";
import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
import PaymentMethodsScreen from "../screens/Settings/PaymentMethodsScreen";
import AddPaymentMethodScreen from "../screens/Settings/AddPaymentMethodScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import SecuritySettingsScreen from "../screens/Settings/SecuritySettingsScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";
import HelpCenterScreen from "../screens/Settings/HelpCenterScreen";
// ID Verification uses the Registration screen
import Step2IdVerification from "../screens/Registration/Step2IdVerification";

type SettingStackParamList = {
  SettingsScreen: undefined;
  EditBasicInfoScreen: undefined;
  EditAboutYouScreen: undefined;
  ViewProfileDetailsScreen: { userId?: string } | undefined;
  PaymentMethodsScreen: undefined;
  AddPaymentMethodScreen: undefined;
  PrivacyScreen: undefined;
  ChangePasswordScreen: undefined;
  IdVerificationScreen: undefined;
  BlockedUsersScreen: undefined;
  SecuritySettingsScreen: undefined;
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
        name="IdVerificationScreen"
        options={{ headerShown: false }}
      >
        {(props) => <Step2IdVerification {...props} isSettings={true} />}
      </Stack.Screen>
      <Stack.Screen
        name="BlockedUsersScreen"
        component={BlockedUsersScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SecuritySettingsScreen"
        component={SecuritySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddPaymentMethodScreen"
        component={AddPaymentMethodScreen}
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
