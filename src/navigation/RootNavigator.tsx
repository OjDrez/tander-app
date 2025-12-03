import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import AuthNavigator from "./AuthNavigator";
import OnboardingNavigator from "./OnboardingNavigator";

// ⬅️ Import RootStackParamList
import { RootStackParamList } from "./NavigationTypes";
import HomeScreen from "../screens/Home/HomeScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import ViewMeScreen from "../screens/ViewMe/ViewMeScreen";
import ProfileScreen from "../screens/Profile/ProfileScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import ChatRoomScreen from "../screens/Chat/ChatRoomScreen";
import VideoCallScreen from "../screens/Video/VideoCallScreen";

// ⬅️ Type your Stack Navigator
const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
      <Stack.Screen name="Auth" component={AuthNavigator} />
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="MyMatchesScreen" component={MyMatchesScreen} />
      <Stack.Screen name="ViewMeScreen" component={ViewMeScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="ProfileViewScreen" component={ProfileViewScreen} />
      <Stack.Screen name="ChatRoomScreen" component={ChatRoomScreen} />
      <Stack.Screen name="VideoCallScreen" component={VideoCallScreen} />
    </Stack.Navigator>
  );
}
