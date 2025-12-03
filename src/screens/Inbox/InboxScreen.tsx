import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import InboxRow from "@/src/components/inbox/InboxRow";
import PeopleYouMayKnowRow from "@/src/components/inbox/PeopleYouMayKnowRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

const suggestedPeople = [
  {
    id: "ramon",
    name: "Ramon",
    age: 70,
    avatar:
      "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "gloria",
    name: "Gloria",
    age: 69,
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "faye",
    name: "Faye",
    age: 65,
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=300&q=80",
  },
  {
    id: "mike",
    name: "Mike",
    age: 68,
    avatar:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
  },
];

const mockConversations = [
  {
    id: "felix",
    name: "Felix",
    message: "Kamusta po?",
    timestamp: "2m ago",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    favorite: true,
  },
  {
    id: "jericho",
    name: "Jericho Ramos",
    message: "Hello, Felix, kamusta po?",
    timestamp: "5m ago",
    avatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    favorite: false,
  },
  {
    id: "lydia",
    name: "Lydia Gomez",
    message: "Hello, Felix, kamusta po?",
    timestamp: "10m ago",
    avatar:
      "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?auto=format&fit=crop&w=200&q=80",
    favorite: false,
  },
];

export default function InboxScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [conversations, setConversations] = useState(mockConversations);

  const handlePressConversation = (userId: string) => {
    navigation.navigate("ConversationScreen", { userId });
  };

  const handlePressAvatar = (userId: string) => {
    navigation.navigate("DashboardScreen", { userId });
  };

  const toggleFavorite = (userId: string) => {
    setConversations((prev) =>
      prev.map((item) =>
        item.id === userId ? { ...item, favorite: !item.favorite } : item
      )
    );
  };

  const isEmpty = conversations.length === 0;

  useEffect(() => {
    if (isEmpty) {
      navigation.replace("InboxEmptyScreen");
    }
  }, [isEmpty, navigation]);

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <AppHeader
          title="Inbox"
          rightContent={
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconCircle} activeOpacity={0.88}>
                <Ionicons name="create-outline" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconCircle} activeOpacity={0.88}>
                <Ionicons name="videocam" size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          }
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={["#FFF3E4", "#EAF7F5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.peopleCard}
          >
            <PeopleYouMayKnowRow people={suggestedPeople} onSelect={handlePressAvatar} />
          </LinearGradient>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Messages</Text>
            <Ionicons name="mail-open" size={18} color={colors.textSecondary} />
          </View>

          <View style={styles.list}>
            {conversations.map((chat) => (
              <InboxRow
                key={chat.id}
                id={chat.id}
                name={chat.name}
                message={chat.message}
                timestamp={chat.timestamp}
                avatar={chat.avatar}
                isFavorite={chat.favorite}
                onPress={handlePressConversation}
                onToggleFavorite={toggleFavorite}
                onPressAvatar={handlePressAvatar}
              />
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
  },
  gradient: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    gap: 16,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconCircle: {
    height: 38,
    width: 38,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderMedium,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  peopleCard: {
    borderRadius: 20,
    padding: 10,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  list: {
    gap: 12,
  },
});
