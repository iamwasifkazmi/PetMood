import { Platform } from 'react-native';
import { clearUser } from '../features/user/userSlice';
import { resetTokenRefreshState } from './firebaseTokenService';
import { resetToSplash } from '../../services/navigationService';
import { store } from '../features/store';
import { subscriptionService } from './subscriptionService';

/** Clear persisted auth and return user to the public stack. */
export function performLogout(): void {
  if (Platform.OS === 'android') {
    void subscriptionService.unbindAndroidUser();
  }
  resetTokenRefreshState();
  store.dispatch({ type: 'LOGOUT' });
  store.dispatch(clearUser());
  resetToSplash();
}
