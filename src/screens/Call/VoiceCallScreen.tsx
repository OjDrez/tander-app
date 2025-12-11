import React from "react";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import CallScreen from "./CallScreen";

export default function VoiceCallScreen(
  props: NativeStackScreenProps<AppStackParamList, "VoiceCallScreen">
) {
  return <CallScreen route={props.route} isVideoCall={false} />;
}
