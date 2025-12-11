import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import CallScreen from "./CallScreen";

export default function IncomingCallScreen(
  props: NativeStackScreenProps<AppStackParamList, "IncomingCallScreen">
) {
  const { callerId, callerName, callerUsername, callType, roomId, callId } = props.route.params;

  // Convert to CallScreenParams format
  const callParams = {
    userId: callerId,
    username: callerName || callerUsername,
    callType,
    roomId,
    callId,
    isIncoming: true,
    callerName,
  };

  return (
    <CallScreen
      route={{ params: callParams }}
      isVideoCall={callType === "video"}
    />
  );
}
