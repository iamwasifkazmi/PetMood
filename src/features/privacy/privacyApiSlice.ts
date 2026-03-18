import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import { GetAiConsentRes, SetAiConsentArg, SetAiConsentRes } from './types';

export const privacyApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'privacyApi',
  tagTypes: ['AiConsent'],
  endpoints: build => ({
    getAiConsent: build.query<GetAiConsentRes, void>({
      query: () => ({
        url: 'services/privacy/ai-consent',
        method: 'get',
      }),
      providesTags: ['AiConsent'],
    }),
    setAiConsent: build.mutation<SetAiConsentRes, SetAiConsentArg>({
      query: body => ({
        url: 'services/privacy/ai-consent',
        method: 'post',
        data: body,
      }),
      invalidatesTags: ['AiConsent'],
    }),
  }),
});

export const { useGetAiConsentQuery, useLazyGetAiConsentQuery, useSetAiConsentMutation } =
  privacyApiSlice;

