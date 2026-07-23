import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { subscriptionService } from '../services/subscriptionService';
import { useAppSelector } from '../features/store';
import {
  useGetPlansQuery,
  useGetSubscriptionStatusQuery,
} from '../features/subscription/subscriptionApiSlice';
import { Product } from 'react-native-iap';
import {
  canAddPetProfile,
  canStartScan,
  DEFAULT_QUOTAS,
} from '../utils/subscriptionQuotas';

/**
 * Hook for managing subscriptions + quotas (backend source of truth)
 */
export const useSubscription = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const isLoading = useAppSelector(state => state.subscription?.isLoading);
  const error = useAppSelector(state => state.subscription?.error);

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

  const subscription = useAppSelector(state => state.subscription?.subscription);
  const quotasFromStore = useAppSelector(state => state.subscription?.quotas);

  const effectiveSubscription =
    subscription ?? statusData?.subscription ?? null;
  const quotas =
    quotasFromStore ?? statusData?.quotas ?? null;

  const refetchStatus = useCallback(
    () => refetchSubscriptionStatus(),
    [refetchSubscriptionStatus],
  );

  useEffect(() => {
    if (Platform.OS !== 'ios') {
      return;
    }

    const init = async () => {
      try {
        const initialized = await subscriptionService.initialize();
        if (initialized) {
          setIsInitialized(true);
          const availableProducts =
            await subscriptionService.getAvailableProducts();
          setProducts(availableProducts);
        }
      } catch (err) {
        console.error('Failed to initialize subscription service:', err);
      }
    };

    init();

    return () => {
      subscriptionService.cleanup();
    };
  }, []);

  const purchaseSubscription = async (productId: string) => {
    try {
      await subscriptionService.purchaseSubscription(productId);
    } catch (err: any) {
      throw err;
    }
  };

  const restorePurchases = async () => {
    try {
      await subscriptionService.restorePurchases();
      await refetchStatus();
    } catch (err) {
      throw err;
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

  const quotaFlags = useMemo(() => {
    const q = quotas ?? DEFAULT_QUOTAS;
    return {
      canAddPet: canAddPetProfile(q),
      canScan: canStartScan(q),
      requiresSubscription: q.requiresSubscription,
    };
  }, [quotas]);

  return {
    products,
    plans: plansData?.plans || [],
    subscription: effectiveSubscription,
    quotas,
    canAddPet: quotaFlags.canAddPet,
    canScan: quotaFlags.canScan,
    requiresSubscription: quotaFlags.requiresSubscription,
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
