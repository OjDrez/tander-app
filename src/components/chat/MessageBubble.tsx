import colors from "@/src/config/colors";
import AppText from "@/src/components/inputs/AppText";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";

type MessageBubbleProps = {
  text: string;
  time: string;
  isOwn?: boolean;
};

export default function MessageBubble({ text, time, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.outgoing : styles.incoming,
          Platform.OS === "ios" ? styles.shadow : styles.elevated,
        ]}
      >
        <AppText
          size="small"
          weight={isOwn ? "semibold" : "normal"}
          color={isOwn ? colors.white : colors.textPrimary}
          style={styles.messageText}
        >
          {text}
        </AppText>
      </View>
      <AppText size="tiny" color={colors.textMuted} style={styles.timestamp}>
        {time}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "75%",
    marginBottom: 12,
  },
  alignEnd: {
    alignSelf: "flex-end",
  },
  alignStart: {
    alignSelf: "flex-start",
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  incoming: {
    backgroundColor: colors.backgroundLight,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 18,
  },
  outgoing: {
    backgroundColor: colors.accentTeal,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 10,
  },
  messageText: {
    lineHeight: 21,
  },
  timestamp: {
    marginTop: 6,
    alignSelf: "flex-end",
  },
  shadow: {
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  elevated: {
    elevation: 2,
  },
});
