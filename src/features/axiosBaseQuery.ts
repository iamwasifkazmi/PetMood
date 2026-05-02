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
      const resolvedBase =
        typeof _baseUrl === 'string' ? _baseUrl : baseUrl;
      const absoluteUrl =
        typeof url === 'string' && /^https?:\/\//i.test(url)
          ? url
          : `${resolvedBase ?? ''}${url ?? ''}`;
      /** Firebase Identity Toolkit must not receive a stale app JWT (breaks sign-in). */
      const skipAuthBearer =
        absoluteUrl.includes('identitytoolkit.googleapis.com') ||
        absoluteUrl.includes('securetoken.googleapis.com');
      console.info(
        '******** API CALL ********',
        '\nreq-method: ' + method,
        '\nreq-url: ' + absoluteUrl,
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
          ...(token &&
            !skipAuthBearer && {
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

      const isAiConsentRequired =
        status === 403 &&
        (typeof data === 'object' &&
          data !== null &&
          ('requiredProvider' in (data as any) ||
            String((data as any)?.detail || detail)
              .toLowerCase()
              .includes('consent required')));

      const isTrialScanLimit =
        status === 429 &&
        typeof data === 'object' &&
        data !== null &&
        typeof (data as any).resetsAt === 'string';

      // Show error message in UI unless it's the consent-enforcement 403 (handled by the scanner UI)
      if (!isAiConsentRequired) {
        if (isTrialScanLimit) {
          const d = data as {
            detail?: string;
            resetsAt: string;
            used?: number;
            limit?: number;
            remaining?: number;
          };
          const t = new Date(d.resetsAt);
          const resetLabel = Number.isNaN(t.getTime())
            ? d.resetsAt
            : t.toLocaleString();
          const head =
            d.detail || 'You have hit the limit for this period. Please try again later.';
          const usage =
            d.limit != null && d.used != null
              ? ` Uses this UTC day: ${d.used}/${d.limit}.`
              : '';
          showErrMsg(
            `${head}${usage} You can try again after ${resetLabel} (server uses midnight UTC for the daily count).`,
          );
        } else {
          showErrMsg(detail);
        }
      }

      // Only force logout on auth-related 403s (not on consent-enforcement)
      if (status === 403 && !isAiConsentRequired) {
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
