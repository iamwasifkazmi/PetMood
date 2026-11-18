import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useAppSelector } from '../store';
import { subscriptionService } from '../../services/subscriptionService';
import { resolveDbUserId } from '../../services/revenueCatAndroid';

/**
 * Android only: bind RevenueCat to PetMood db user id (Firebase uid) after login,
 * and log out of RevenueCat when the session ends.
 */
export function RevenueCatIdentitySync() {
  const token = useAppSelector(state => state.auth?.token);
  const user = useAppSelector(state => state.user?.user);
  const dbUserId = resolveDbUserId(user);

  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }

    let cancelled = false;

    const run = async () => {
      if (!token || !dbUserId) {
        await subscriptionService.unbindAndroidUser();
        return;
      }
      try {
        if (!cancelled) {
          await subscriptionService.bindAndroidUser(dbUserId);
        }
      } catch (e) {
        console.warn('RevenueCat identity bind failed:', e);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [token, dbUserId]);

  return null;
}
