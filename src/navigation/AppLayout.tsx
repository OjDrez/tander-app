// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React, { useState } from "react";
// import { Platform, View } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import MainNavigationBar, {
//   MainNavigationTab,
// } from "../components/navigation/MainNavigationBar";

// // TAB SCREENS
// import HomeScreen from "@/src/screens/Home/HomeScreen";
// import InboxScreen from "@/src/screens/Inbox/InboxScreen";
// import MyMatchesScreen from "@/src/screens/Matches/MyMatchesScreen";
// import ProfileViewScreen from "@/src/screens/Profile/ProfileViewScreen";

// // ALL OTHER SCREENS (existing AppNavigator stack)
// import AppNavigator from "./AppNavigator";

// const Stack = createNativeStackNavigator();

// export default function AppLayout() {
//   const insets = useSafeAreaInsets();
//   const [activeTab, setActiveTab] = useState<MainNavigationTab>("Home");

//   function getTabComponent() {
//     switch (activeTab) {
//       case "Home":
//         return HomeScreen;
//       case "Inbox":
//         return InboxScreen;
//       case "Matches":
//         return MyMatchesScreen;
//       case "Profile":
//         return ProfileViewScreen;
//       default:
//         return HomeScreen;
//     }
//   }

//   const ActiveTabComponent = getTabComponent();

//   return (
//     <View style={{ flex: 1 }}>
//       {/* TAB CONTENT AREA */}
//       <View style={{ flex: 1 }}>
//         <Stack.Navigator
//           screenOptions={{ headerShown: false, animation: "none" }}
//         >
//           {/* Currently active tab */}
//           <Stack.Screen name="ActiveTab" component={ActiveTabComponent} />

//           {/* Your original AppNavigator for deep routing */}
//           <Stack.Screen name="AppNavigator" component={AppNavigator} />
//         </Stack.Navigator>
//       </View>

//       {/* FIXED BOTTOM NAVIGATION */}
//       <MainNavigationBar
//         activeTab={activeTab}
//         onTabPress={(tab) => setActiveTab(tab)}
//         style={{
//           paddingBottom: Platform.OS === "android" ? insets.bottom : 8,
//         }}
//       />
//     </View>
//   );
// }

// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React, { useState } from "react";
// import { Platform, View } from "react-native";
// import { useSafeAreaInsets } from "react-native-safe-area-context";

// import MainNavigationBar, {
//   MainNavigationTab,
// } from "../components/navigation/MainNavigationBar";

// // TAB SCREENS
// import HomeScreen from "../screens/Home/HomeScreen";
// import InboxScreen from "../screens/Inbox/InboxScreen";
// import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";

// // ALL OTHER SCREENS (from AppNavigator)
// import ConversationScreen from "../screens/Chat/ConversationScreen";
// import InboxEmptyScreen from "../screens/Inbox/InboxEmptyScreen";
// import MatchCelebrationScreen from "../screens/Matches/MatchCelebrationScreen";
// import DashboardScreen from "../screens/Profile/DashboardScreen";
// import EditAboutYouScreen from "../screens/Settings/EditAboutYouScreen";
// import EditBasicInfoScreen from "../screens/Settings/EditBasicInfoScreen";
// import ViewProfileDetailsScreen from "../screens/Settings/ViewProfileDetailsScreen";
// import VideoCallScreen from "../screens/Video/VideoCallScreen";
// import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
// import ViewProfileScreen from "../screens/ViewMe/ViewProfileScreen";

// // TYPES
// import MyProfileScreen from "../screens/Profile/MyProfileScreen";
// import SettingsScreen from "../screens/Settings/SettingsScreen";
// import { AppStackParamList } from "./NavigationTypes";

// const TabStack = createNativeStackNavigator<AppStackParamList>();
// const MainStack = createNativeStackNavigator<AppStackParamList>();

// /* ---------------------- TABS ONLY ---------------------- */
// function Tabs({ activeTab }: { activeTab: MainNavigationTab }) {
//   function getTabComponent() {
//     switch (activeTab) {
//       case "Home":
//         return HomeScreen;
//       case "Inbox":
//         return InboxScreen;
//       case "Matches":
//         return MyMatchesScreen;
//       case "Profile":
//         return MyProfileScreen;
//       default:
//         return HomeScreen;
//     }
//   }

//   const TabComponent = getTabComponent();

//   return (
//     <TabStack.Navigator
//       screenOptions={{ headerShown: false, animation: "none" }}
//     >
//       <TabStack.Screen name="TabRoot" component={TabComponent} />
//     </TabStack.Navigator>
//   );
// }

// /* ---------------------- MAIN LAYOUT ---------------------- */
// export default function AppLayout() {
//   const insets = useSafeAreaInsets();
//   const [activeTab, setActiveTab] = useState<MainNavigationTab>("Home");

//   return (
//     <View style={{ flex: 1 }}>
//       {/* MAIN STACK (ALL APP SCREENS) */}
//       <View style={{ flex: 1 }}>
//         <MainStack.Navigator screenOptions={{ headerShown: false }}>
//           {/* MAIN TAB AREA */}
//           <MainStack.Screen name="Tabs">
//             {() => <Tabs activeTab={activeTab} />}
//           </MainStack.Screen>

//           {/* ALL APP SCREENS (DEEP NAVIGATION) */}
//           <MainStack.Screen name="InboxScreen" component={InboxScreen} />
//           <MainStack.Screen
//             name="InboxEmptyScreen"
//             component={InboxEmptyScreen}
//           />
//           <MainStack.Screen
//             name="ConversationScreen"
//             component={ConversationScreen}
//           />
//           <MainStack.Screen
//             name="MatchCelebrationScreen"
//             component={MatchCelebrationScreen}
//           />
//           <MainStack.Screen
//             name="PeopleViewedMeScreen"
//             component={PeopleViewedMeScreen}
//           />
//           <MainStack.Screen
//             name="ViewProfileScreen"
//             component={ViewProfileScreen}
//           />
//           <MainStack.Screen
//             name="ViewProfileDetailsScreen"
//             component={ViewProfileDetailsScreen}
//           />
//           <MainStack.Screen
//             name="DashboardScreen"
//             component={DashboardScreen}
//           />
//           <MainStack.Screen name="SettingsScreen" component={SettingsScreen} />
//           <MainStack.Screen
//             name="EditBasicInfoScreen"
//             component={EditBasicInfoScreen}
//           />
//           <MainStack.Screen
//             name="EditAboutYouScreen"
//             component={EditAboutYouScreen}
//           />
//           <MainStack.Screen
//             name="VideoCallScreen"
//             component={VideoCallScreen}
//           />
//         </MainStack.Navigator>
//       </View>

//       {/* FIXED BOTTOM NAVIGATION BAR */}
//       <MainNavigationBar
//         activeTab={activeTab}
//         onTabPress={(tab) => setActiveTab(tab)}
//         style={{
//           paddingBottom: Platform.OS === "android" ? insets.bottom : 10,
//         }}
//       />
//     </View>
//   );
// }

import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MainNavigationBar, {
  MainNavigationTab,
} from "../components/navigation/MainNavigationBar";

// TAB SCREENS
import HomeScreen from "../screens/Home/HomeScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import MyProfileScreen from "../screens/Profile/MyProfileScreen";

// DEEP SCREENS
import {
  VideoCallScreen,
  VoiceCallScreen,
  IncomingCallScreen,
} from "../screens/Call";
import ConversationScreen from "../screens/Chat/ConversationScreen";
import InboxEmptyScreen from "../screens/Inbox/InboxEmptyScreen";
import MatchCelebrationScreen from "../screens/Matches/MatchCelebrationScreen";
import DashboardScreen from "../screens/Profile/DashboardScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
import ViewProfileScreen from "../screens/ViewMe/ViewProfileScreen";

// NEW SETTINGS NAVIGATOR

import { AppStackParamList } from "./NavigationTypes";

const TabStack = createNativeStackNavigator<AppStackParamList>();
const MainStack = createNativeStackNavigator<AppStackParamList>();

/* ---------------------- TABS ONLY ---------------------- */
function Tabs({ activeTab }: { activeTab: MainNavigationTab }) {
  function getTabComponent() {
    switch (activeTab) {
      case "Home":
        return HomeScreen;
      case "Inbox":
        return InboxScreen;
      case "Matches":
        return MyMatchesScreen;
      case "Profile":
        return MyProfileScreen;
      default:
        return HomeScreen;
    }
  }

  const TabComponent = getTabComponent();

  return (
    <TabStack.Navigator
      screenOptions={{ headerShown: false, animation: "none" }}
    >
      <TabStack.Screen name="TabRoot" component={TabComponent} />
    </TabStack.Navigator>
  );
}

/* ---------------------- MAIN LAYOUT ---------------------- */
export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MainNavigationTab>("Home");

  return (
    <View style={{ flex: 1 }}>
      {/* MAIN STACK */}
      <View style={{ flex: 1 }}>
        <MainStack.Navigator screenOptions={{ headerShown: false }}>
          {/* TABS */}
          <MainStack.Screen name="Tabs">
            {() => <Tabs activeTab={activeTab} />}
          </MainStack.Screen>

          {/* SETTINGS FLOW (stack inside Root) */}
          {/* <MainStack.Screen name="Settings" component={SettingNavigator} /> */}

          {/* OTHER DEEP SCREENS */}
          <MainStack.Screen
            name="ConversationScreen"
            component={ConversationScreen}
          />
          <MainStack.Screen
            name="InboxEmptyScreen"
            component={InboxEmptyScreen}
          />
          <MainStack.Screen
            name="MatchCelebrationScreen"
            component={MatchCelebrationScreen}
          />
          <MainStack.Screen
            name="PeopleViewedMeScreen"
            component={PeopleViewedMeScreen}
          />
          <MainStack.Screen
            name="ViewProfileScreen"
            component={ViewProfileScreen}
          />
          <MainStack.Screen
            name="ProfileViewScreen"
            component={ProfileViewScreen}
          />
          <MainStack.Screen
            name="DashboardScreen"
            component={DashboardScreen}
          />
          <MainStack.Screen
            name="VideoCallScreen"
            component={VideoCallScreen}
          />
          <MainStack.Screen
            name="VoiceCallScreen"
            component={VoiceCallScreen}
          />
          <MainStack.Screen
            name="IncomingCallScreen"
            component={IncomingCallScreen}
          />
        </MainStack.Navigator>
      </View>

      {/* FIXED BOTTOM NAVIGATION BAR */}
      <MainNavigationBar
        activeTab={activeTab}
        onTabPress={(tab) => setActiveTab(tab)}
        style={{
          paddingBottom: Platform.OS === "android" ? insets.bottom : 10,
        }}
      />
    </View>
  );
}
