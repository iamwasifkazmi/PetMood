import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SubscriptionQuotas, SubscriptionStatus } from './types';
import { DEFAULT_QUOTAS } from '../../utils/subscriptionQuotas';

interface SubscriptionState {
  subscription: SubscriptionStatus | null;
  quotas: SubscriptionQuotas | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SubscriptionState = {
  subscription: null,
  quotas: null,
  isLoading: false,
  error: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (
      state,
      action: PayloadAction<SubscriptionStatus | null>,
    ) => {
      state.subscription = action.payload;
      state.error = null;
    },
    setQuotas: (state, action: PayloadAction<SubscriptionQuotas>) => {
      state.quotas = action.payload;
    },
    setSubscriptionStatus: (
      state,
      action: PayloadAction<{
        subscription: SubscriptionStatus | null;
        quotas: SubscriptionQuotas;
      }>,
    ) => {
      state.subscription = action.payload.subscription;
      state.quotas = action.payload.quotas;
      state.error = null;
    },
    clearSubscription: state => {
      state.subscription = null;
      state.quotas = { ...DEFAULT_QUOTAS };
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
  setQuotas,
  setSubscriptionStatus,
  clearSubscription,
  setLoading,
  setError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
