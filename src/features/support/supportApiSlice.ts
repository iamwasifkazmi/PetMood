import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';

export const supportApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'supportApi',
  endpoints: build => ({
    sendSupportMessage: build.mutation<any, supportArg>({
      query: arg => ({
        url: `support/send`,
        data: arg,
        method: 'post',
      }),
    }),
  }),
});

export const { useSendSupportMessageMutation } = supportApiSlice;
