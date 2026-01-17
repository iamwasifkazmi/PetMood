import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import {
  RestorePurchasesResponse,
  VerifyReceiptRequest,
  VerifyReceiptResponse,
} from './types';

export const subscriptionApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'subscriptionApi',
  tagTypes: ['Subscription'],
  endpoints: build => ({
    /**
     * Verify iOS receipt with backend
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
     */
    getSubscriptionStatus: build.query<{ subscription: any }, void>({
      query: () => ({
        url: 'subscriptions/status',
        method: 'get',
      }),
      providesTags: ['Subscription'],
    }),

    /**
     * Restore purchases
     */
    restorePurchases: build.mutation<RestorePurchasesResponse, void>({
      query: () => ({
        url: 'subscriptions/restore',
        method: 'post',
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useVerifyReceiptMutation,
  useGetSubscriptionStatusQuery,
  useRestorePurchasesMutation,
} = subscriptionApiSlice;
