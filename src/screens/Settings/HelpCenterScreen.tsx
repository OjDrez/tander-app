import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import NavigationService from "@/src/navigation/NavigationService";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

type HelpNav = NativeStackNavigationProp<AppStackParamList>;

const HELP_OPTIONS = [
  {
    key: "faq",
    title: "Frequently Asked Questions",
    icon: (
      <Ionicons name="help-circle-outline" size={20} color={colors.accentBlue} />
    ),
    screen: "FAQScreen",
  },
  {
    key: "contact",
    title: "Contact Support",
    icon: (
      <Ionicons name="chatbubbles-outline" size={20} color={colors.accentTeal} />
    ),
    screen: "ContactSupportScreen",
  },
  {
    key: "report",
    title: "Report a Problem",
    icon: (
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={22}
        color={colors.primary}
      />
    ),
    screen: "ReportProblemScreen",
  },
];

export default function HelpCenterScreen() {
  const navigation = useNavigation<HelpNav>();

  const handleGoBack = () => navigation.goBack();

  const handleNavigate = (screen: string) => () => {
    NavigationService.navigate(screen);
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <AppHeader title="Help Center" onBackPress={handleGoBack} />

          <View style={styles.sectionHeader}>
            <AppText size="h4" weight="bold" color={colors.textPrimary}>
              How can we help?
            </AppText>
            <AppText size="small" color={colors.textSecondary}>
              Access answers and support options to get assistance quickly.
            </AppText>
          </View>

          <View style={styles.cardGroup}>
            {HELP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={styles.listCard}
                activeOpacity={0.9}
                onPress={handleNavigate(option.screen)}
              >
                <View style={styles.itemLeft}>
                  <View style={styles.iconBadge}>{option.icon}</View>
                  <AppText weight="semibold" color={colors.textPrimary}>
                    {option.title}
                  </AppText>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  content: {
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 16,
  },
  sectionHeader: {
    gap: 6,
  },
  cardGroup: {
    gap: 12,
  },
  listCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.borderLight,
  },
});
