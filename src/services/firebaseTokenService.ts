import axios from 'axios';
import { FIREBASE_SECURE_TOKEN_URL } from '../common/firebase';
import {
  setAuthSession,
  type AuthSessionPayload,
} from '../features/auth/authSlice';
import { store } from '../features/store';

let refreshInFlight: Promise<string> | null = null;

export function isIdTokenStale(): boolean {
  const { token, tokenExpiresAt } = store.getState().auth ?? {};
  if (!token) {
    return true;
  }
  if (tokenExpiresAt == null) {
    return false;
  }
  return Date.now() >= tokenExpiresAt;
}

type SecureTokenResponse = {
  id_token: string;
  refresh_token: string;
  expires_in: string;
};

/**
 * Exchange refresh token for a new ID token (Firebase Secure Token API).
 */
export async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  const refreshToken = store.getState().auth?.refreshToken;
  if (!refreshToken) {
    throw new Error('No Firebase refresh token');
  }

  refreshInFlight = (async () => {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const { data } = await axios.post<SecureTokenResponse>(
      FIREBASE_SECURE_TOKEN_URL,
      body.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    if (!data?.id_token) {
      throw new Error('Token refresh returned no id_token');
    }

    const session: AuthSessionPayload = {
      idToken: data.id_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in || '3600',
    };
    store.dispatch(setAuthSession(session));
    return session.idToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Returns a valid Firebase ID token for API Authorization.
 * Uses refresh token when the cached ID token is missing or near expiry.
 */
export async function getValidIdToken(
  forceRefresh = false,
): Promise<string | null> {
  const auth = store.getState().auth;
  const cached = auth?.token;

  if (!auth?.refreshToken) {
    return cached ?? null;
  }

  if (!forceRefresh && cached && !isIdTokenStale()) {
    return cached;
  }

  try {
    return await refreshAccessToken();
  } catch (e) {
    console.warn('Firebase ID token refresh failed', e);
    return null;
  }
}

/** Restore session on cold start (after redux-persist rehydrate). */
export async function bootstrapAuthSession(): Promise<void> {
  const { refreshToken } = store.getState().auth ?? {};
  if (!refreshToken) {
    return;
  }
  await getValidIdToken(isIdTokenStale());
}

export function resetTokenRefreshState(): void {
  refreshInFlight = null;
}
