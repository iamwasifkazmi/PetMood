import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  getProducts,
  requestPurchase,
  getAvailablePurchases,
  Purchase,
  Product,
  SubscriptionPurchase,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { getAllProductIds } from '../constants/subscription';
import { store } from '../features/store';
import { setSubscription, setError, setLoading } from '../features/subscription/subscriptionSlice';
import { subscriptionApiSlice } from '../features/subscription/subscriptionApiSlice';
import { SubscriptionStatus } from '../features/subscription/types';

class SubscriptionService {
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private isInitialized = false;

  /**
   * Initialize IAP connection
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      if (Platform.OS !== 'ios') {
        console.warn('IAP is only supported on iOS');
        return false;
      }

      await initConnection();
      this.isInitialized = true;

      // Set up purchase listeners
      this.setupPurchaseListeners();

      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      store.dispatch(setError('Failed to initialize in-app purchases'));
      return false;
    }
  }

  /**
   * Set up purchase update and error listeners
   */
  private setupPurchaseListeners() {
    // Listen for successful purchases
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: SubscriptionPurchase) => {
        try {
          console.log('Purchase successful:', purchase);
          await this.handlePurchase(purchase);
          // Finish the transaction
          await finishTransaction({ purchase, isConsumable: false });
        } catch (error) {
          console.error('Error handling purchase:', error);
          store.dispatch(setError('Failed to process purchase'));
        }
      },
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener(error => {
      console.error('Purchase error:', error);
      store.dispatch(setError(error.message || 'Purchase failed'));
      store.dispatch(setLoading(false));
    });
  }

  /**
   * Handle a successful purchase
   */
  private async handlePurchase(purchase: SubscriptionPurchase) {
    try {
      store.dispatch(setLoading(true));

      // Get receipt data
      const receipt = purchase.transactionReceipt;
      if (!receipt) {
        throw new Error('No receipt data found');
      }

      // Verify receipt with backend
      const verifyReceipt = store.dispatch(
        subscriptionApiSlice.endpoints.verifyReceipt.initiate({
          receipt_data: receipt,
          product_id: purchase.productId,
          transaction_id: purchase.transactionId,
          original_transaction_id: purchase.originalTransactionIdentifierIOS,
        }),
      );

      const result = await verifyReceipt;
      
      if (result.data?.success && result.data.subscription) {
        const subscription: SubscriptionStatus = {
          isActive: result.data.subscription.is_active,
          planType: result.data.subscription.plan_type,
          period: result.data.subscription.period,
          expiresAt: result.data.subscription.expires_at,
          productId: purchase.productId,
        };
        store.dispatch(setSubscription(subscription));
      } else {
        throw new Error(result.data?.message || 'Receipt verification failed');
      }
    } catch (error: any) {
      console.error('Error verifying receipt:', error);
      store.dispatch(setError(error.message || 'Failed to verify purchase'));
      throw error;
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  /**
   * Get available subscription products
   */
  async getAvailableProducts(): Promise<Product[]> {
    try {
      const productIds = getAllProductIds();
      const products = await getProducts({ skus: productIds });
      return products;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(null));

      await requestPurchase({ sku: productId });
      // The purchase will be handled by the purchaseUpdatedListener
    } catch (error: any) {
      console.error('Error purchasing subscription:', error);
      store.dispatch(setError(error.message || 'Purchase failed'));
      store.dispatch(setLoading(false));
      throw error;
    }
  }

  /**
   * Restore previous purchases
   */
  async restorePurchases(): Promise<void> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(null));

      const purchases = await getAvailablePurchases();

      if (purchases.length === 0) {
        store.dispatch(setError('No previous purchases found'));
        store.dispatch(setLoading(false));
        return;
      }

      // Verify the most recent active subscription
      const activePurchase = purchases.find(
        p => p.productId.startsWith('com.petmood'),
      );

      if (activePurchase) {
        await this.handlePurchase(activePurchase as SubscriptionPurchase);
      } else {
        store.dispatch(setError('No active subscription found'));
      }
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      store.dispatch(setError(error.message || 'Failed to restore purchases'));
      throw error;
    } finally {
      store.dispatch(setLoading(false));
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.purchaseUpdateSubscription) {
      this.purchaseUpdateSubscription.remove();
      this.purchaseUpdateSubscription = null;
    }
    if (this.purchaseErrorSubscription) {
      this.purchaseErrorSubscription.remove();
      this.purchaseErrorSubscription = null;
    }
    this.isInitialized = false;
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
