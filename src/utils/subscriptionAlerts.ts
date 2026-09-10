import { Alert } from 'react-native';
import type { NavigationProp } from '@react-navigation/native';
import type {
  DailyScanLimitErrorResponse,
  ProfileLimitErrorResponse,
} from '../features/subscription/types';
import {
  formatResetsAt,
  getApiErrorCode,
  getApiErrorData,
  getApiErrorDetail,
  isDailyScanLimitError,
} from './subscriptionQuotas';
import { navigateToSubscription } from './navigateToSubscription';

function mapServerButtons(
  buttons: string[],
  navigation: NavigationProp<any>,
) {
  return buttons.map(label => {
    const normalized = label.trim().toLowerCase();
    if (normalized === 'upgrade' || normalized === 'subscribe') {
      return {
        text: label,
        onPress: () => navigateToSubscription(navigation),
      };
    }
    return {
      text: label,
      style: 'cancel' as const,
    };
  });
}

export function showProfileLimitAlert(
  error: unknown,
  navigation: NavigationProp<any>,
): boolean {
  const code = getApiErrorCode(error);
  if (code !== 'profile_limit_reached') {
    return false;
  }

  const data = getApiErrorData(error) as ProfileLimitErrorResponse | null;
  const title = data?.title || 'Profile limit';
  const message =
    data?.message ||
    data?.detail ||
    getApiErrorDetail(error) ||
    'Profile limit reached.';
  const buttons =
    Array.isArray(data?.buttons) && data.buttons.length > 0
      ? data.buttons
      : ['OK'];

  Alert.alert(title, message, mapServerButtons(buttons, navigation));
  return true;
}

export function showSubscriptionRequiredAlert(
  error: unknown,
  navigation: NavigationProp<any>,
  fallbackMessage?: string,
): boolean {
  const code = getApiErrorCode(error);
  if (code !== 'subscription_required') {
    return false;
  }

  const detail =
    getApiErrorDetail(error) ||
    fallbackMessage ||
    'Please subscribe to continue scanning your pet’s emotions.';

  Alert.alert('Subscription required', detail, [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Subscribe',
      onPress: () => navigateToSubscription(navigation),
    },
  ]);
  return true;
}

export function showDailyScanLimitAlert(error: unknown): boolean {
  const status = (error as { status?: unknown })?.status;
  if (!isDailyScanLimitError(status, error)) {
    return false;
  }

  const data = getApiErrorData(error) as DailyScanLimitErrorResponse | null;
  const title = 'Daily scan limit reached';
  const detail =
    data?.detail ||
    getApiErrorDetail(error) ||
    'You have used all scans for today.';
  const usage =
    data?.limit != null && data?.used != null
      ? `\n\nUses today: ${data.used}/${data.limit}.`
      : '';
  const resetLine = data?.resetsAt
    ? `\n\nTry again after ${formatResetsAt(data.resetsAt)}.`
    : '';

  Alert.alert(title, `${detail}${usage}${resetLine}`, [{ text: 'OK' }]);
  return true;
}

export function openScanPaywall(
  navigation: NavigationProp<any>,
  message?: string,
) {
  Alert.alert(
    'Subscription required',
    message ||
      'Your trial has ended. Please subscribe to continue scanning your pet’s emotions.',
    [
      { text: 'Not now', style: 'cancel' },
      {
        text: 'Subscribe',
        onPress: () => navigateToSubscription(navigation),
      },
    ],
  );
}

export function openDailyScanLimitFromQuotas(
  resetsAt: string | null | undefined,
) {
  Alert.alert(
    'Daily scan limit reached',
    `You’ve used all scans for today. Try again after ${formatResetsAt(
      resetsAt,
    )}.`,
    [{ text: 'OK' }],
  );
}
