import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import FullScreen from "@/src/components/layout/FullScreen";
import AppText from "@/src/components/inputs/AppText";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { useToast } from "@/src/context/ToastContext";

// Enable layout animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HelpNav = NativeStackNavigationProp<AppStackParamList>;

// Senior-friendly FAQ items with clear, simple language
const FAQ_ITEMS = [
  {
    id: "1",
    icon: "camera-outline" as const,
    question: "How do I change my profile picture?",
    answer:
      "1. Go to Settings from your profile\n2. Tap on 'Edit Profile'\n3. Tap on your current photo at the top\n4. Choose to take a new photo or pick one from your gallery\n\nTip: Make sure you're in a well-lit area for the best photo!",
  },
  {
    id: "2",
    icon: "chatbubble-outline" as const,
    question: "How do I send a message to someone?",
    answer:
      "1. First, you need to match with someone (when you both like each other)\n2. Go to your 'Matches' section\n3. Tap on their profile\n4. Tap the message icon to start chatting\n\nTake your time - there's no rush!",
  },
  {
    id: "3",
    icon: "checkmark-circle-outline" as const,
    question: "What does 'Verified' mean?",
    answer:
      "A verified profile means we have confirmed the person is who they say they are. Look for a green checkmark on profiles.\n\nWe recommend connecting with verified members for your safety. You can also get verified in your Settings!",
  },
  {
    id: "4",
    icon: "ban-outline" as const,
    question: "How do I block someone?",
    answer:
      "If someone is bothering you:\n1. Go to their profile\n2. Tap the three dots (...) in the corner\n3. Select 'Block User'\n\nThey won't be able to contact you anymore. Your safety is our priority!",
  },
  {
    id: "5",
    icon: "key-outline" as const,
    question: "How do I change my password?",
    answer:
      "1. Go to Settings\n2. Tap 'Security Settings'\n3. Tap 'Change Password'\n4. Enter your current password\n5. Type your new password twice to confirm\n\nUse a password that's easy for you to remember but hard for others to guess.",
  },
  {
    id: "6",
    icon: "id-card-outline" as const,
    question: "Why should I verify my age?",
    answer:
      "Age verification helps us maintain a community of people 60 and older. It makes Tander a safer and more comfortable place where you can connect with people in your age group.\n\nYou can verify your age in Settings > Security Settings.",
  },
  {
    id: "7",
    icon: "videocam-outline" as const,
    question: "How do I make a video call?",
    answer:
      "1. Match with someone and exchange a few messages first\n2. Look for the video camera icon in your conversation\n3. Tap it to start a video call\n\nMake sure you're in a quiet, well-lit place for the best experience!",
  },
  {
    id: "8",
    icon: "shield-outline" as const,
    question: "Is my information safe?",
    answer:
      "Yes! We take your privacy very seriously.\n\n• Your personal information is never shared with other users\n• Only share what you're comfortable with\n• Never share your password or financial information with anyone\n\nIf you have concerns, contact our support team.",
  },
];

const SUPPORT_EMAIL = "support@tander.com";
const SUPPORT_PHONE = "1-800-TANDER";

export default function HelpCenterScreen() {
  const navigation = useNavigation<HelpNav>();
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const handleGoBack = () => navigation.goBack();

  const toggleFaq = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const toast = useToast();

  const handleEmailSupport = async () => {
    const shouldOpen = await toast.confirm({
      title: "Send Us an Email",
      message: `This will open your email app to send a message to ${SUPPORT_EMAIL}`,
      type: "info",
      confirmText: "Open Email",
      cancelText: "Cancel",
    });
    if (shouldOpen) {
      Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Help Request from Tander App`);
    }
  };

  const handleCallSupport = async () => {
    const shouldCall = await toast.confirm({
      title: "Call Our Support Team",
      message: `This will open your phone app to call ${SUPPORT_PHONE}. Our team is available Monday-Friday, 9am-5pm.`,
      type: "info",
      confirmText: "Make Call",
      cancelText: "Cancel",
    });
    if (shouldCall) {
      Linking.openURL(`tel:${SUPPORT_PHONE.replace(/-/g, "")}`);
    }
  };

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Title Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleIcon}>
              <Ionicons name="help-buoy" size={40} color={colors.primary} />
            </View>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Help Center
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              We're here to help you! Find answers to common questions or contact our friendly support team.
            </AppText>
          </View>

          {/* Contact Options */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="headset-outline" size={24} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Contact Our Support Team
              </AppText>
            </View>

            <TouchableOpacity
              style={styles.contactCard}
              activeOpacity={0.85}
              onPress={handleCallSupport}
              accessibilityRole="button"
              accessibilityLabel="Call support"
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="call" size={32} color={colors.success} />
              </View>
              <View style={styles.contactText}>
                <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                  Call Us
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  Talk to a real person who can help
                </AppText>
                <AppText size="body" weight="medium" color={colors.success}>
                  {SUPPORT_PHONE}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactCard}
              activeOpacity={0.85}
              onPress={handleEmailSupport}
              accessibilityRole="button"
              accessibilityLabel="Email support"
            >
              <View style={[styles.contactIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="mail" size={32} color={colors.primary} />
              </View>
              <View style={styles.contactText}>
                <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                  Email Us
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  We reply within 24 hours
                </AppText>
                <AppText size="body" weight="medium" color={colors.primary}>
                  {SUPPORT_EMAIL}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={28} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* FAQ Section */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Ionicons name="chatbubbles-outline" size={24} color={colors.primary} />
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                Frequently Asked Questions
              </AppText>
            </View>

            <AppText size="body" color={colors.textSecondary} style={styles.faqIntro}>
              Tap on a question to see the answer
            </AppText>

            <View style={styles.faqList}>
              {FAQ_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.faqCard,
                    expandedFaq === item.id && styles.faqCardExpanded
                  ]}
                  activeOpacity={0.85}
                  onPress={() => toggleFaq(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedFaq === item.id }}
                  accessibilityLabel={item.question}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqIconContainer}>
                      <Ionicons name={item.icon} size={24} color={colors.accentBlue} />
                    </View>
                    <AppText
                      size="body"
                      weight="semibold"
                      color={colors.textPrimary}
                      style={styles.faqQuestionText}
                    >
                      {item.question}
                    </AppText>
                    <View style={[
                      styles.expandIcon,
                      expandedFaq === item.id && styles.expandIconExpanded
                    ]}>
                      <Ionicons
                        name="chevron-down"
                        size={24}
                        color={colors.textSecondary}
                      />
                    </View>
                  </View>

                  {expandedFaq === item.id && (
                    <View style={styles.faqAnswer}>
                      <AppText size="body" color={colors.textSecondary} style={styles.faqAnswerText}>
                        {item.answer}
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Safety Tips */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={28} color={colors.success} />
              <AppText size="h4" weight="semibold" color={colors.textPrimary}>
                Safety Reminder
              </AppText>
            </View>
            <View style={styles.safetyList}>
              <View style={styles.safetyItem}>
                <Ionicons name="close-circle" size={22} color={colors.danger} />
                <AppText size="body" color={colors.textSecondary} style={styles.safetyText}>
                  Never share your password with anyone
                </AppText>
              </View>
              <View style={styles.safetyItem}>
                <Ionicons name="close-circle" size={22} color={colors.danger} />
                <AppText size="body" color={colors.textSecondary} style={styles.safetyText}>
                  Never share financial information
                </AppText>
              </View>
              <View style={styles.safetyItem}>
                <Ionicons name="close-circle" size={22} color={colors.danger} />
                <AppText size="body" color={colors.textSecondary} style={styles.safetyText}>
                  Never send money to someone you meet online
                </AppText>
              </View>
              <View style={styles.safetyItem}>
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                <AppText size="body" color={colors.textSecondary} style={styles.safetyText}>
                  Report anyone who asks for money
                </AppText>
              </View>
            </View>
          </View>

          {/* Quick Links */}
          <View style={styles.quickLinksCard}>
            <AppText size="h4" weight="semibold" color={colors.textPrimary} style={styles.quickLinksTitle}>
              Quick Links
            </AppText>
            <View style={styles.quickLinksList}>
              <TouchableOpacity
                style={styles.quickLink}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("SecuritySettingsScreen" as never)}
              >
                <Ionicons name="shield-outline" size={22} color={colors.primary} />
                <AppText size="body" weight="medium" color={colors.primary}>
                  Security Settings
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("PrivacyScreen" as never)}
              >
                <Ionicons name="eye-outline" size={22} color={colors.primary} />
                <AppText size="body" weight="medium" color={colors.primary}>
                  Privacy Settings
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickLink}
                activeOpacity={0.85}
                onPress={() => navigation.navigate("BlockedUsersScreen" as never)}
              >
                <Ionicons name="hand-left-outline" size={22} color={colors.primary} />
                <AppText size="body" weight="medium" color={colors.primary}>
                  Blocked Users
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* App Version */}
          <View style={styles.versionInfo}>
            <AppText size="body" color={colors.textMuted}>
              Tander App Version 1.0.0
            </AppText>
            <AppText size="small" color={colors.textMuted}>
              Made with love for our community
            </AppText>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  titleSection: {
    alignItems: "center",
    gap: 12,
  },
  titleIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 320,
  },
  sectionContainer: {
    gap: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
  },
  contactCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    minHeight: 90,
  },
  contactIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  contactText: {
    flex: 1,
    gap: 4,
  },
  faqIntro: {
    paddingHorizontal: 4,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  faqCardExpanded: {
    backgroundColor: colors.white,
    borderColor: colors.primary + '30',
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  faqIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  faqQuestionText: {
    flex: 1,
    lineHeight: 24,
  },
  expandIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  expandIconExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  faqAnswer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  faqAnswerText: {
    lineHeight: 26,
  },
  safetyCard: {
    backgroundColor: colors.success + '10',
    borderRadius: 18,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  safetyList: {
    gap: 12,
  },
  safetyItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  safetyText: {
    flex: 1,
    lineHeight: 22,
  },
  quickLinksCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 20,
    gap: 14,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickLinksTitle: {
    marginBottom: 4,
  },
  quickLinksList: {
    gap: 12,
  },
  quickLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.primary + '08',
    borderRadius: 14,
  },
  versionInfo: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 16,
  },
});
