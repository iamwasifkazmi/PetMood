import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionStatus } from './types';

interface SubscriptionState {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<SubscriptionStatus>) => {
      state.subscription = action.payload;
      state.error = null;
    },
    clearSubscription: state => {
      state.subscription = null;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setSubscription,
  clearSubscription,
  setLoading,
  setError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
