import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import {
  PlansResponse,
  CancelSubscriptionResponse,
  RestorePurchasesResponse,
  SubscriptionStatus,
  VerifyReceiptRequest,
  VerifyReceiptResponse,
} from './types';

function mapStatusFromBackend(
  sub: Record<string, any> | null | undefined,
): SubscriptionStatus | null {
  if (!sub) {
    return null;
  }
  return {
    isActive: Boolean(sub.is_active),
    planType: sub.plan_type ?? null,
    period: sub.period ?? null,
    expiresAt: sub.expires_at ?? null,
    productId: sub.product_id || null,
    isTrial: Boolean(sub.is_trial),
    trialDays: sub.trial_days ?? null,
    trialDaysLeft: sub.trial_days_left ?? null,
  };
}

export const subscriptionApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'subscriptionApi',
  tagTypes: ['Subscription', 'Plans'],
  endpoints: build => ({
    /**
     * Get available subscription plans from backend
     */
    getPlans: build.query<PlansResponse, void>({
      query: () => ({
        url: 'subscriptions/plans',
        method: 'get',
      }),
      providesTags: ['Plans'],
    }),

    /**
     * Verify iOS purchase with backend after StoreKit completes a transaction.
     * Payload: product_id, transaction_id, optional original_transaction_id,
     * optional signed_transaction_jws (StoreKit 2 JWS from purchase.purchaseToken on iOS).
     * See docs/IAP_VERIFY_RECEIPT_AND_BACKEND.md for the full contract.
     */
    verifyReceipt: build.mutation<
      VerifyReceiptResponse,
      VerifyReceiptRequest
    >({
      query: arg => ({
        url: 'subscriptions/verify-receipt',
        method: 'post',
        data: arg,
      }),
      invalidatesTags: ['Subscription'],
    }),

    /**
     * Get current subscription status
     * Backend returns snake_case, we convert to camelCase
     */
    getSubscriptionStatus: build.query<
      { subscription: SubscriptionStatus | null },
      void
    >({
      query: () => ({
        url: 'subscriptions/status',
        method: 'get',
      }),
      transformResponse: (response: { subscription: any | null }) => ({
        subscription: mapStatusFromBackend(response.subscription),
      }),
      providesTags: ['Subscription'],
    }),

    /**
     * Restore purchases
     */
    restorePurchases: build.mutation<RestorePurchasesResponse, {}>({
      query: () => ({
        url: 'subscriptions/restore',
        method: 'post',
        data: {},
      }),
      transformResponse: (response: { subscriptions?: any[] }) => {
        if (!response.subscriptions?.length) {
          return { subscriptions: [] };
        }
        return {
          subscriptions: response.subscriptions
            .map((sub: any) => mapStatusFromBackend(sub))
            .filter((s): s is SubscriptionStatus => s != null),
        };
      },
      invalidatesTags: ['Subscription'],
    }),

    /** Returns Apple / Google manage URL — backend does not cancel Apple directly */
    cancelSubscription: build.mutation<CancelSubscriptionResponse, void>({
      query: () => ({
        url: 'subscriptions/cancel',
        method: 'post',
        data: {},
      }),
    }),
  }),
});

export const {
  useGetPlansQuery,
  useVerifyReceiptMutation,
  useGetSubscriptionStatusQuery,
  useRestorePurchasesMutation,
  useCancelSubscriptionMutation,
} = subscriptionApiSlice;
