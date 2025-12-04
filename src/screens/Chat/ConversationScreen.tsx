import MessageBubble from "@/src/components/chat/MessageBubble";
import MessageInputBar from "@/src/components/chat/MessageInputBar";
import AppText from "@/src/components/inputs/AppText";
import Screen from "@/src/components/layout/Screen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ChatMessage = {
  id: string;
  text: string;
  time: string;
  isOwn: boolean;
  date: string;
};

type DateSeparator = {
  id: string;
  type: "date";
  label: string;
};

type ChatListItem = ChatMessage | DateSeparator;

const initialMessages: ChatMessage[] = [
  {
    id: "1",
    text: "Kamusta po?",
    time: "5:58 PM",
    isOwn: false,
    date: "2024-06-10",
  },
  {
    id: "2",
    text: "Hello! Ok naman, eto nagluluto ng Adobo Baboy.",
    time: "5:59 PM",
    isOwn: true,
    date: "2024-06-10",
  },
  {
    id: "3",
    text: "Wow! Gusto ko matikman yan next time magkita tayo!",
    time: "5:59 PM",
    isOwn: false,
    date: "2024-06-10",
  },
  {
    id: "4",
    text: "Sure, magaya kita tayo sa Rainforest, papakain ko sa iyo yung niluto ko. Tapos lakad tayo sa park!",
    time: "6:00 PM",
    isOwn: true,
    date: "2024-06-10",
  },
  {
    id: "5",
    text: "Sige, sige, Faye. Kita Kits tayo kapag natapos ko na itong niluluto ko. See you!",
    time: "6:01 PM",
    isOwn: false,
    date: "2024-06-11",
  },
  {
    id: "6",
    text: "Ok cge! Enjoy mo pagluluto mo, message mo lang ako pag tapos ka na!",
    time: "6:02 PM",
    isOwn: true,
    date: "2024-06-11",
  },
];

export default function ConversationScreen({
  route,
}: NativeStackScreenProps<AppStackParamList, "ConversationScreen">) {
  const { userId } = route.params;
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const insets = useSafeAreaInsets();

  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const flatListRef = useRef<FlatList<ChatListItem>>(null);

  const formattedMessages = useMemo<ChatListItem[]>(() => {
    const items: ChatListItem[] = [];
    let lastDate = "";

    messages.forEach((message) => {
      if (message.date !== lastDate) {
        items.push({
          id: `date-${message.date}`,
          type: "date",
          label: formatDateLabel(message.date),
        });
        lastDate = message.date;
      }
      items.push(message);
    });

    return items;
  }, [messages]);

  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [formattedMessages.length]);

  const handleVideoCall = () => {
    navigation.navigate("VideoCallScreen", { userId });
  };

  const handleSend = () => {
    if (!messageText.trim()) return;

    const now = new Date();
    const newMessage: ChatMessage = {
      id: `${now.getTime()}`,
      text: messageText.trim(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isOwn: true,
      date: now.toISOString().slice(0, 10),
    };

    setMessages((prev) => [...prev, newMessage]);
    setMessageText("");
  };

  const renderItem = ({ item }: { item: ChatListItem }) => {
    if ((item as DateSeparator).type === "date") {
      const dateItem = item as DateSeparator;
      return (
        <View style={styles.dateSeparator}>
          <View style={styles.separatorLine} />
          <AppText size="tiny" weight="medium" color={colors.textSecondary}>
            {dateItem.label}
          </AppText>
          <View style={styles.separatorLine} />
        </View>
      );
    }

    const msg = item as ChatMessage;
    return <MessageBubble text={msg.text} time={msg.time} isOwn={msg.isOwn} />;
  };

  return (
    <Screen backgroundColor={colors.white}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={insets.top + 8}
        >
          <View style={styles.contentWrapper}>
            <AppHeader
              onBackPress={() => navigation.goBack()}
              centerContent={
                <View style={styles.headerUserRow}>
                  <Image
                    source={{
                      uri: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
                    }}
                    style={styles.avatar}
                  />
                  <View>
                    <AppText
                      weight="bold"
                      size="body"
                      color={colors.textPrimary}
                    >
                      Felix
                    </AppText>
                    <AppText size="tiny" color={colors.textSecondary}>
                      Active now
                    </AppText>
                  </View>
                </View>
              }
              rightContent={
                <View style={styles.headerActions}>
                  <View style={styles.statusDot} />
                  <AppText size="tiny" color={colors.textSecondary}>
                    Video Call
                  </AppText>

                  <TouchableOpacity
                    style={styles.videoButton}
                    onPress={handleVideoCall}
                  >
                    <Ionicons name="videocam" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              }
            />

            <FlatList
              ref={flatListRef}
              data={formattedMessages}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
            />

            <View
              style={[
                styles.inputContainer,
                { paddingBottom: Math.max(insets.bottom, 10) },
              ]}
            >
              <MessageInputBar
                value={messageText}
                onChangeText={setMessageText}
                onSend={handleSend}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Screen>
  );
}

function formatDateLabel(dateString: string) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const dateObj = new Date(dateString);

  if (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  )
    return "Today";

  if (
    dateObj.getDate() === yesterday.getDate() &&
    dateObj.getMonth() === yesterday.getMonth() &&
    dateObj.getFullYear() === yesterday.getFullYear()
  )
    return "Yesterday";

  return dateObj.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  flex: { flex: 1 },

  contentWrapper: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    marginTop: 6,
  },

  headerUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  avatar: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: colors.borderLight,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 6,
  },

  statusDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },

  videoButton: {
    backgroundColor: colors.accentTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },

  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  dateSeparator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginVertical: 6,
  },

  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderMedium,
  },

  inputContainer: {
    backgroundColor: colors.white,
  },
});
