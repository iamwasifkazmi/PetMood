import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { subscriptionService } from '../services/subscriptionService';
import { useAppSelector } from '../features/store';
import {
  useGetSubscriptionStatusQuery,
  useGetPlansQuery,
} from '../features/subscription/subscriptionApiSlice';
import { Product } from 'react-native-iap';

/**
 * Hook for managing subscriptions
 */
export const useSubscription = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const subscription = useAppSelector(state => state.subscription?.subscription);
  const isLoading = useAppSelector(state => state.subscription?.isLoading);
  const error = useAppSelector(state => state.subscription?.error);

  // Fetch plans from backend
  const { data: plansData, isLoading: plansLoading } = useGetPlansQuery();

  // Fetch subscription status from backend
  const { data: subscriptionStatus, refetch: refetchStatus } =
    useGetSubscriptionStatusQuery(undefined, {
      skip: !isInitialized,
    });

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

  // Use subscription from Redux or backend
  // Backend subscription is already converted to camelCase by transformResponse
  const currentSubscription = subscription || subscriptionStatus?.subscription || null;

  return {
    products,
    plans: plansData?.plans || [],
    subscription: currentSubscription,
    isLoading: isLoading || plansLoading,
    error,
    isInitialized,
    purchaseSubscription,
    restorePurchases,
    refetchStatus,
  };
};
