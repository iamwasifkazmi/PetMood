import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGetSubscriptionStatusQuery } from './subscriptionApiSlice';
import { store } from '../store';
import { setSubscriptionStatus } from './subscriptionSlice';
import { DEFAULT_QUOTAS } from '../../utils/subscriptionQuotas';

/**
 * While signed in, keeps GET /api/subscriptions/status (subscription + quotas)
 * in sync with Redux and refetches on app resume.
 */
export function SubscriptionEntitlementSync() {
  const { data, isSuccess, refetch } = useGetSubscriptionStatusQuery();

  useEffect(() => {
    if (!isSuccess || !data) {
      return;
    }
    store.dispatch(
      setSubscriptionStatus({
        subscription: data.subscription ?? null,
        quotas: data.quotas ?? DEFAULT_QUOTAS,
      }),
    );
  }, [isSuccess, data]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void refetch();
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [refetch]);

  return null;
}
