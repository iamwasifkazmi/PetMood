import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useSelector } from 'react-redux';
import { subscriptionService } from '../services/subscriptionService';
import { useAppSelector } from '../features/store';
import { useGetSubscriptionStatusQuery } from '../features/subscription/subscriptionApiSlice';
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
      // Ensure products are loaded
      if (!isInitialized) {
        throw new Error('Subscription service is not initialized. Please wait...');
      }
      
      if (products.length === 0) {
        throw new Error('Products are not loaded yet. Please wait...');
      }

      // Check if product exists
      const productExists = products.some(p => p.productId === productId);
      if (!productExists) {
        throw new Error('This product is not available. Please ensure the subscription is configured in App Store Connect.');
      }

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

  return {
    products,
    subscription: subscription || subscriptionStatus?.subscription,
    isLoading,
    error,
    isInitialized,
    purchaseSubscription,
    restorePurchases,
    refetchStatus,
  };
};
