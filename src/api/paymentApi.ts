import apiClient from './config';

/**
 * Payment Method Type
 */
export type PaymentType = 'CARD' | 'GCASH' | 'PAYMAYA';

/**
 * Payment Method Response
 */
export interface PaymentMethod {
  id: number;
  paymentType: PaymentType;
  displayName: string;
  lastFour: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  phoneNumber?: string;
  isDefault: boolean;
  createdAt: string;
}

/**
 * Add Card Request
 */
export interface AddCardRequest {
  cardNumber: string;
  cardBrand?: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName?: string;
  setAsDefault?: boolean;
}

/**
 * Add Wallet Request
 */
export interface AddWalletRequest {
  walletType: 'GCASH' | 'PAYMAYA';
  phoneNumber: string;
  accountName?: string;
  setAsDefault?: boolean;
}

/**
 * Payment API
 * Handles payment method operations
 */
export const paymentApi = {
  /**
   * Get all payment methods for the current user
   */
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    try {
      console.log('🔵 [paymentApi.getPaymentMethods] Fetching payment methods...');

      const response = await apiClient.get<{
        success: boolean;
        paymentMethods: PaymentMethod[];
        count: number;
      }>('/payment/methods');

      console.log('✅ [paymentApi.getPaymentMethods] Got', response.data.count, 'methods');
      return response.data.paymentMethods;
    } catch (error: any) {
      console.error('❌ [paymentApi.getPaymentMethods] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to fetch payment methods');
    }
  },

  /**
   * Add a new card payment method
   */
  addCard: async (data: AddCardRequest): Promise<PaymentMethod> => {
    try {
      console.log('🔵 [paymentApi.addCard] Adding card...');

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        paymentMethod: PaymentMethod;
      }>('/payment/methods/card', data);

      console.log('✅ [paymentApi.addCard] Card added:', response.data.paymentMethod.displayName);
      return response.data.paymentMethod;
    } catch (error: any) {
      console.error('❌ [paymentApi.addCard] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to add card');
    }
  },

  /**
   * Add a new e-wallet payment method (GCash/PayMaya)
   */
  addWallet: async (data: AddWalletRequest): Promise<PaymentMethod> => {
    try {
      console.log('🔵 [paymentApi.addWallet] Adding wallet:', data.walletType);

      const response = await apiClient.post<{
        success: boolean;
        message: string;
        paymentMethod: PaymentMethod;
      }>('/payment/methods/wallet', data);

      console.log('✅ [paymentApi.addWallet] Wallet added:', response.data.paymentMethod.displayName);
      return response.data.paymentMethod;
    } catch (error: any) {
      console.error('❌ [paymentApi.addWallet] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to add wallet');
    }
  },

  /**
   * Set a payment method as default
   */
  setDefault: async (id: number): Promise<PaymentMethod> => {
    try {
      console.log('🔵 [paymentApi.setDefault] Setting default:', id);

      const response = await apiClient.put<{
        success: boolean;
        message: string;
        paymentMethod: PaymentMethod;
      }>(`/payment/methods/${id}/default`);

      console.log('✅ [paymentApi.setDefault] Default set');
      return response.data.paymentMethod;
    } catch (error: any) {
      console.error('❌ [paymentApi.setDefault] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to set default payment method');
    }
  },

  /**
   * Remove a payment method
   */
  remove: async (id: number): Promise<void> => {
    try {
      console.log('🔵 [paymentApi.remove] Removing payment method:', id);

      await apiClient.delete(`/payment/methods/${id}`);

      console.log('✅ [paymentApi.remove] Payment method removed');
    } catch (error: any) {
      console.error('❌ [paymentApi.remove] Error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to remove payment method');
    }
  },
};

export default paymentApi;
