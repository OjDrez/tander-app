import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppText from "@/src/components/inputs/AppText";
import FullScreen from "@/src/components/layout/FullScreen";
import colors from "@/src/config/colors";
import { AppStackParamList } from "@/src/navigation/NavigationTypes";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { paymentApi, PaymentMethod } from "@/src/api/paymentApi";

type PaymentNav = NativeStackNavigationProp<AppStackParamList>;

const getPaymentIcon = (type: string, brand?: string) => {
  switch (type) {
    case 'CARD':
      if (brand?.toLowerCase() === 'visa') {
        return <MaterialCommunityIcons name="credit-card" size={28} color="#1A1F71" />;
      } else if (brand?.toLowerCase() === 'mastercard') {
        return <MaterialCommunityIcons name="credit-card" size={28} color="#EB001B" />;
      }
      return <MaterialCommunityIcons name="credit-card-outline" size={28} color={colors.accentBlue} />;
    case 'GCASH':
      return <MaterialCommunityIcons name="wallet-outline" size={28} color="#007DFE" />;
    case 'PAYMAYA':
      return <MaterialCommunityIcons name="cellphone-text" size={28} color="#00C853" />;
    default:
      return <MaterialCommunityIcons name="credit-card-outline" size={28} color={colors.accentBlue} />;
  }
};

const getPaymentTypeLabel = (type: string) => {
  switch (type) {
    case 'CARD':
      return 'Credit/Debit Card';
    case 'GCASH':
      return 'GCash Wallet';
    case 'PAYMAYA':
      return 'PayMaya Wallet';
    default:
      return 'Payment Method';
  }
};

export default function PaymentMethodsScreen() {
  const navigation = useNavigation<PaymentNav>();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadPaymentMethods = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const methods = await paymentApi.getPaymentMethods();
      setPaymentMethods(methods);
    } catch (error: any) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
    }, [])
  );

  const handleGoBack = () => navigation.goBack();

  const handleAddPaymentMethod = () => {
    navigation.navigate('AddPaymentMethodScreen' as never);
  };

  const handleSetDefault = async (method: PaymentMethod) => {
    if (method.isDefault) {
      Alert.alert(
        'Already Default',
        'This is already your default payment method.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Set as Default?',
      `Do you want to make "${method.displayName}" your default payment method?\n\nThis will be used for all future payments.`,
      [
        { text: 'No, Cancel', style: 'cancel' },
        {
          text: 'Yes, Set Default',
          onPress: async () => {
            setProcessingId(method.id);
            try {
              await paymentApi.setDefault(method.id);
              loadPaymentMethods();
              Alert.alert('Success!', 'Your default payment method has been updated.');
            } catch (error: any) {
              Alert.alert('Something Went Wrong', error.message || 'Failed to set default payment method. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleRemove = async (method: PaymentMethod) => {
    Alert.alert(
      'Remove Payment Method?',
      `Are you sure you want to remove "${method.displayName}"?\n\nThis action cannot be undone.`,
      [
        { text: 'No, Keep It', style: 'cancel' },
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessingId(method.id);
            try {
              await paymentApi.remove(method.id);
              loadPaymentMethods();
              Alert.alert('Removed', 'The payment method has been removed.');
            } catch (error: any) {
              Alert.alert('Something Went Wrong', error.message || 'Failed to remove payment method. Please try again.');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isProcessing = processingId === method.id;

    return (
      <View key={method.id} style={[styles.paymentCard, method.isDefault && styles.defaultCard]}>
        {/* Main Info Section */}
        <View style={styles.cardHeader}>
          <View style={[styles.iconBadge, method.isDefault && styles.defaultIconBadge]}>
            {getPaymentIcon(method.paymentType, method.cardBrand)}
          </View>
          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <AppText size="h4" weight="bold" color={colors.textPrimary}>
                {method.displayName}
              </AppText>
              {method.isDefault && (
                <View style={styles.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <AppText size="small" weight="bold" color={colors.success}>
                    DEFAULT
                  </AppText>
                </View>
              )}
            </View>
            <AppText size="body" color={colors.textSecondary}>
              {getPaymentTypeLabel(method.paymentType)}
            </AppText>
            <AppText size="body" color={colors.textMuted} style={styles.cardDetails}>
              {method.paymentType === 'CARD'
                ? `${method.cardBrand || 'Card'} ending in ${method.lastFour}${method.expiryMonth && method.expiryYear ? ` - Expires ${method.expiryMonth}/${method.expiryYear.toString().slice(-2)}` : ''}`
                : `Phone ending in ${method.lastFour}`
              }
            </AppText>
          </View>
        </View>

        {/* Action Buttons - Large and Clear for Seniors */}
        <View style={styles.actionButtons}>
          {!method.isDefault && (
            <TouchableOpacity
              style={[styles.actionButton, styles.setDefaultButton]}
              activeOpacity={0.8}
              onPress={() => handleSetDefault(method)}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel={`Set ${method.displayName} as default payment method`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="star-outline" size={22} color={colors.primary} />
                  <AppText size="body" weight="semibold" color={colors.primary}>
                    Set as Default
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            activeOpacity={0.8}
            onPress={() => handleRemove(method)}
            disabled={isProcessing}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${method.displayName}`}
          >
            {isProcessing && method.isDefault ? (
              <ActivityIndicator size="small" color={colors.danger} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                <AppText size="body" weight="semibold" color={colors.danger}>
                  Remove
                </AppText>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <FullScreen statusBarStyle="dark" style={styles.screen}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText size="h4" color={colors.textSecondary} style={{ marginTop: 20 }}>
            Loading your payment methods...
          </AppText>
        </View>
      </FullScreen>
    );
  }

  return (
    <FullScreen statusBarStyle="dark" style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => loadPaymentMethods(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
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

          {/* Title Section */}
          <View style={styles.titleSection}>
            <AppText size="h2" weight="bold" color={colors.textPrimary}>
              Payment Methods
            </AppText>
            <AppText size="body" color={colors.textSecondary} style={styles.subtitle}>
              Manage how you pay for premium features and subscriptions.
            </AppText>
          </View>

          {/* Add New Payment Method Button - Large and Prominent */}
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={handleAddPaymentMethod}
            accessibilityRole="button"
            accessibilityLabel="Add a new payment method"
          >
            <View style={styles.addButtonIcon}>
              <Ionicons name="add-circle" size={36} color={colors.primary} />
            </View>
            <View style={styles.addButtonContent}>
              <AppText size="h4" weight="bold" color={colors.primary}>
                Add New Payment Method
              </AppText>
              <AppText size="body" color={colors.textSecondary}>
                Add a card, GCash, or PayMaya
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={28} color={colors.primary} />
          </TouchableOpacity>

          {/* Payment Methods List */}
          {paymentMethods.length > 0 ? (
            <View style={styles.cardGroup}>
              <AppText size="small" weight="semibold" color={colors.textMuted} style={styles.sectionLabel}>
                YOUR SAVED PAYMENT METHODS
              </AppText>
              {paymentMethods.map(renderPaymentMethod)}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <MaterialCommunityIcons
                  name="credit-card-plus-outline"
                  size={80}
                  color={colors.textMuted}
                />
              </View>
              <AppText size="h4" weight="bold" color={colors.textSecondary} style={styles.emptyTitle}>
                No Payment Methods Yet
              </AppText>
              <AppText size="body" color={colors.textMuted} style={styles.emptyText}>
                Add a payment method to easily pay for premium features and subscriptions.
              </AppText>
              <TouchableOpacity
                style={styles.emptyAddButton}
                activeOpacity={0.85}
                onPress={handleAddPaymentMethod}
              >
                <Ionicons name="add-circle" size={24} color={colors.white} />
                <AppText size="body" weight="bold" color={colors.white}>
                  Add Your First Payment Method
                </AppText>
              </TouchableOpacity>
            </View>
          )}

          {/* Help Section */}
          <View style={styles.helpSection}>
            <View style={styles.helpIcon}>
              <Ionicons name="shield-checkmark" size={28} color={colors.success} />
            </View>
            <View style={styles.helpContent}>
              <AppText size="body" weight="semibold" color={colors.textPrimary}>
                Your Information is Safe
              </AppText>
              <AppText size="body" color={colors.textSecondary}>
                All payment information is encrypted and securely stored. We never share your financial details.
              </AppText>
            </View>
          </View>

          {/* Need Help */}
          <View style={styles.needHelpSection}>
            <Ionicons name="help-circle-outline" size={24} color={colors.accentBlue} />
            <AppText size="body" color={colors.textSecondary}>
              Need help? Visit our{" "}
              <AppText
                size="body"
                weight="semibold"
                color={colors.primary}
                onPress={() => navigation.navigate('HelpCenterScreen' as never)}
              >
                Help Center
              </AppText>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  subtitle: {
    lineHeight: 24,
  },
  addButton: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  addButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary + '15',
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonContent: {
    flex: 1,
    gap: 4,
  },
  sectionLabel: {
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  cardGroup: {
    gap: 16,
  },
  paymentCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowLight,
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 16,
  },
  defaultCard: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: '#FAFFF9',
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  iconBadge: {
    height: 56,
    width: 56,
    borderRadius: 16,
    backgroundColor: colors.accentMint,
    alignItems: "center",
    justifyContent: "center",
  },
  defaultIconBadge: {
    backgroundColor: '#E8F5E9',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  defaultBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardDetails: {
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    minHeight: 52,
  },
  setDefaultButton: {
    backgroundColor: colors.primary + '12',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  removeButton: {
    backgroundColor: colors.danger + '10',
    borderWidth: 1,
    borderColor: colors.danger + '20',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  helpSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#E8F5E9',
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.success + '40',
  },
  helpIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpContent: {
    flex: 1,
    gap: 4,
  },
  needHelpSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
});
