import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CallType } from "../types/chat";

/**
 * ROOT NAVIGATION
 * (Your main navigator: Onboarding → Auth → Home)
 */
export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  HomeScreen: undefined;
  Settings: undefined;
};

/**
 * Incoming call data for passing to call screens
 */
export type IncomingCallData = {
  roomId: string;
  callId: number;
  callerId: number;
  callerUsername: string;
  callerName?: string;
  callType: CallType;
};

/**
 * Call screen params shared between video and voice calls
 */
export type CallScreenParams = {
  userId: number;
  username: string;
  callType?: CallType;
  roomId?: string;
  callId?: number;
  isIncoming?: boolean;
  callerName?: string;
  incomingCallData?: IncomingCallData;
};

/**
 * MAIN APP STACK (after onboarding/auth)
 */
export type AppStackParamList = {
  // Internal tab navigation
  Tabs: undefined;
  TabRoot: undefined;
  HomeScreen: undefined;
  DiscoveryScreen: undefined;
  InboxScreen: undefined;
  InboxEmptyScreen: undefined;
  ConversationScreen: {
    conversationId: number;
    otherUserId: number;
    otherUserName: string;
    avatarUrl?: string;
    roomId?: string;
  };
  MessageThreadScreen: { userId: string };
  MyMatchesScreen: undefined;
  MatchesScreen: undefined;
  MatchCelebrationScreen: { user1: string; user2: string };
  PeopleViewedMeScreen: undefined;
  MyProfileScreen: undefined;
  ProfileViewScreen: { userId: string };
  ViewProfileScreen: { userId: string };
  ViewProfileDetailsScreen: { userId: string };
  SettingsScreen: undefined;
  EditProfileScreen: undefined;
  EditBasicInfoScreen: undefined;
  EditAboutYouScreen: undefined;
  EditBioScreen: undefined;
  PaymentMethodsScreen: undefined;
  PrivacyScreen: undefined;
  BlockedUsersScreen: undefined;
  ChangePasswordScreen: undefined;
  SecuritySettingsScreen: undefined;
  IdVerificationScreen: undefined;
  HelpCenterScreen: undefined;
  VideoCallScreen: CallScreenParams;
  VoiceCallScreen: CallScreenParams;
  IncomingCallScreen: {
    callerId: number;
    callerName: string;
    callerUsername: string;
    callType: CallType;
    roomId: string;
    callId: number;
  };
};

/**
 * REGISTRATION FLOW (4-step signup)
 * Step1: Basic Info (required)
 * Step2: ID Verification (required)
 * Step3: Photo Upload (skippable)
 * Step4: About You (skippable)
 */
export type RegistrationStackParamList = {
  Step1: undefined;
  Step2: undefined;
  Step3: undefined;
  Step4: undefined;
  RegistrationComplete: undefined;
};

/**
 * TYPED NAVIGATION FOR EACH REGISTRATION SCREEN
 */
export type Step1Nav = NativeStackNavigationProp<
  RegistrationStackParamList,
  "Step1"
>;

export type Step2Nav = NativeStackNavigationProp<
  RegistrationStackParamList,
  "Step2"
>;

export type Step3Nav = NativeStackNavigationProp<
  RegistrationStackParamList,
  "Step3"
>;

export type Step4Nav = NativeStackNavigationProp<
  RegistrationStackParamList,
  "Step4"
>;

export type RegistrationCompleteNav = NativeStackNavigationProp<
  RegistrationStackParamList,
  "RegistrationComplete"
>;
