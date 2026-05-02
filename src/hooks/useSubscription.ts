import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { subscriptionService } from '../services/subscriptionService';
import { useAppSelector } from '../features/store';
import {
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
} from '../features/subscription/subscriptionApiSlice';
import { Product } from 'react-native-iap';

/**
 * Hook for managing subscriptions
 */
export const useSubscription = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoading = useAppSelector(state => state.subscription?.isLoading);
  const error = useAppSelector(state => state.subscription?.error);

  // Fetch plans from backend; same cache as other subscribers
  const {
    data: plansData,
    isLoading: plansLoading,
    refetch: refetchPlans,
  } = useGetPlansQuery();

  const {
    data: statusData,
    isLoading: statusLoading,
    isFetching: statusFetching,
    isSuccess: subscriptionStatusSuccess,
    isError: subscriptionStatusError,
    refetch: refetchSubscriptionStatus,
  } = useGetSubscriptionStatusQuery();

  /** Redux (sync component) or RTK cache — whichever has data first avoids an empty UI on this screen */
  const subscription = useAppSelector(state => state.subscription?.subscription);
  const effectiveSubscription =
    subscription ?? statusData?.subscription ?? null;

  const refetchStatus = useCallback(
    () => refetchSubscriptionStatus(),
    [refetchSubscriptionStatus],
  );

  /**
   * Initialize IAP and load products
   */
  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const init = async () => {
      try {
        const initialized = await subscriptionService.initialize();
        if (initialized) {
          setIsInitialized(true);
          const availableProducts = await subscriptionService.getAvailableProducts();
          setProducts(availableProducts);
        }
      } catch (error) {
        console.error('Failed to initialize subscription service:', error);
      }
    };

    init();

    return () => {
      subscriptionService.cleanup();
    };
  }, []);

  /**
   * Purchase a subscription
   */
  const purchaseSubscription = async (productId: string) => {
    try {
      // Don't check for products - let iOS handle product availability
      // This allows purchases to work even if products aren't loaded (sandbox/review scenarios)
      await subscriptionService.purchaseSubscription(productId);
      // Status will be updated via purchase listener
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * Restore purchases
   */
  const restorePurchases = async () => {
    try {
      await subscriptionService.restorePurchases();
      await refetchStatus();
    } catch (error) {
      throw error;
    }
  };

  const refreshStoreProducts = useCallback(async () => {
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      const available = await subscriptionService.getAvailableProducts();
      setProducts(available);
    } catch (e) {
      console.error('Failed to refresh App Store products:', e);
    }
  }, []);

  /** Refetch plans, entitlement status, and (iOS) StoreKit product list */
  const refreshAll = useCallback(async () => {
    await Promise.all([refetchPlans(), refetchSubscriptionStatus()]);
    if (Platform.OS !== 'ios') {
      return;
    }
    try {
      const ok = await subscriptionService.initialize();
      if (ok) {
        setIsInitialized(true);
      }
      await refreshStoreProducts();
    } catch (e) {
      console.error('refreshAll IAP', e);
    }
  }, [refetchPlans, refetchSubscriptionStatus, refreshStoreProducts]);

  return {
    products,
    plans: plansData?.plans || [],
    subscription: effectiveSubscription,
    isLoading: isLoading || plansLoading || statusLoading,
    statusFetching,
    subscriptionStatusResolved:
      subscriptionStatusSuccess || subscriptionStatusError,
    error,
    isInitialized,
    purchaseSubscription,
    restorePurchases,
    refetchStatus,
    refetchPlans,
    refreshAll,
  };
};
