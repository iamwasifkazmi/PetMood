import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import { mapQuotasFromBackend } from '../../utils/subscriptionQuotas';
import {
  PlansResponse,
  CancelSubscriptionResponse,
  RestorePurchasesResponse,
  SubscriptionStatus,
  SubscriptionStatusResponse,
  VerifyReceiptRequest,
  VerifyReceiptResponse,
} from './types';

function mapStatusFromBackend(
  sub: Record<string, any> | null | undefined,
  meta?: {
    access_active?: boolean;
    reason?: string | null;
  },
): SubscriptionStatus | null {
  if (!sub) {
    return null;
  }
  const backendStatusRaw = sub.status;
  const backendStatus =
    typeof backendStatusRaw === 'string' && backendStatusRaw.trim() !== ''
      ? backendStatusRaw.trim()
      : null;
  return {
    isActive: Boolean(sub.is_active),
    planType: sub.plan_type ?? null,
    period: sub.period ?? null,
    expiresAt: sub.expires_at ?? null,
    productId: sub.product_id || null,
    isTrial: Boolean(sub.is_trial),
    trialDays: sub.trial_days ?? null,
    trialDaysLeft: sub.trial_days_left ?? null,
    backendStatus,
    accessActive:
      typeof meta?.access_active === 'boolean' ? meta.access_active : null,
    accessReason: typeof meta?.reason === 'string' ? meta.reason : null,
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
     * Get current subscription status + quotas (backend source of truth)
     */
    getSubscriptionStatus: build.query<SubscriptionStatusResponse, void>({
      query: () => ({
        url: 'subscriptions/status',
        method: 'get',
      }),
      transformResponse: (response: {
        subscription: any | null;
        quotas?: Record<string, any>;
        access_active?: boolean;
        reason?: string | null;
      }): SubscriptionStatusResponse => ({
        subscription: mapStatusFromBackend(response.subscription, {
          access_active: response.access_active,
          reason: response.reason,
        }),
        quotas: mapQuotasFromBackend(response.quotas),
        accessActive:
          typeof response.access_active === 'boolean'
            ? response.access_active
            : null,
        accessReason:
          typeof response.reason === 'string' ? response.reason : null,
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
      transformResponse: (response: {
        subscriptions?: any[];
        quotas?: Record<string, any>;
      }): RestorePurchasesResponse => {
        const subscriptions = (response.subscriptions || [])
          .map((sub: any) => mapStatusFromBackend(sub))
          .filter((s): s is SubscriptionStatus => s != null);
        return {
          subscriptions,
          quotas: mapQuotasFromBackend(response.quotas),
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
