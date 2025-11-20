import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { Alert } from 'react-native';
import { showErrMsg, showSuccessMsg } from '../utils/flashMessage';
import { store } from './store';
import navigation from '../navigation';
import { clearUser } from './user/userSlice';
import { resetToSplash } from '../../services/navigationService';

const axiosBaseQuery =
  (
    { baseUrl }: { baseUrl: string } = { baseUrl: '' },
  ): BaseQueryFn<
    {
      url: string;
      method?: AxiosRequestConfig['method'];
      data?: AxiosRequestConfig['data'];
      params?: AxiosRequestConfig['params'];
      headers?: AxiosRequestConfig['headers'];
      _baseUrl?: AxiosRequestConfig['baseURL'];
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params, headers, _baseUrl }) => {
    try {
      const token = store.getState()?.auth?.token;
      console.info(
        '******** API CALL ********',
        '\nreq-method: ' + method,
        '\nreq-url: ' +
          (typeof _baseUrl === 'string' ? _baseUrl : baseUrl) +
          url,
        // '\nreq-headers: ' + JSON.stringify(headers),
        '\nreq-token: ' + token,
        '\nreq-data: ' + JSON.stringify(data),
        '\nreq-params: ' + JSON.stringify(params),
      );
      const result = await axios({
        url: url,
        baseURL: typeof _baseUrl === 'string' ? _baseUrl : baseUrl,
        method,
        data,
        params,
        headers: {
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
          ...headers,
        },
      });

      console.log(
        '\nres-status: ' + result.status,
        '\nres-data: ' + JSON.stringify(result.data),
        '\n******** END ********\n',
      );

      const resMsg = result.data.message;
      const resStatus = result.data.status;

      // if (resMsg) {
      //   showSuccessMsg(resMsg);
      // }
      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;

      // Extract readable values safely
      const status = err.response?.status ?? 'No status';
      const data = err.response?.data ?? {};
      const detail =
        (err.response?.data as any)?.detail ||
        (err.response?.data as any)?.error?.message ||
        err.message;

      // Show error message in UI
      showErrMsg(detail);
      if (status === 403) {
        store.dispatch({ type: 'LOGOUT' });
        store.dispatch(clearUser());
        resetToSplash(); // navigation to Splash
      }
      // Log full structured error for debugging
      console.error(
        `\nres-status: ${status}`,
        `\nres-data: ${JSON.stringify(data, null, 2)}`,
        '\n******** END ********\n',
      );

      // Optional alert for user
      const apiErrMsg =
        (err.response?.data as any)?.message ||
        (err.response?.data as any)?.error?.message ||
        'Something went wrong. Please try again.';

      // Alert.alert('🚫 Error', apiErrMsg);

      // if (err.response?.status === 401) {
      //   store.dispatch({
      //     type: 'LOGOUT',
      //   });
      //   showErrMsg(err.response?.data.message);
      // } else {
      //   const resErrors = err.response?.data.errors;
      //   if (Array.isArray(resErrors) && resErrors.length) {
      //     Alert.alert('🚫 Error', resErrors[0]);
      //   }
      // }
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;
