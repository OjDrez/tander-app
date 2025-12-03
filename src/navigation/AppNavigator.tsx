import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import HomeScreen from "../screens/Home/HomeScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import InboxEmptyScreen from "../screens/Inbox/InboxEmptyScreen";
import MatchCelebrationScreen from "../screens/Matches/MatchCelebrationScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
import ViewProfileScreen from "../screens/ViewMe/ViewProfileScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import ConversationScreen from "../screens/Chat/ConversationScreen";
import DashboardScreen from "../screens/Profile/DashboardScreen";
import SettingsScreen from "../screens/Settings/SettingsScreen";
import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";
import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
import VideoCallScreen from "../screens/Video/VideoCallScreen";
import { AppStackParamList } from "./NavigationTypes";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="InboxEmptyScreen" component={InboxEmptyScreen} />
      <Stack.Screen name="ConversationScreen" component={ConversationScreen} />
      <Stack.Screen
        name="MessageThreadScreen"
        component={ConversationScreen}
      />
      <Stack.Screen
        name="MatchCelebrationScreen"
        component={MatchCelebrationScreen}
      />
      <Stack.Screen name="MyMatchesScreen" component={MyMatchesScreen} />
      <Stack.Screen
        name="PeopleViewedMeScreen"
        component={PeopleViewedMeScreen}
      />
      <Stack.Screen name="ProfileViewScreen" component={ProfileViewScreen} />
      <Stack.Screen name="ViewProfileScreen" component={ViewProfileScreen} />
      <Stack.Screen
        name="ViewProfileDetailsScreen"
        component={ViewProfileDetailsScreen}
      />
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      <Stack.Screen
        name="EditBasicInfoScreen"
        component={EditBasicInfoScreen}
      />
      <Stack.Screen name="EditAboutYouScreen" component={EditAboutYouScreen} />
      <Stack.Screen name="VideoCallScreen" component={VideoCallScreen} />
    </Stack.Navigator>
  );
}
