import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import {
  VideoCallScreen,
  VoiceCallScreen,
  IncomingCallScreen,
} from "../screens/Call";
import ConversationScreen from "../screens/Chat/ConversationScreen";
import DiscoveryScreen from "../screens/Discovery/DiscoveryScreen";
import HomeScreen from "../screens/Home/HomeScreen";
import InboxEmptyScreen from "../screens/Inbox/InboxEmptyScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import MatchCelebrationScreen from "../screens/Matches/MatchCelebrationScreen";
import MatchesScreen from "../screens/Matches/MatchesScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import MyProfileScreen from "../screens/Profile/MyProfileScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
import PaymentMethodsScreen from "../screens/Settings/PaymentMethodsScreen";
import AddPaymentMethodScreen from "../screens/Settings/AddPaymentMethodScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";
import PrivacyScreen from "../screens/Settings/PrivacyScreen";
import ChangePasswordScreen from "../screens/Settings/ChangePasswordScreen";
import BlockedUsersScreen from "../screens/Settings/BlockedUsersScreen";
import SecuritySettingsScreen from "../screens/Settings/SecuritySettingsScreen";
import HelpCenterScreen from "../screens/Settings/HelpCenterScreen";
import Step2IdVerification from "../screens/Registration/Step2IdVerification";
import BreathingExerciseScreen from "../screens/Tandy/BreathingExerciseScreen";
import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
import ViewProfileScreen from "../screens/ViewMe/ViewProfileScreen";
import { AppStackParamList } from "./NavigationTypes";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="DiscoveryScreen" component={DiscoveryScreen} />
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="InboxEmptyScreen" component={InboxEmptyScreen} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen name="MessageThreadScreen" component={ConversationScreen} />
      <Stack.Screen
        name="MatchCelebrationScreen"
        component={MatchCelebrationScreen}
      />
      <Stack.Screen name="MyMatchesScreen" component={MyMatchesScreen} />
      <Stack.Screen name="MatchesScreen" component={MatchesScreen} />
      <Stack.Screen
        name="PeopleViewedMeScreen"
        component={PeopleViewedMeScreen}
      />
      <Stack.Screen name="MyProfileScreen" component={MyProfileScreen} />
      <Stack.Screen name="ProfileViewScreen" component={ProfileViewScreen} />
      <Stack.Screen name="ViewProfileScreen" component={ViewProfileScreen} />
      <Stack.Screen
        name="ViewProfileDetailsScreen"
        component={ViewProfileDetailsScreen}
      />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen
        name="EditBasicInfoScreen"
        component={EditBasicInfoScreen}
      />
      <Stack.Screen
        name="PaymentMethodsScreen"
        component={PaymentMethodsScreen}
      />
      <Stack.Screen
        name="AddPaymentMethodScreen"
        component={AddPaymentMethodScreen}
      />
      <Stack.Screen name="EditAboutYouScreen" component={EditAboutYouScreen} />
      <Stack.Screen name="PrivacyScreen" component={PrivacyScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="BlockedUsersScreen" component={BlockedUsersScreen} />
      <Stack.Screen name="SecuritySettingsScreen" component={SecuritySettingsScreen} />
      <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
      <Stack.Screen name="IdVerificationScreen">
        {(props) => <Step2IdVerification {...props} isSettings={true} />}
      </Stack.Screen>
      <Stack.Screen name="VideoCallScreen" component={VideoCallScreen} />
      <Stack.Screen name="VoiceCallScreen" component={VoiceCallScreen} />
      <Stack.Screen name="IncomingCallScreen" component={IncomingCallScreen} />
      <Stack.Screen name="BreathingExerciseScreen" component={BreathingExerciseScreen} />
    </Stack.Navigator>
  );
}
