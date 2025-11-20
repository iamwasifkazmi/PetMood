import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthSliceState {
  token?: string;
}

export const authSlice = createSlice({
  name: 'auth',
  initialState: {} as AuthSliceState,
  reducers: {
    setToken: (state, action: PayloadAction<AuthSliceState['token']>) => {
      state.token = action.payload;
    },
  },
});

export const { setToken } = authSlice.actions;
