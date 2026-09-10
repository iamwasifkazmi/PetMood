import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Bottom padding that clears the iOS home indicator and Android
 * 3-button / gesture navigation bar.
 *
 * Android often reports inset 0 when edge-to-edge is off or OEM
 * navigation is translucent, so we keep a small platform floor.
 */
export function useSafeBottomPadding(extra = 16): number {
  const insets = useSafeAreaInsets();
  const androidFloor = Platform.OS === 'android' ? 56 : 0;
  return Math.max(insets.bottom, androidFloor) + extra;
}

export function useSafeTopPadding(extra = 0): number {
  const insets = useSafeAreaInsets();
  return insets.top + extra;
}
