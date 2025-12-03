import React, { useMemo, useCallback } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeaderWithLogo from "@/src/components/common/AppHeaderWithLogo";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";

import MatchCard, { MatchItem } from "./MatchCard";

const MOCK_MATCHES: MatchItem[] = [
  {
    id: "1",
    name: "Ramon Cruz",
    age: 70,
    city: "Quezon City",
    avatar:
      "https://images.generated.photos/OGnuSQO-6vVK_95B2NVPWcZEDyRGteSmaAXdCx4q1Ic/rs:fit:512:512/czM6Ly9p/ZGVudGl0eS5j/LmNvbS9pLzAw/LzA0Lzg2LzI5/LzAwMDQ4NjI5/MzAuanBn.jpg",
    matchedOn: "June 28, 2025",
    action: "chat",
  },
  {
    id: "2",
    name: "Gloria Ramos",
    age: 70,
    city: "Quezon City",
    avatar:
      "https://images.generated.photos/wlxM18S5zq-48iIrCZk3QQk9r4Zglhmy-tPHTTEA6z0/rs:fit:512:512/czM6Ly9p/ZGVudGl0eS5j/LmNvbS9pLzAw/LzA0LzY2LzM3/LzAwMDQ2NjM3/MzQuanBn.jpg",
    matchedOn: "June 28, 2025",
    action: "video",
  },
  {
    id: "3",
    name: "Faye Castro",
    age: 68,
    city: "Manila",
    avatar:
      "https://images.generated.photos/4bhk0YZ39Vnu6zfRCVCrOfZyao8RzWPr6Kz-cueETMo/rs:fit:512:512/czM6Ly9p/ZGVudGl0eS5j/LmNvbS9pLzAw/LzA2LzEyLzMz/LzAwMDYxMjMz/Ni5qcGc.jpg",
    matchedOn: "June 28, 2025",
    action: "chat",
  },
  {
    id: "4",
    name: "Mark Ifacio",
    age: 70,
    city: "Quezon City",
    avatar:
      "https://images.generated.photos/hWdOl_k1gOnI9jr6U4uY00S_T4yFKGzvrZTw4lxGkxA/rs:fit:512:512/czM6Ly9p/ZGVudGl0eS5j/LmNvbS9pLzAw/LzA2LzI3LzAz/LzAwMDYyNzAz/NS5qcGc.jpg",
    matchedOn: "June 28, 2025",
    action: "chat",
  },
];

export default function MyMatchesScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const data = useMemo(() => MOCK_MATCHES, []);

  const handleCardPress = useCallback((userId: string) => {
    navigation.navigate("ProfileViewScreen", { userId });
  }, [navigation]);

  const handleActionPress = useCallback((item: MatchItem) => {
    if (item.action === "chat") {
      navigation.navigate("ConversationScreen", { userId: item.id });
    } else {
      navigation.navigate("VideoCallScreen", { userId: item.id });
    }
  }, [navigation]);

  return (
    <FullScreen statusBarStyle="dark" style={styles.container}>
      <View style={styles.header}>
        <AppHeaderWithLogo />
        <AppText size="h3" weight="bold" style={styles.title}>
          My Matches
        </AppText>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MatchCard
            item={item}
            onPress={handleCardPress}
            onActionPress={handleActionPress}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    marginTop: 4,
    color: colors.textPrimary,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 16,
  },
});

