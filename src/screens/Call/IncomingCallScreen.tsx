/**
 * Incoming Call Screen
 * Wrapper that transforms incoming call parameters to CallScreen format
 */
import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import CallScreen from "./CallScreen";

export default function IncomingCallScreen(
  props: NativeStackScreenProps<AppStackParamList, "IncomingCallScreen">
) {
  const { callerId, callerName, callerUsername, callType, roomId, callId } = props.route.params;

  // Convert to CallScreenParams format
  // - username should be the unique identifier (callerUsername)
  // - callerName is the display name
  const callParams = {
    userId: callerId,
    username: callerUsername, // Use the actual username for identification
    callType,
    roomId,
    callId,
    isIncoming: true,
    callerName: callerName || callerUsername, // Use callerName for display, fallback to username
  };

  return (
    <CallScreen
      route={{ params: callParams }}
      isVideoCall={callType === "video"}
    />
  );
}
