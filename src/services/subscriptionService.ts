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
  isUserCancelledError,
} from 'react-native-iap';
import { Platform } from 'react-native';
import { getAllProductIds, getProductIdFromIapProduct } from '../constants/subscription';
import { store } from '../features/store';
import {
  setSubscriptionStatus,
  setError,
  setLoading,
} from '../features/subscription/subscriptionSlice';
import { DEFAULT_QUOTAS } from '../utils/subscriptionQuotas';
import { subscriptionApiSlice } from '../features/subscription/subscriptionApiSlice';

/**
 * Covers StoreKit dismissals: library UserCancelled mapping, SK payment canceled (often 2),
 * and sandbox sign-in/popup cancellations.
 */
function shouldTreatPurchaseErrorAsBenignDismissal(error: unknown): boolean {
  if (isUserCancelledError(error)) {
    return true;
  }
  const e = error as Record<string, unknown> | undefined;
  if (!e || typeof e !== 'object') {
    return false;
  }
  if (Platform.OS === 'ios') {
    const numeric =
      typeof e.responseCode === 'number'
        ? e.responseCode
        : typeof e.code === 'number'
          ? e.code
          : typeof e.errorCode === 'number'
            ? e.errorCode
            : null;
    if (numeric === 2) {
      return true;
    }
  }
  const msg = String(
    e.localizedDescription ?? e.message ?? '',
  ).toLowerCase();
  return (
    msg.includes('cancel') &&
    !msg.includes('unable to connect') &&
    !msg.includes('network')
  );
}

/** react-native-iap v14+ requires explicit subscription shape; flat `{ sku }` fails with "Missing purchase request configuration". */
function requestSubscriptionPurchaseIOS(sku: string) {
  return requestPurchase({
    type: 'subs',
    request: {
      apple: { sku },
    },
  });
}

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
      const errorCode = (error as any)?.code || (error as any)?.errorCode;
      const errorMessage =
        error?.message || (error as any)?.localizedDescription || 'Purchase failed';

      if (shouldTreatPurchaseErrorAsBenignDismissal(error)) {
        console.log('Purchase dismissed / user cancelled:', errorMessage);
        store.dispatch(setLoading(false));
        return;
      }

      console.error('Purchase error listener:', error);
      
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

      if (result.data?.success) {
        // Entitlement + quotas: GET /api/subscriptions/status is the source of truth
        const status = await store.dispatch(
          subscriptionApiSlice.endpoints.getSubscriptionStatus.initiate(undefined, {
            forceRefetch: true,
          }),
        );
        if (status.data) {
          console.log('Subscription from status (canonical):', status.data);
          store.dispatch(
            setSubscriptionStatus({
              subscription: status.data.subscription ?? null,
              quotas: status.data.quotas ?? DEFAULT_QUOTAS,
            }),
          );
        } else {
          const errMsg =
            'Purchase was verified, but we could not load your subscription. Try Restore or open subscription settings again in a moment.';
          console.error('verify-receipt ok but no status');
          store.dispatch(setError(errMsg));
        }
        store.dispatch(setLoading(false));
      } else {
        const errorMsg = result.data?.message || (result.error as any)?.message || 'Failed to verify purchase';
        console.error('Receipt verification failed:', errorMsg);
        store.dispatch(setError(errorMsg));
        store.dispatch(setLoading(false));
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
      const products = await fetchProducts({ skus: productIds, type: 'subs' });
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
        const fetchedProducts = await fetchProducts({ skus: productIds, type: 'subs' });
        const availableProducts = (fetchedProducts || []) as any[];
        console.log('Available products fetched:', availableProducts.length);
        
        if (availableProducts.length > 0) {
          // Check if the specific product exists
          const product = availableProducts.find((p: any) => {
            const id = getProductIdFromIapProduct(p);
            return id === productId;
          });
          
          if (product) {
            const foundId = getProductIdFromIapProduct(product);
            console.log('Product found:', foundId);
          } else {
            const availableIds = availableProducts.map((p: any) =>
              getProductIdFromIapProduct(p) ?? '(unknown)',
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
        const result = await requestSubscriptionPurchaseIOS(productId);
        console.log('Purchase request sent successfully, result:', result);
        // The purchase will be handled by the purchaseUpdatedListener
        // Don't set loading to false here - let the listener handle it
      } catch (purchaseError: any) {
        store.dispatch(setLoading(false));

        const errorMessage =
          purchaseError?.message ||
          (purchaseError as any)?.localizedDescription ||
          String(purchaseError);

        // User closed Sign in / IAP — avoid error-level logs
        if (shouldTreatPurchaseErrorAsBenignDismissal(purchaseError)) {
          console.log('User cancelled purchase (request path):', errorMessage);
          return;
        }

        console.error('Purchase request error details:', {
          error: purchaseError,
          code: (purchaseError as any)?.code,
          message: purchaseError?.message,
          productId,
        });

        const errorCode =
          (purchaseError as any)?.code || (purchaseError as any)?.errorCode;

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
              await requestSubscriptionPurchaseIOS(productId);
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
   * Restore previous purchases: POST /restore, then GET /status (source of truth).
   * If still no entitlement, verify local StoreKit purchases with verify-receipt.
   */
  async restorePurchases(): Promise<void> {
    try {
      store.dispatch(setLoading(true));
      store.dispatch(setError(null));

      await store.dispatch(
        subscriptionApiSlice.endpoints.restorePurchases.initiate({}),
      );

      const statusResult = await store.dispatch(
        subscriptionApiSlice.endpoints.getSubscriptionStatus.initiate(undefined, {
          forceRefetch: true,
        }),
      );

      if (statusResult.data) {
        store.dispatch(
          setSubscriptionStatus({
            subscription: statusResult.data.subscription ?? null,
            quotas: statusResult.data.quotas ?? DEFAULT_QUOTAS,
          }),
        );
        if (statusResult.data.subscription?.isActive) {
          return;
        }
      }

      const purchases = await getAvailablePurchases();

      if (purchases.length === 0) {
        store.dispatch(setError('No previous purchases found'));
        return;
      }

      const activePurchase = purchases.find((p: any) => {
        const id = p.productId || p.productIdentifier;
        return id && id.startsWith('com.petmood');
      });

      if (activePurchase) {
        await this.handlePurchase(activePurchase as Purchase);
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
