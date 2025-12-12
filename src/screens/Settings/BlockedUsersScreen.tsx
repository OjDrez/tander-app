import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { blockReportApi, BlockedUser } from "@/src/api/blockReportApi";
import { photoApi } from "@/src/api/photoApi";

/**
 * BlockedUsersScreen
 *
 * Shows list of blocked users with option to unblock.
 * Senior-friendly design with large touch targets.
 */
export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadBlockedUsers();
    }, [])
  );

  const loadBlockedUsers = async () => {
    setIsLoading(true);
    try {
      const users = await blockReportApi.getBlockedUsers();
      setBlockedUsers(users);
    } catch (error) {
      console.error("Failed to load blocked users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${user.name}? They will be able to see your profile and send you messages again.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          style: "destructive",
          onPress: async () => {
            setUnblockingId(user.id);
            try {
              await blockReportApi.unblockUser(user.id);
              setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to unblock user. Please try again.");
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ]
    );
  };

  const getPhotoUrl = (url: string | null) => {
    if (!url) return null;
    return photoApi.getPhotoUrl(url);
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        {item.photoUrl ? (
          <Image source={{ uri: getPhotoUrl(item.photoUrl) || undefined }} style={styles.userPhoto} />
        ) : (
          <View style={styles.userPhotoPlaceholder}>
            <Ionicons name="person" size={24} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.userDetails}>
          <AppText size="body" weight="semibold" color={colors.textPrimary}>
            {item.name}
          </AppText>
          <AppText size="small" color={colors.textSecondary}>
            Blocked on {new Date(item.blockedAt).toLocaleDateString()}
          </AppText>
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item)}
        disabled={unblockingId === item.id}
        accessibilityRole="button"
        accessibilityLabel={`Unblock ${item.name}`}
      >
        {unblockingId === item.id ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <AppText size="small" weight="semibold" color={colors.primary}>
            Unblock
          </AppText>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={48} color={colors.textMuted} />
      </View>
      <AppText size="h4" weight="semibold" color={colors.textPrimary} style={styles.emptyTitle}>
        No Blocked Users
      </AppText>
      <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
        When you block someone, they'll appear here. You can unblock them anytime.
      </AppText>
    </View>
  );

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.85}
            style={styles.iconButton}
            onPress={handleGoBack}
          >
            <Ionicons
              name="chevron-back"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <AppText size="h3" weight="bold" style={styles.headerTitle}>
            Blocked Users
          </AppText>

          <View style={styles.logoRow}>
            <Image
              source={require("@/src/assets/icons/tander-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            <AppText weight="bold" color={colors.accentBlue}>
              TANDER
            </AppText>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color={colors.accentBlue} />
          <AppText size="small" color={colors.textSecondary} style={{ flex: 1, marginLeft: 10 }}>
            Blocked users cannot see your profile, send you messages, or match with you.
          </AppText>
        </View>

        {/* Blocked Users List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[
              styles.listContent,
              blockedUsers.length === 0 && styles.emptyListContent,
            ]}
            ListEmptyComponent={renderEmptyState}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </FullScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.backgroundLight,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  iconButton: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    textAlign: "left",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 34,
    height: 34,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.accentMint,
    marginHorizontal: 18,
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: 18,
    paddingBottom: 20,
    gap: 12,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  userPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  userPhotoPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
    gap: 2,
  },
  unblockButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.backgroundLight,
    borderRadius: 12,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
