import { clearUser } from '../features/user/userSlice';
import { resetTokenRefreshState } from './firebaseTokenService';
import { resetToSplash } from '../../services/navigationService';
import { store } from '../features/store';

/** Clear persisted auth and return user to the public stack. */
export function performLogout(): void {
  resetTokenRefreshState();
  store.dispatch({ type: 'LOGOUT' });
  store.dispatch(clearUser());
  resetToSplash();
}
