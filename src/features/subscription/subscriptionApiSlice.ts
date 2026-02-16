import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import {
  PlansResponse,
  RestorePurchasesResponse,
  SubscriptionStatus,
  VerifyReceiptRequest,
  VerifyReceiptResponse,
} from './types';

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
     * Verify iOS receipt with backend
     * Uses transaction_id (not receipt_data) - backend uses App Store Server API
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
      transformResponse: (response: { subscription: any | null }) => {
        if (!response.subscription) {
          return { subscription: null };
        }
        // Convert backend snake_case to app camelCase
        const sub = response.subscription;
        return {
          subscription: {
            isActive: sub.is_active,
            planType: sub.plan_type,
            period: sub.period,
            expiresAt: sub.expires_at,
            productId: sub.product_id || null,
          },
        };
      },
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
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetPlansQuery,
  useVerifyReceiptMutation,
  useGetSubscriptionStatusQuery,
  useRestorePurchasesMutation,
} = subscriptionApiSlice;
