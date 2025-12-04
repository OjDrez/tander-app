import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import PeopleYouMayKnowRow from "@/src/components/inbox/PeopleYouMayKnowRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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

export default function InboxEmptyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <LinearGradient
        colors={colors.gradients.softAqua.array}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <AppHeader title="Inbox" />

        <View style={styles.content}>
          <LinearGradient
            colors={["#FFF3E4", "#EAF7F5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.peopleCard}
          >
            <PeopleYouMayKnowRow
              people={suggestedPeople}
              onSelect={(userId) => navigation.navigate("DashboardScreen", { userId })}
            />
          </LinearGradient>

          <View style={styles.emptyState}>
            <View style={styles.illustration}>
              <Ionicons name="chatbubble-ellipses" size={80} color={colors.accentTeal} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              When you have messages, they’ll show up here
            </Text>
          </View>
        </View>
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
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 40,
    gap: 18,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  illustration: {
    height: 180,
    width: 180,
    borderRadius: 90,
    backgroundColor: "rgba(51,169,162,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
