import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

import FullScreen from "@/src/components/layout/FullScreen";
import LoadingIndicator from "@/src/components/common/LoadingIndicator";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { blockReportApi, BlockedUser } from "@/src/api/blockReportApi";
import { photoApi } from "@/src/api/photoApi";
import { useToast } from "@/src/context/ToastContext";

/**
 * BlockedUsersScreen
 *
 * Shows list of blocked users with option to unblock.
 * Senior-friendly design with large touch targets and clear labels.
 */
export default function BlockedUsersScreen() {
  const navigation = useNavigation();
  const { success, error, confirm } = useToast();
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
    } catch (err) {
      console.error("Failed to load blocked users:", err);
      error("We had trouble loading your blocked users list. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => navigation.goBack();

  const handleUnblock = async (user: BlockedUser) => {
    const confirmed = await confirm({
      title: "Unblock This Person?",
      message: `Are you sure you want to unblock ${user.name}? Once unblocked, they will be able to see your profile, send you messages, and match with you.`,
      type: "warning",
      confirmText: "Yes, Unblock",
      cancelText: "No, Keep Blocked",
    });

    if (confirmed) {
      setUnblockingId(user.id);
      try {
        await blockReportApi.unblockUser(user.id);
        setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
        success(`${user.name} has been unblocked successfully.`);
      } catch (err: any) {
        error(err.message || "Something went wrong. Please try again.");
      } finally {
        setUnblockingId(null);
      }
    }
  };

  const getPhotoUrl = (url: string | null) => {
    if (!url) return null;
    return photoApi.getPhotoUrl(url);
  };

  const formatBlockedDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        {item.photoUrl ? (
          <Image
            source={{ uri: getPhotoUrl(item.photoUrl) || undefined }}
            style={styles.userPhoto}
          />
        ) : (
          <View style={styles.userPhotoPlaceholder}>
            <Ionicons name="person" size={32} color={colors.textMuted} />
          </View>
        )}
        <View style={styles.userDetails}>
          <AppText size="h4" weight="semibold" color={colors.textPrimary}>
            {item.name}
          </AppText>
          <View style={styles.blockedDateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <AppText size="body" color={colors.textSecondary}>
              Blocked on {formatBlockedDate(item.blockedAt)}
            </AppText>
          </View>
        </View>
      </View>

      <View style={styles.blockedInfo}>
        <View style={styles.blockedBadge}>
          <Ionicons name="ban" size={18} color={colors.danger} />
          <AppText size="small" weight="semibold" color={colors.danger}>
            BLOCKED
          </AppText>
        </View>
        <AppText size="body" color={colors.textSecondary} style={styles.blockedDescription}>
          This person cannot see your profile or contact you
        </AppText>
      </View>

      <TouchableOpacity
        style={[
          styles.unblockButton,
          unblockingId === item.id && styles.unblockButtonDisabled
        ]}
        onPress={() => handleUnblock(item)}
        disabled={unblockingId === item.id}
        accessibilityRole="button"
        accessibilityLabel={`Unblock ${item.name}`}
        activeOpacity={0.85}
      >
        {unblockingId === item.id ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator size="small" color={colors.white} />
            <AppText size="body" weight="semibold" color={colors.white}>
              Unblocking...
            </AppText>
          </View>
        ) : (
          <View style={styles.buttonContent}>
            <Ionicons name="person-add" size={22} color={colors.white} />
            <AppText size="body" weight="semibold" color={colors.white}>
              Unblock This Person
            </AppText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="people-outline" size={56} color={colors.textMuted} />
      </View>
      <AppText size="h3" weight="bold" color={colors.textPrimary} style={styles.emptyTitle}>
        No Blocked Users
      </AppText>
      <AppText size="body" color={colors.textSecondary} style={styles.emptyText}>
        You haven't blocked anyone yet. When you block someone, they'll appear here so you can manage them.
      </AppText>
      <View style={styles.emptyTip}>
        <Ionicons name="information-circle" size={22} color={colors.accentBlue} />
        <AppText size="body" color={colors.textSecondary} style={styles.emptyTipText}>
          To block someone, go to their profile and tap the menu icon (three dots).
        </AppText>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <View style={styles.titleIcon}>
          <Ionicons name="hand-left" size={36} color={colors.primary} />
        </View>
        <AppText size="h2" weight="bold" color={colors.textPrimary}>
          Blocked Users
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
          Manage people you've blocked. You can unblock them at any time.
        </AppText>
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <View style={styles.infoBannerHeader}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <AppText size="h4" weight="semibold" color={colors.textPrimary}>
            What Blocking Does
          </AppText>
        </View>
        <View style={styles.infoList}>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <AppText size="body" color={colors.textSecondary}>
              They can't see your profile
            </AppText>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <AppText size="body" color={colors.textSecondary}>
              They can't send you messages
            </AppText>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <AppText size="body" color={colors.textSecondary}>
              They can't match with you
            </AppText>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <AppText size="body" color={colors.textSecondary}>
              They won't know they're blocked
            </AppText>
          </View>
        </View>
      </View>

      {/* Count Badge */}
      {blockedUsers.length > 0 && (
        <View style={styles.countBanner}>
          <AppText size="h4" weight="semibold" color={colors.textPrimary}>
            {blockedUsers.length} {blockedUsers.length === 1 ? 'Person' : 'People'} Blocked
          </AppText>
        </View>
      )}
    </View>
  );

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            activeOpacity={0.85}
            style={styles.backButton}
            onPress={handleGoBack}
          >
            <Ionicons name="chevron-back" size={28} color={colors.textPrimary} />
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Back
            </AppText>
          </TouchableOpacity>

          <View style={styles.logoRow}>
            <Image
              source={require("@/src/assets/icons/tander-logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingIndicator
            variant="inline"
            message="Loading blocked users..."
          />
        ) : (
          <FlatList
            data={blockedUsers}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={renderHeader}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingRight: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 44,
    height: 44,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  listHeader: {
    gap: 20,
    marginBottom: 24,
  },
  titleSection: {
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  infoBanner: {
    backgroundColor: colors.success + '10',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  infoBannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoList: {
    gap: 10,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBanner: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  userCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    gap: 16,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  userPhoto: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  userPhotoPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
    gap: 6,
  },
  blockedDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  blockedInfo: {
    backgroundColor: colors.danger + '08',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  blockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  blockedDescription: {
    lineHeight: 22,
  },
  unblockButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  unblockButtonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },
  emptyTip: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.accentMint,
    padding: 16,
    borderRadius: 14,
    gap: 12,
    marginTop: 8,
  },
  emptyTipText: {
    flex: 1,
    lineHeight: 22,
  },
});
