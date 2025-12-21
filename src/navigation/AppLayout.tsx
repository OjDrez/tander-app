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
import { useNavigation } from "@react-navigation/native";
import React, { useState, useEffect, ReactNode } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import MainNavigationBar, {
  MainNavigationTab,
} from "../components/navigation/MainNavigationBar";
import ActiveCallBanner from "../components/call/ActiveCallBanner";

// TAB SCREENS
import HomeScreen from "../screens/Home/HomeScreen";
import InboxScreen from "../screens/Inbox/InboxScreen";
import MyMatchesScreen from "../screens/Matches/MyMatchesScreen";
import MyProfileScreen from "../screens/Profile/MyProfileScreen";
import TandyScreen from "../screens/Tandy/TandyScreen";

// DEEP SCREENS
import {
  VideoCallScreen,
  VoiceCallScreen,
  IncomingCallScreen,
} from "../screens/Call";
import ConversationScreen from "../screens/Chat/ConversationScreen";
import DiscoveryScreen from "../screens/Discovery/DiscoveryScreen";
import InboxEmptyScreen from "../screens/Inbox/InboxEmptyScreen";
import MatchCelebrationScreen from "../screens/Matches/MatchCelebrationScreen";
import MatchesScreen from "../screens/Matches/MatchesScreen";
import ProfileViewScreen from "../screens/Profile/ProfileViewScreen";
import PeopleViewedMeScreen from "../screens/ViewMe/PeopleViewedMeScreen";
import ViewProfileScreen from "../screens/ViewMe/ViewProfileScreen";
import BreathingExerciseScreen from "../screens/Tandy/BreathingExerciseScreen";

// SERVICES
import { notificationService } from "../services/notificationService";
import { matchingApi } from "../api/matchingApi";

// CONTEXT - Extracted to avoid circular dependency
import {
  MainStackNavigationProvider,
  MainStackNavigation,
} from "../context/MainStackNavigationContext";

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
      case "Tandy":
        return TandyScreen;
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

// Screens where the bottom navigation should be visible
const MAIN_TAB_SCREENS = ["Tabs", "TabRoot"];

// Screens where the active call banner should NOT be shown (already on a call screen)
const CALL_SCREENS = ["VideoCallScreen", "VoiceCallScreen", "IncomingCallScreen"];

/* ---------------------- NAVIGATION PROVIDER WRAPPER ---------------------- */
// This component captures the MainStack navigation and provides it to children outside the navigator
function NavigationProviderScreen({
  children,
  setNavigation
}: {
  children: ReactNode;
  setNavigation: (nav: MainStackNavigation) => void;
}) {
  const navigation = useNavigation<MainStackNavigation>();

  useEffect(() => {
    setNavigation(navigation);
  }, [navigation, setNavigation]);

  return <>{children}</>;
}

/* ---------------------- MAIN LAYOUT ---------------------- */
export default function AppLayout() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<MainNavigationTab>("Home");
  const [currentRouteName, setCurrentRouteName] = useState<string>("Tabs");
  const [mainStackNav, setMainStackNav] = useState<MainStackNavigation | null>(null);

  // Only show bottom nav on main tab screens (Home, Inbox, Matches, Profile)
  const showBottomNav = MAIN_TAB_SCREENS.includes(currentRouteName);

  // Don't show call banner when already on a call screen
  const showCallBanner = !CALL_SCREENS.includes(currentRouteName);

  // Initialize notifications and schedule expiration reminders
  useEffect(() => {
    const initNotifications = async () => {
      try {
        // Request notification permissions
        await notificationService.requestPermissions();

        // Schedule expiration reminders for all active matches
        const matches = await matchingApi.getMatchesList();
        await notificationService.scheduleExpirationReminders(matches);

        console.log('Notifications initialized');
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
      }
    };

    initNotifications();
  }, []);

  return (
    <MainStackNavigationProvider navigation={mainStackNav}>
      <View style={{ flex: 1 }}>
        {/* ACTIVE CALL BANNER - Shows when there's an ongoing call and user navigated away */}
        {showCallBanner && <ActiveCallBanner />}

        {/* MAIN STACK */}
        <View style={{ flex: 1 }}>
          <MainStack.Navigator
            screenOptions={{ headerShown: false }}
            screenListeners={{
              state: (e) => {
                // Track navigation state changes to show/hide bottom nav
                const state = e.data.state;
                if (state && state.routes && state.routes.length > 0) {
                  const route = state.routes[state.index];
                  setCurrentRouteName(route?.name || "Tabs");
                }
              },
            }}
          >
            {/* TABS - wrapped to capture navigation context */}
            <MainStack.Screen name="Tabs">
              {() => (
                <NavigationProviderScreen setNavigation={setMainStackNav}>
                  <Tabs activeTab={activeTab} />
                </NavigationProviderScreen>
              )}
            </MainStack.Screen>

            {/* DISCOVERY & MATCHING */}
            <MainStack.Screen
              name="DiscoveryScreen"
              component={DiscoveryScreen}
            />
            <MainStack.Screen
              name="MyMatchesScreen"
              component={MatchesScreen}
            />

            {/* CHAT & MESSAGING */}
            <MainStack.Screen
              name="ConversationScreen"
              component={ConversationScreen}
            />
            <MainStack.Screen
              name="InboxEmptyScreen"
              component={InboxEmptyScreen}
            />

            {/* CELEBRATION */}
            <MainStack.Screen
              name="MatchCelebrationScreen"
              component={MatchCelebrationScreen}
            />

            {/* PROFILE SCREENS */}
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

            {/* CALLS */}
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

            {/* TANDY BREATHING EXERCISE */}
            <MainStack.Screen
              name="BreathingExerciseScreen"
              component={BreathingExerciseScreen}
            />
          </MainStack.Navigator>
        </View>

        {/* FIXED BOTTOM NAVIGATION BAR - Only visible on main tab screens */}
        {showBottomNav && (
          <MainNavigationBar
            activeTab={activeTab}
            onTabPress={(tab) => setActiveTab(tab)}
            style={{
              paddingBottom: Platform.OS === "android" ? insets.bottom : 10,
            }}
          />
        )}
      </View>
    </MainStackNavigationProvider>
  );
}
