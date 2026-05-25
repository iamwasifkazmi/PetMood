import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

export function computeTokenExpiresAt(expiresIn: string | number): number {
  const seconds =
    typeof expiresIn === 'number'
      ? expiresIn
      : parseInt(String(expiresIn), 10) || 3600;
  return Date.now() + seconds * 1000 - TOKEN_EXPIRY_BUFFER_MS;
}

export interface AuthSessionPayload {
  idToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthSliceState {
  token?: string;
  refreshToken?: string;
  /** Epoch ms — refresh ID token before this time */
  tokenExpiresAt?: number;
}

const initialState: AuthSliceState = {};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<AuthSliceState['token']>) => {
      state.token = action.payload;
    },
    setAuthSession: (state, action: PayloadAction<AuthSessionPayload>) => {
      state.token = action.payload.idToken;
      state.refreshToken = action.payload.refreshToken;
      state.tokenExpiresAt = computeTokenExpiresAt(action.payload.expiresIn);
    },
    clearAuthSession: state => {
      state.token = undefined;
      state.refreshToken = undefined;
      state.tokenExpiresAt = undefined;
    },
  },
});

export const { setToken, setAuthSession, clearAuthSession } = authSlice.actions;
