import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding that clears the iOS home indicator and Android
 * gesture / 3-button navigation bar.
 *
 * Trust SafeAreaInsets — this app uses edge-to-edge on Android, so
 * `insets.bottom` is the real system inset. A hard floor (e.g. 56)
 * double-counted that space and left a huge empty gap under the tab bar.
 */
export function useSafeBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsets();
  return insets.bottom + extra;
}

export function useSafeTopPadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}
