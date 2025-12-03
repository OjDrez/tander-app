import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import HomeScreen from "../screens/Home/HomeScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import { AppStackParamList } from "./NavigationTypes";

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="InboxScreen" component={InboxScreen} />
      <Stack.Screen name="MyMatchesScreen" component={MyMatchesScreen} />
      <Stack.Screen
        name="PeopleViewedMeScreen"
        component={PeopleViewedMeScreen}
      />
      <Stack.Screen name="ProfileViewScreen" component={ProfileViewScreen} />
    </Stack.Navigator>
  );
}
