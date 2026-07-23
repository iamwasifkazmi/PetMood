import { CommonActions } from '@react-navigation/native';
import type { NavigationProp, ParamListBase } from '@react-navigation/native';
import { RouteName } from '../navigation/types';

/** Open Subscription paywall from tab / nested screens (drawer parent). */
export function navigateToSubscription(
  navigation: NavigationProp<ParamListBase>,
): void {
  const parent = navigation.getParent?.();
  if (parent) {
    parent.navigate(RouteName.Subscription as never);
    return;
  }
  navigation.dispatch(
    CommonActions.navigate({ name: RouteName.Subscription }),
  );
}
