import React from "react";
import { StyleSheet, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { RootStackParamList } from "@/src/navigation/NavigationTypes";

type Props = NativeStackScreenProps<RootStackParamList, "ChatRoomScreen">;

export default function ChatRoomScreen({ route }: Props) {
  const { userId } = route.params;

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <View style={styles.content}>
        <AppText size="h3" weight="bold" style={styles.title}>
          Chat Room
        </AppText>
        <AppText color={colors.textSecondary}>
          Chat with user {userId}
        </AppText>
      </View>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  content: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
  },
});

