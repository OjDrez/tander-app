import colors from "@/src/config/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type MessageBubbleProps = {
  text: string;
  time: string;
  isOwn?: boolean;
};

export default function MessageBubble({ text, time, isOwn }: MessageBubbleProps) {
  return (
    <View style={[styles.container, isOwn ? styles.alignEnd : styles.alignStart]}>
      <View style={[styles.bubble, isOwn ? styles.outgoing : styles.incoming]}>
        <Text style={[styles.text, isOwn ? styles.textOutgoing : styles.textIncoming]}>
          {text}
        </Text>
      </View>
      <Text style={styles.timestamp}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: "90%",
    marginBottom: 10,
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
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  incoming: {
    backgroundColor: "#F5F6F7",
    borderTopLeftRadius: 8,
  },
  outgoing: {
    backgroundColor: colors.accentTeal,
    borderTopRightRadius: 8,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textIncoming: {
    color: colors.textPrimary,
  },
  textOutgoing: {
    color: colors.white,
    fontWeight: "600",
  },
  timestamp: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
  },
});
