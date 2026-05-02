import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useGetSubscriptionStatusQuery } from './subscriptionApiSlice';
import { store } from '../store';
import { clearSubscription, setSubscription } from './subscriptionSlice';

/**
 * While signed in, keeps GET /api/subscriptions/status in sync with Redux and refetches
 * on app resume (per backend integration guide).
 */
export function SubscriptionEntitlementSync() {
  const { data, isSuccess, refetch } = useGetSubscriptionStatusQuery();

  useEffect(() => {
    if (!isSuccess) {
      return;
    }
    if (data?.subscription) {
      store.dispatch(setSubscription(data.subscription));
    } else {
      store.dispatch(clearSubscription());
    }
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
