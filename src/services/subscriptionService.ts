import {
  initConnection,
  purchaseUpdatedListener,
  purchaseErrorListener,
  finishTransaction,
  fetchProducts,
  requestPurchase,
  getAvailablePurchases,
  Purchase,
  PurchaseIOS,
  Product,
  PurchaseError,
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
      async (purchase: Purchase) => {
        try {
          console.log('Purchase successful, processing...', purchase);
          await this.handlePurchase(purchase);
          // Finish the transaction
          console.log('Finishing transaction...');
          await finishTransaction({ purchase, isConsumable: false });
          console.log('Transaction finished successfully');
        } catch (error: any) {
          console.error('Error handling purchase in listener:', error);
          // Make sure loading is reset even on error
          store.dispatch(setLoading(false));
          const errorMsg = error.message || 'Failed to process purchase';
          store.dispatch(setError(errorMsg));
        }
      },
    );

    // Listen for purchase errors
    this.purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
      console.error('Purchase error listener:', error);
      
      // Extract error information
      const errorCode = (error as any)?.code || (error as any)?.errorCode;
      const errorMessage = error?.message || (error as any)?.localizedDescription || 'Purchase failed';
      
      // Don't show error for user cancellations
      if (errorCode === 'E_USER_CANCELLED' || errorMessage.toLowerCase().includes('cancel')) {
        console.log('User cancelled purchase');
        store.dispatch(setLoading(false));
        return;
      }
      
      // Don't show errors for product availability - iOS handles this
      if (
        errorMessage.includes('not available') ||
        errorMessage.includes('not found') ||
        errorMessage.includes('invalid product') ||
        errorCode === 'E_ITEM_UNAVAILABLE'
      ) {
        console.log('Product not available - iOS handled this');
        store.dispatch(setLoading(false));
        return;
      }
      
      // Only show errors for unexpected issues (not product availability or generic errors)
      // Don't show "Unable to start purchase" - it's usually a product availability issue that iOS handles
      if (!errorMessage.includes('Unable to start purchase') && !errorMessage.includes('not available')) {
        console.error('Unexpected purchase error:', errorMessage);
        store.dispatch(setError(errorMessage));
      } else {
        console.log('Purchase error handled by iOS, not showing to user:', errorMessage);
      }
      store.dispatch(setLoading(false));
    });
  }

  /**
   * Handle a successful purchase
   */
  private async handlePurchase(purchase: Purchase) {
    try {
      store.dispatch(setLoading(true));

      // Get product ID and transaction ID
      // Backend uses App Store Server API with transaction_id (not receipt_data)
      const productId = (purchase as any).productId || (purchase as any).productIdentifier || '';
      const transactionId = purchase.transactionId || '';
      const originalTransactionId = (purchase as any).originalTransactionIdentifierIOS || (purchase as any).originalTransactionIdentifier || '';
      const signedTransactionJws =
        Platform.OS === 'ios'
          ? (purchase as PurchaseIOS).purchaseToken ?? undefined
          : undefined;

      if (!productId || !transactionId) {
        throw new Error('Missing purchase information');
      }

      console.log('Verifying receipt with backend:', {
        product_id: productId,
        transaction_id: transactionId,
        original_transaction_id: originalTransactionId,
        has_signed_jws: Boolean(signedTransactionJws),
      });

      // Verify purchase with backend (transaction ids + optional StoreKit 2 JWS)
      const verifyReceipt = store.dispatch(
        subscriptionApiSlice.endpoints.verifyReceipt.initiate({
          product_id: productId,
          transaction_id: transactionId,
          original_transaction_id: originalTransactionId || undefined,
          ...(signedTransactionJws ? { signed_transaction_jws: signedTransactionJws } : {}),
        }),
      );

      const result = await verifyReceipt;
      
      console.log('Receipt verification result:', {
        success: result.data?.success,
        subscription: result.data?.subscription,
        error: result.error,
      });
      
      if (result.data?.success && result.data.subscription) {
        // Convert backend snake_case to app camelCase
        const sub = result.data.subscription;
        const subscription: SubscriptionStatus = {
          isActive: sub.is_active,
          planType: sub.plan_type,
          period: sub.period,
          expiresAt: sub.expires_at,
          productId: productId,
        };
        console.log('Subscription verified successfully:', subscription);
        store.dispatch(setSubscription(subscription));
        store.dispatch(setLoading(false));
      } else {
        const errorMsg = result.data?.message || (result.error as any)?.message || 'Failed to verify purchase';
        console.error('Receipt verification failed:', errorMsg);
        store.dispatch(setError(errorMsg));
        store.dispatch(setLoading(false));
        // Don't throw - just log the error
      }
    } catch (error: any) {
      console.error('Error verifying receipt:', error);
      const errorMsg = error?.message || error?.response?.data?.message || String(error) || 'Failed to verify purchase';
      store.dispatch(setError(errorMsg));
      store.dispatch(setLoading(false));
      // Don't throw - let the UI handle the error
    }
  }

  /**
   * Get available subscription products
   */
  async getAvailableProducts(): Promise<Product[]> {
    try {
      const productIds = getAllProductIds();
      const products = await fetchProducts({ skus: productIds });
      // Handle different return types
      if (!products) return [];
      return products as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      // Return empty array instead of throwing - allows purchase to still work
      return [];
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<void> {
    try {
      // Ensure IAP is initialized first
      if (!this.isInitialized) {
        console.log('IAP not initialized, initializing now...');
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize in-app purchases. Please try again.');
        }
      }

      store.dispatch(setLoading(true));
      store.dispatch(setError(null));

      console.log('Attempting to purchase product:', productId);
      
      // First, ensure products are loaded (required for requestPurchase)
      // This is critical - requestPurchase will fail without products loaded
      const productIds = getAllProductIds();
      console.log('Fetching products before purchase...', productIds);
      
      try {
        const fetchedProducts = await fetchProducts({ skus: productIds });
        const availableProducts = (fetchedProducts || []) as any[];
        console.log('Available products fetched:', availableProducts.length);
        
        if (availableProducts.length > 0) {
          // Check if the specific product exists
          const product = availableProducts.find((p: any) => {
            const id = p.productId || p.productIdentifier || (p as any).product_id;
            return id === productId;
          });
          
          if (product) {
            const foundId = product.productId || product.productIdentifier || (product as any).product_id;
            console.log('Product found:', foundId);
          } else {
            const availableIds = availableProducts.map((p: any) => 
              p.productId || p.productIdentifier || (p as any).product_id
            );
            console.warn(`Product ${productId} not found in available products. Available:`, availableIds);
            console.warn('This may happen if subscriptions are still in review.');
          }
        } else {
          console.warn('No products returned from App Store. This may happen if:');
          console.warn('1. Subscriptions are still in review (Waiting for Review)');
          console.warn('2. Products are not configured correctly in App Store Connect');
          console.warn('3. You need to test with a sandbox account');
          // Don't throw - try purchase anyway, might work in sandbox
        }
      } catch (fetchError: any) {
        console.error('Error fetching products:', fetchError);
        console.warn('Continuing with purchase attempt anyway - might work in sandbox');
        // Continue anyway - might work in sandbox even if fetch fails
      }
      
      // Request purchase - iOS will handle everything
      try {
        console.log('Calling requestPurchase with productId:', productId);
        const result = await requestPurchase({ 
          sku: productId,
        } as any);
        console.log('Purchase request sent successfully, result:', result);
        // The purchase will be handled by the purchaseUpdatedListener
        // Don't set loading to false here - let the listener handle it
      } catch (purchaseError: any) {
        // Handle purchase-specific errors
        console.error('Purchase request error details:', {
          error: purchaseError,
          code: (purchaseError as any)?.code,
          message: purchaseError?.message,
          productId: productId,
        });
        
        store.dispatch(setLoading(false));
        
        // Extract error information
        const errorCode = (purchaseError as any)?.code || (purchaseError as any)?.errorCode;
        const errorMessage = purchaseError?.message || (purchaseError as any)?.localizedDescription || String(purchaseError);
        
        // Handle user cancellation
        if (errorCode === 'E_USER_CANCELLED' || errorMessage.toLowerCase().includes('cancel')) {
          console.log('User cancelled purchase');
          return;
        }
        
        // Handle product availability errors - don't show error, iOS handles it
        if (
          errorMessage.includes('not available') || 
          errorMessage.includes('not found') ||
          errorMessage.includes('invalid') ||
          errorCode === 'E_ITEM_UNAVAILABLE'
        ) {
          console.log('Product not available - iOS will handle this');
          return;
        }
        
        // Handle connection/initialization errors
        if (
          errorMessage.includes('not initialized') ||
          errorMessage.includes('connection') ||
          errorCode === 'E_SERVICE_ERROR'
        ) {
          console.error('IAP service error, attempting re-initialization');
          // Try to re-initialize
          this.isInitialized = false;
          const reinitialized = await this.initialize();
          if (reinitialized) {
            // Retry purchase once
            try {
              await requestPurchase({ sku: productId } as any);
              return;
            } catch (retryError) {
              console.error('Retry purchase failed:', retryError);
            }
          }
          // Connection error - set error but don't throw
          store.dispatch(setError('Unable to connect to App Store. Please check your connection and try again.'));
          return;
        }
        
        // For other errors, rethrow so the UI can clear the loading state
        console.error('Purchase request failed, error listener will handle:', errorMessage);
        throw purchaseError;
      }
    } catch (error: any) {
      console.error('Error purchasing subscription (outer catch):', error);
      const errorMessage = error?.message || 'Purchase failed';
      
      if (errorMessage.includes('Failed to initialize')) {
        store.dispatch(setError(errorMessage));
        store.dispatch(setLoading(false));
        throw error;
      }
      
      // Rethrow purchase errors so the UI can clear the loading spinner
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

      // First, try to get subscription from backend
      const statusResult = await store.dispatch(
        subscriptionApiSlice.endpoints.getSubscriptionStatus.initiate(),
      );

      if (statusResult.data?.subscription) {
        // Subscription exists in backend (already converted to camelCase by transformResponse)
        store.dispatch(setSubscription(statusResult.data.subscription));
        store.dispatch(setLoading(false));
        return;
      }

      // If no backend subscription, check iOS purchases
      const purchases = await getAvailablePurchases();

      if (purchases.length === 0) {
        // Try restore endpoint from backend
        const restoreResult = await store.dispatch(
          subscriptionApiSlice.endpoints.restorePurchases.initiate({}),
        );
        
        if (restoreResult.data?.subscriptions && restoreResult.data.subscriptions.length > 0) {
          const activeSub = restoreResult.data.subscriptions.find(s => s.isActive);
          if (activeSub) {
            store.dispatch(setSubscription(activeSub));
            store.dispatch(setLoading(false));
            return;
          }
        }
        
        store.dispatch(setError('No previous purchases found'));
        store.dispatch(setLoading(false));
        return;
      }

      // Verify the most recent active subscription
      const activePurchase = purchases.find(
        (p: any) => {
          const id = p.productId || p.productIdentifier;
          return id && id.startsWith('com.petmood');
        },
      );

      if (activePurchase) {
        await this.handlePurchase(activePurchase as Purchase);
      } else {
        store.dispatch(setError('No active subscription found'));
        store.dispatch(setLoading(false));
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
