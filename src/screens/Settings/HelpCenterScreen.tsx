import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
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

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import AppHeader from "@/src/components/navigation/AppHeader";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Enable layout animations on Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type HelpNav = NativeStackNavigationProp<AppStackParamList>;

// Senior-friendly FAQ items with clear, simple language
const FAQ_ITEMS = [
  {
    id: "1",
    question: "How do I change my profile picture?",
    answer:
      "Go to Settings, then tap on 'Edit Profile'. You'll see your current photo at the top. Tap on it to take a new photo or choose one from your gallery. Make sure you're in a well-lit area for the best photo!",
  },
  {
    id: "2",
    question: "How do I send a message to someone?",
    answer:
      "First, you need to match with someone. When you both like each other, you'll see them in your 'Matches' section. Tap on their profile, then tap the message icon to start chatting. Take your time - there's no rush!",
  },
  {
    id: "3",
    question: "What does 'Verified' mean?",
    answer:
      "A verified profile means we have confirmed the person is who they say they are. Look for a green checkmark on profiles. We recommend connecting with verified members for your safety.",
  },
  {
    id: "4",
    question: "How do I block someone?",
    answer:
      "If someone is bothering you, go to their profile and tap the three dots (...) in the corner. Then select 'Block User'. They won't be able to contact you anymore. Your safety is our priority.",
  },
  {
    id: "5",
    question: "How do I change my password?",
    answer:
      "Go to Settings, scroll down to 'Change Password'. Enter your current password, then type your new password twice to confirm. Use a password that's easy for you to remember but hard for others to guess.",
  },
  {
    id: "6",
    question: "Why should I verify my age?",
    answer:
      "Age verification helps us maintain a community of people 60 and older. It makes Tander a safer and more comfortable place where you can connect with people in your age group.",
  },
  {
    id: "7",
    question: "How do I make a video call?",
    answer:
      "Once you're matched with someone and have exchanged a few messages, you'll see a video camera icon in your conversation. Tap it to start a video call. Make sure you're in a quiet, well-lit place!",
  },
  {
    id: "8",
    question: "Is my information safe?",
    answer:
      "Yes! We take your privacy very seriously. Your personal information is never shared with other users. Only share what you're comfortable with, and never share your password or financial information with anyone.",
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

  const handleEmailSupport = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Help Request from Tander App`);
  };

  const handleCallSupport = () => {
    Linking.openURL(`tel:${SUPPORT_PHONE.replace(/-/g, "")}`);
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <AppHeader
          title="Help Center"
          titleAlign="left"
          onBackPress={handleGoBack}
          showLogo
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Welcome Section */}
          <View style={styles.welcomeCard}>
            <Ionicons name="heart-circle" size={48} color={colors.primary} />
            <AppText size="h4" weight="bold" color={colors.textPrimary} style={styles.welcomeTitle}>
              We're Here to Help!
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.welcomeText}>
              Find answers to common questions below, or contact our friendly support team.
            </AppText>
          </View>

          {/* Contact Options */}
          <View style={styles.section}>
            <AppText size="small" weight="semibold" color={colors.textMuted} style={styles.sectionTitle}>
              Contact Us
            </AppText>

            <View style={styles.contactRow}>
              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.85}
                onPress={handleCallSupport}
                accessibilityRole="button"
                accessibilityLabel="Call support"
                accessibilityHint="Opens your phone app to call our support team"
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="call" size={28} color={colors.success} />
                </View>
                <AppText size="body" weight="semibold" color={colors.textPrimary}>
                  Call Us
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  Talk to a real person
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactCard}
                activeOpacity={0.85}
                onPress={handleEmailSupport}
                accessibilityRole="button"
                accessibilityLabel="Email support"
                accessibilityHint="Opens your email app to send us a message"
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.accentPeach }]}>
                  <Ionicons name="mail" size={28} color={colors.primary} />
                </View>
                <AppText size="body" weight="semibold" color={colors.textPrimary}>
                  Email Us
                </AppText>
                <AppText size="small" color={colors.textSecondary}>
                  We reply within 24 hours
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* FAQ Section */}
          <View style={styles.section}>
            <AppText size="small" weight="semibold" color={colors.textMuted} style={styles.sectionTitle}>
              Frequently Asked Questions
            </AppText>

            <View style={styles.faqList}>
              {FAQ_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.faqCard}
                  activeOpacity={0.9}
                  onPress={() => toggleFaq(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: expandedFaq === item.id }}
                  accessibilityLabel={item.question}
                >
                  <View style={styles.faqHeader}>
                    <View style={styles.faqQuestion}>
                      <View style={styles.faqIcon}>
                        <Ionicons
                          name="help-circle"
                          size={24}
                          color={colors.accentBlue}
                        />
                      </View>
                      <AppText
                        size="body"
                        weight="semibold"
                        color={colors.textPrimary}
                        style={styles.faqQuestionText}
                      >
                        {item.question}
                      </AppText>
                    </View>
                    <View style={styles.expandIcon}>
                      <Ionicons
                        name={expandedFaq === item.id ? "chevron-up" : "chevron-down"}
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

          {/* Safety Tip */}
          <View style={styles.safetyCard}>
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={24} color={colors.success} />
              <AppText size="body" weight="bold" color={colors.textPrimary}>
                Safety Reminder
              </AppText>
            </View>
            <AppText size="body" color={colors.textSecondary} style={styles.safetyText}>
              Never share your password, financial information, or home address with anyone you meet online.
              If someone asks for money, please report them immediately.
            </AppText>
          </View>

          {/* App Version */}
          <View style={styles.versionInfo}>
            <AppText size="small" color={colors.textMuted}>
              Tander App Version 1.0.0
            </AppText>
            <AppText size="tiny" color={colors.textMuted}>
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
  content: {
    paddingHorizontal: 18,
    paddingBottom: 30,
    gap: 24,
  },
  welcomeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  welcomeTitle: {
    marginTop: 12,
    textAlign: "center",
  },
  welcomeText: {
    marginTop: 8,
    textAlign: "center",
    lineHeight: 26,
  },
  section: {
    gap: 14,
  },
  sectionTitle: {
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  contactRow: {
    flexDirection: "row",
    gap: 14,
  },
  contactCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 140,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  faqList: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  faqQuestion: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  faqIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  faqQuestionText: {
    flex: 1,
    lineHeight: 24,
  },
  expandIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  faqAnswer: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  faqAnswerText: {
    lineHeight: 26,
  },
  safetyCard: {
    backgroundColor: colors.successLight,
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.success,
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  safetyText: {
    lineHeight: 26,
  },
  versionInfo: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
  },
});
