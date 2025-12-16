import colors from "@/src/config/colors";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import PeopleYouMayKnowRow from "@/src/components/inbox/PeopleYouMayKnowRow";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { discoveryApi } from "@/src/api/discoveryApi";
import { getFullPhotoUrl } from "@/src/api/chatApi";
import { DiscoveryProfile } from "@/src/types/matching";

type SuggestedPerson = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  userId?: number;
};

export default function InboxEmptyScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const [suggestedPeople, setSuggestedPeople] = useState<SuggestedPerson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load suggested profiles from API
  const loadSuggestedPeople = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch real profiles from discovery API
      const profiles = await discoveryApi.getProfileBatch(6);

      // Convert to the format PeopleYouMayKnowRow expects
      const suggested: SuggestedPerson[] = profiles.map((profile: DiscoveryProfile) => {
        // Convert relative photo URL to full URL with fallback
        const fullPhotoUrl = getFullPhotoUrl(profile.profilePhotoUrl);
        const avatarUrl = fullPhotoUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=random`;

        return {
          id: profile.userId.toString(),
          name: profile.displayName,
          age: profile.age || 0,
          avatar: avatarUrl,
          userId: profile.userId,
        };
      });

      setSuggestedPeople(suggested);
    } catch (err) {
      console.error("[InboxEmptyScreen] Failed to load suggested people:", err);
      setError("Unable to load suggestions");
      setSuggestedPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load on screen focus
  useFocusEffect(
    useCallback(() => {
      loadSuggestedPeople();
    }, [loadSuggestedPeople])
  );

  const handleSelectPerson = (userId: string) => {
    navigation.navigate("ViewProfileScreen", { userId });
  };

  const handleStartDiscovery = () => {
    navigation.navigate("MatchesScreen");
  };

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
          {/* Show suggested people only if we have real data */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Finding people for you...</Text>
            </View>
          ) : suggestedPeople.length > 0 ? (
            <LinearGradient
              colors={["#FFF3E4", "#EAF7F5"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.peopleCard}
            >
              <PeopleYouMayKnowRow
                people={suggestedPeople}
                onSelect={handleSelectPerson}
              />
            </LinearGradient>
          ) : null}

          <View style={styles.emptyState}>
            <View style={styles.illustration}>
              <Ionicons name="chatbubble-ellipses" size={80} color={colors.accentTeal} />
            </View>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Match with people to start conversations
            </Text>
            <TouchableOpacity
              style={styles.discoverButton}
              onPress={handleStartDiscovery}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Start discovering people"
            >
              <Ionicons name="heart" size={20} color={colors.white} />
              <Text style={styles.discoverButtonText}>Start Discovering</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  discoverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    minHeight: 56,
  },
  discoverButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});
