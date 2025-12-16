import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { paymentApi } from "@/src/api/paymentApi";

type PaymentNav = NativeStackNavigationProp<AppStackParamList>;

type PaymentMethodType = 'card' | 'gcash' | 'paymaya';

interface PaymentOption {
  key: PaymentMethodType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  helpText: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    key: 'card',
    title: 'Credit or Debit Card',
    subtitle: 'Visa, Mastercard, and more',
    icon: <MaterialCommunityIcons name="credit-card-outline" size={32} color={colors.accentBlue} />,
    color: colors.accentBlue,
    helpText: 'You can use any Visa, Mastercard, or other major credit/debit card.',
  },
  {
    key: 'gcash',
    title: 'GCash',
    subtitle: 'Pay using your GCash wallet',
    icon: <MaterialCommunityIcons name="wallet-outline" size={32} color="#007DFE" />,
    color: '#007DFE',
    helpText: 'Link your GCash mobile number to pay directly from your GCash wallet.',
  },
  {
    key: 'paymaya',
    title: 'PayMaya / Maya',
    subtitle: 'Pay using your Maya account',
    icon: <MaterialCommunityIcons name="cellphone-text" size={32} color="#00C853" />,
    color: '#00C853',
    helpText: 'Link your PayMaya/Maya mobile number to pay from your Maya wallet.',
  },
];

export default function AddPaymentMethodScreen() {
  const navigation = useNavigation<PaymentNav>();

  const [selectedType, setSelectedType] = useState<PaymentMethodType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  // E-wallet form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleGoBack = () => {
    if (selectedType && (cardNumber || phoneNumber)) {
      Alert.alert(
        'Discard Changes?',
        'You have unsaved information. Are you sure you want to go back?',
        [
          { text: 'Stay Here', style: 'cancel' },
          { text: 'Yes, Go Back', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const parseExpiryDate = (expiry: string): { month: number; year: number } | null => {
    const parts = expiry.split('/');
    if (parts.length !== 2) return null;
    const month = parseInt(parts[0], 10);
    const year = parseInt('20' + parts[1], 10);
    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) return null;
    return { month, year };
  };

  const handleAddCard = async () => {
    const cleanedCardNumber = cardNumber.replace(/\s/g, '');
    if (cleanedCardNumber.length < 13 || cleanedCardNumber.length > 19) {
      Alert.alert(
        'Card Number Not Valid',
        'Please check your card number and make sure it is entered correctly.\n\nYour card number should be 13-19 digits long.',
        [{ text: 'OK, I\'ll Check' }]
      );
      return;
    }

    const expiry = parseExpiryDate(expiryDate);
    if (!expiry) {
      Alert.alert(
        'Expiry Date Not Valid',
        'Please enter the expiry date from your card.\n\nFormat: MM/YY (for example: 12/25 for December 2025)',
        [{ text: 'OK, I\'ll Fix It' }]
      );
      return;
    }

    // Check if card is expired
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    if (expiry.year < currentYear || (expiry.year === currentYear && expiry.month < currentMonth)) {
      Alert.alert(
        'Card Has Expired',
        'This card appears to be expired. Please use a card that has not expired.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (cvv.length < 3 || cvv.length > 4) {
      Alert.alert(
        'CVV Not Valid',
        'Please enter the 3 or 4 digit security code from the back of your card.\n\nThis is usually found near the signature strip.',
        [{ text: 'OK, I\'ll Check' }]
      );
      return;
    }

    setIsLoading(true);
    try {
      await paymentApi.addCard({
        cardNumber: cleanedCardNumber,
        expiryMonth: expiry.month,
        expiryYear: expiry.year,
        cardholderName: cardholderName || undefined,
        setAsDefault: true,
      });

      Alert.alert(
        'Card Added Successfully!',
        'Your card has been saved and set as your default payment method.',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Could Not Add Card',
        error.message || 'Something went wrong. Please check your card details and try again.',
        [{ text: 'OK, I\'ll Try Again' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWallet = async (walletType: 'GCASH' | 'PAYMAYA') => {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    if (cleanedPhone.length !== 11 || !cleanedPhone.startsWith('09')) {
      Alert.alert(
        'Phone Number Not Valid',
        'Please enter your 11-digit Philippine mobile number.\n\nIt should start with 09 (for example: 09171234567)',
        [{ text: 'OK, I\'ll Fix It' }]
      );
      return;
    }

    const walletName = walletType === 'GCASH' ? 'GCash' : 'PayMaya';

    setIsLoading(true);
    try {
      await paymentApi.addWallet({
        walletType,
        phoneNumber: cleanedPhone,
        accountName: accountName || undefined,
        setAsDefault: true,
      });

      Alert.alert(
        `${walletName} Added Successfully!`,
        `Your ${walletName} account has been linked and set as your default payment method.`,
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        `Could Not Add ${walletName}`,
        error.message || 'Something went wrong. Please check your phone number and try again.',
        [{ text: 'OK, I\'ll Try Again' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedType === 'card') {
      handleAddCard();
    } else if (selectedType === 'gcash') {
      handleAddWallet('GCASH');
    } else if (selectedType === 'paymaya') {
      handleAddWallet('PAYMAYA');
    }
  };

  const renderPaymentTypeSelector = () => (
    <View style={styles.section}>
      <AppText size="h3" weight="bold" color={colors.textPrimary}>
        Step 1: Choose Payment Type
      </AppText>
      <AppText size="body" color={colors.textSecondary} style={styles.sectionSubtitle}>
        Tap on one of the options below to select how you want to pay.
      </AppText>

      <View style={styles.optionsContainer}>
        {PAYMENT_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionCard,
              selectedType === option.key && styles.optionCardSelected,
              selectedType === option.key && { borderColor: option.color },
            ]}
            activeOpacity={0.8}
            onPress={() => setSelectedType(option.key)}
            accessibilityRole="button"
            accessibilityLabel={`Select ${option.title}`}
            accessibilityState={{ selected: selectedType === option.key }}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
              {option.icon}
            </View>
            <View style={styles.optionContent}>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                {option.title}
              </AppText>
              <AppText size="body" color={colors.textSecondary}>
                {option.subtitle}
              </AppText>
            </View>
            <View style={[
              styles.radioCircle,
              selectedType === option.key && { backgroundColor: option.color, borderColor: option.color }
            ]}>
              {selectedType === option.key && (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCardForm = () => (
    <View style={styles.section}>
      <AppText size="h3" weight="bold" color={colors.textPrimary}>
        Step 2: Enter Card Details
      </AppText>
      <AppText size="body" color={colors.textSecondary} style={styles.sectionSubtitle}>
        Please enter the information from your credit or debit card.
      </AppText>

      <View style={styles.formCard}>
        {/* Card Number */}
        <View style={styles.formGroup}>
          <AppText size="body" weight="semibold" color={colors.textPrimary}>
            Card Number
          </AppText>
          <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
            The long number on the front of your card
          </AppText>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(text) => setCardNumber(formatCardNumber(text))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            maxLength={19}
            accessibilityLabel="Card number input"
          />
        </View>

        {/* Expiry and CVV Row */}
        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Expiry Date
            </AppText>
            <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
              Month and year (MM/YY)
            </AppText>
            <TextInput
              style={styles.input}
              value={expiryDate}
              onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
              placeholder="MM/YY"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={5}
              accessibilityLabel="Expiry date input"
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 12 }]}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              CVV / CVC
            </AppText>
            <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
              3-4 digits on back
            </AppText>
            <TextInput
              style={styles.input}
              value={cvv}
              onChangeText={setCvv}
              placeholder="123"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              accessibilityLabel="CVV security code input"
            />
          </View>
        </View>

        {/* Cardholder Name */}
        <View style={styles.formGroup}>
          <AppText size="body" weight="semibold" color={colors.textPrimary}>
            Name on Card (Optional)
          </AppText>
          <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
            The name printed on your card
          </AppText>
          <TextInput
            style={styles.input}
            value={cardholderName}
            onChangeText={setCardholderName}
            placeholder="Juan Dela Cruz"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="words"
            accessibilityLabel="Cardholder name input"
          />
        </View>
      </View>

      {/* Card Help */}
      <View style={styles.helpBox}>
        <Ionicons name="help-circle" size={24} color={colors.accentBlue} />
        <AppText size="body" color={colors.textSecondary} style={styles.helpText}>
          Where do I find these numbers? The card number is on the front. The expiry date and CVV are usually on the back near the signature strip.
        </AppText>
      </View>
    </View>
  );

  const renderWalletForm = (walletType: 'gcash' | 'paymaya') => {
    const walletName = walletType === 'gcash' ? 'GCash' : 'PayMaya';
    const walletColor = walletType === 'gcash' ? '#007DFE' : '#00C853';

    return (
      <View style={styles.section}>
        <AppText size="h3" weight="bold" color={colors.textPrimary}>
          Step 2: Enter {walletName} Details
        </AppText>
        <AppText size="body" color={colors.textSecondary} style={styles.sectionSubtitle}>
          Enter the phone number linked to your {walletName} account.
        </AppText>

        <View style={styles.formCard}>
          {/* Phone Number */}
          <View style={styles.formGroup}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Mobile Phone Number
            </AppText>
            <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
              The phone number registered with your {walletName} account
            </AppText>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="09171234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              maxLength={11}
              accessibilityLabel={`${walletName} phone number input`}
            />
          </View>

          {/* Account Name */}
          <View style={styles.formGroup}>
            <AppText size="body" weight="semibold" color={colors.textPrimary}>
              Account Name (Optional)
            </AppText>
            <AppText size="small" color={colors.textMuted} style={styles.fieldHelp}>
              Your name as it appears in {walletName}
            </AppText>
            <TextInput
              style={styles.input}
              value={accountName}
              onChangeText={setAccountName}
              placeholder="Juan Dela Cruz"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="words"
              accessibilityLabel={`${walletName} account name input`}
            />
          </View>
        </View>

        {/* Wallet Help */}
        <View style={[styles.helpBox, { borderColor: walletColor + '40' }]}>
          <Ionicons name="information-circle" size={24} color={walletColor} />
          <AppText size="body" color={colors.textSecondary} style={styles.helpText}>
            Make sure the phone number matches the one you use for {walletName}. You may need to verify this number through the {walletName} app.
          </AppText>
        </View>
      </View>
    );
  };

  const isFormValid = () => {
    if (selectedType === 'card') {
      const cleanedCardNumber = cardNumber.replace(/\s/g, '');
      return cleanedCardNumber.length >= 13 && expiryDate.length === 5 && cvv.length >= 3;
    } else if (selectedType === 'gcash' || selectedType === 'paymaya') {
      const cleanedPhone = phoneNumber.replace(/\D/g, '');
      return cleanedPhone.length === 11;
    }
    return false;
  };

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Go back"
                activeOpacity={0.85}
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
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

            {/* Title */}
            <View style={styles.titleSection}>
              <AppText size="h2" weight="bold" color={colors.textPrimary}>
                Add Payment Method
              </AppText>
              <AppText size="body" color={colors.textSecondary} style={styles.titleSubtext}>
                Follow the steps below to add a new way to pay.
              </AppText>
            </View>

            {/* Payment Type Selector */}
            {renderPaymentTypeSelector()}

            {/* Form based on selection */}
            {selectedType === 'card' && renderCardForm()}
            {(selectedType === 'gcash' || selectedType === 'paymaya') &&
              renderWalletForm(selectedType)}

            {/* Submit Button */}
            {selectedType && (
              <View style={styles.submitSection}>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!isFormValid() || isLoading) && styles.submitButtonDisabled,
                  ]}
                  activeOpacity={0.9}
                  onPress={handleSubmit}
                  disabled={!isFormValid() || isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Save payment method"
                >
                  {isLoading ? (
                    <View style={styles.loadingContent}>
                      <ActivityIndicator size="small" color={colors.white} />
                      <AppText size="h4" weight="bold" color={colors.white}>
                        Saving...
                      </AppText>
                    </View>
                  ) : (
                    <View style={styles.submitContent}>
                      <Ionicons name="checkmark-circle" size={28} color={colors.white} />
                      <AppText size="h4" weight="bold" color={colors.white}>
                        Save Payment Method
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>

                {!isFormValid() && (
                  <AppText size="body" color={colors.textMuted} style={styles.formIncomplete}>
                    Please fill in all required fields to continue.
                  </AppText>
                )}
              </View>
            )}

            {/* Security Note */}
            <View style={styles.securityNote}>
              <View style={styles.securityIcon}>
                <Ionicons name="shield-checkmark" size={28} color={colors.success} />
              </View>
              <View style={styles.securityContent}>
                <AppText size="body" weight="semibold" color={colors.textPrimary}>
                  Your Information is Protected
                </AppText>
                <AppText size="body" color={colors.textSecondary}>
                  All payment details are encrypted and stored securely. We will never share your financial information.
                </AppText>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 10,
    paddingRight: 16,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleSection: {
    gap: 8,
  },
  titleSubtext: {
    lineHeight: 24,
  },
  section: {
    gap: 16,
  },
  sectionSubtitle: {
    lineHeight: 24,
    marginTop: -8,
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.borderLight,
    backgroundColor: colors.white,
    gap: 16,
    minHeight: 90,
  },
  optionCardSelected: {
    backgroundColor: colors.white,
    borderWidth: 3,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  optionIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  radioCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.borderMedium,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    gap: 20,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  formGroup: {
    gap: 8,
  },
  fieldHelp: {
    marginTop: -4,
  },
  row: {
    flexDirection: "row",
  },
  input: {
    backgroundColor: colors.backgroundLight,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 18,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    minHeight: 56,
  },
  helpBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.accentMint,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBlue + '40',
  },
  helpText: {
    flex: 1,
    lineHeight: 24,
  },
  submitSection: {
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formIncomplete: {
    textAlign: 'center',
  },
  securityNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    backgroundColor: '#E8F5E9',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  securityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityContent: {
    flex: 1,
    gap: 4,
  },
});
