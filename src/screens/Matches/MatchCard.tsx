import React, { useCallback } from "react";
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import GradientButton from "@/src/components/buttons/GradientButton";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { RootStackParamList } from "@/src/navigation/NavigationTypes";

export type MatchAction = "chat" | "video";

export type MatchItem = {
  id: string;
  name: string;
  age: number;
  city: string;
  avatar: string;
  matchedOn: string;
  action: MatchAction;
};

interface MatchCardProps {
  item: MatchItem;
}

export default function MatchCard({ item }: MatchCardProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isChat = item.action === "chat";

  const handleCardPress = useCallback(() => {
    navigation.navigate("ProfileViewScreen", { userId: item.id });
  }, [navigation, item.id]);

  const handleActionPress = useCallback(() => {
    if (isChat) {
      navigation.navigate("ChatRoomScreen", { userId: item.id });
      return;
    }

    navigation.navigate("VideoCallScreen", { userId: item.id });
  }, [isChat, navigation, item.id]);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={handleCardPress}
    >
      <View style={styles.row}>
        <View>
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
          <View style={styles.badge}>
            <MaterialCommunityIcons name="heart" size={16} color={colors.white} />
          </View>
        </View>

        <View style={styles.infoContainer}>
          <AppText size="h4" weight="bold" style={styles.name}>
            {`${item.name}, ${item.age}`}
          </AppText>

          <View style={styles.locationRow}>
            <Ionicons name="location-sharp" size={16} color={colors.accentTeal} />
            <AppText size="tiny" weight="semibold" color={colors.textSecondary}>
              {`${item.city}, Philippines`}
            </AppText>
          </View>

          <AppText size="tiny" color={colors.textSecondary} style={styles.matchedOn}>
            Matched on {item.matchedOn}
          </AppText>
        </View>

        <View style={styles.actionContainer}>
          {isChat ? (
            <GradientButton
              title="Chat Now"
              onPress={handleActionPress}
              style={styles.primaryButton}
              textStyle={styles.primaryButtonText}
            />
          ) : (
            <TouchableOpacity
              style={styles.outlineButton}
              activeOpacity={0.85}
              onPress={handleActionPress}
            >
              <AppText weight="semibold" style={styles.outlineButtonText}>
                Video Call
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatar: {
    height: 70,
    width: 70,
    borderRadius: 35,
    backgroundColor: colors.borderLight,
  },
  badge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    height: 22,
    width: 22,
    borderRadius: 11,
    backgroundColor: colors.accentTeal,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadowMedium,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    color: colors.textPrimary,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  matchedOn: {
    marginTop: 6,
  },
  actionContainer: {
    marginLeft: 10,
    width: 110,
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 16,
  },
  primaryButtonText: {
    fontSize: 14,
  },
  outlineButton: {
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accentTeal,
    alignItems: "center",
    backgroundColor: colors.accentMint,
  },
  outlineButtonText: {
    color: colors.accentTeal,
    fontSize: 14,
  },
});

