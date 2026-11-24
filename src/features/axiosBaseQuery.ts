import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { showErrMsg } from '../utils/flashMessage';
import { getApiErrorMessage } from '../utils/validations';
import { getValidIdToken } from '../services/firebaseTokenService';
import { performLogout } from '../services/authSession';
import { isQuotaOrPaywallError } from '../utils/subscriptionQuotas';

/** RN Android release builds often break `instanceof FormData` across bundles. */
function isFormDataLike(data: unknown): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }
  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    return true;
  }
  if (Object.prototype.toString.call(data) === '[object FormData]') {
    return true;
  }
  // react-native FormData polyfill
  if (Array.isArray((data as { _parts?: unknown })._parts)) {
    return true;
  }
  return false;
}

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
      timeout?: number;
    },
    unknown,
    unknown
  > =>
  async ({ url, method, data, params, headers, _baseUrl, timeout }) => {
    const resolvedBase =
      typeof _baseUrl === 'string' ? _baseUrl : baseUrl;
    const absoluteUrl =
      typeof url === 'string' && /^https?:\/\//i.test(url)
        ? url
        : `${resolvedBase ?? ''}${url ?? ''}`;

    const skipAuthBearer =
      absoluteUrl.includes('identitytoolkit.googleapis.com') ||
      absoluteUrl.includes('securetoken.googleapis.com');

    const executeRequest = async (bearerToken: string | null | undefined) => {
      console.info(
        '******** API CALL ********',
        '\nreq-method: ' + method,
        '\nreq-url: ' + absoluteUrl,
        '\nreq-token: ' + (bearerToken ? '[present]' : '[none]'),
        '\nreq-data: ' + JSON.stringify(data),
        '\nreq-params: ' + JSON.stringify(params),
      );

      const isMultipart = isFormDataLike(data);
      const requestHeaders: AxiosRequestConfig['headers'] = {
        ...(bearerToken &&
          !skipAuthBearer && {
            Authorization: `Bearer ${bearerToken}`,
          }),
        ...headers,
      };
      // Critical on Android: never send a bare/wrong Content-Type for FormData.
      // Axios often injects application/x-www-form-urlencoded, which RN rejects
      // with: multipart != application/x-www-form-urlencoded.
      // Leave Content-Type unset so RN NetworkingModule sets multipart + boundary.
      if (isMultipart && requestHeaders) {
        delete (requestHeaders as Record<string, unknown>)['Content-Type'];
        delete (requestHeaders as Record<string, unknown>)['content-type'];
      }

      const stripMultipartContentType = (
        d: unknown,
        reqHeaders: AxiosRequestConfig['headers'],
      ) => {
        if (!isFormDataLike(d) || !reqHeaders) {
          return d;
        }
        const h = reqHeaders as {
          delete?: (key: string) => void;
          set?: (key: string, value: unknown) => void;
          [key: string]: unknown;
        };
        if (typeof h.delete === 'function') {
          h.delete('Content-Type');
          h.delete('content-type');
        } else {
          delete h['Content-Type'];
          delete h['content-type'];
        }
        // AxiosHeaders: also clear via set(undefined) when available
        if (typeof h.set === 'function') {
          h.set('Content-Type', undefined);
        }
        return d;
      };

      return axios({
        url: url,
        baseURL: typeof _baseUrl === 'string' ? _baseUrl : baseUrl,
        method,
        data,
        params,
        timeout: timeout ?? (isMultipart ? 180000 : undefined),
        headers: requestHeaders,
        // Pass FormData through unchanged, and strip Content-Type inside
        // transformRequest (axios re-applies defaults after our header deletes).
        ...(isMultipart
          ? {
              transformRequest: [
                (d: unknown, h: AxiosRequestConfig['headers']) =>
                  stripMultipartContentType(d, h),
              ],
            }
          : {}),
      });
    };

    const isAuthFailure = (status: unknown, responseData: unknown) => {
      if (status === 401) {
        return true;
      }
      if (status !== 403) {
        return false;
      }
      // Quota / paywall limits are not auth failures
      if (isQuotaOrPaywallError(status, responseData)) {
        return false;
      }
      const detail =
        typeof responseData === 'object' && responseData !== null
          ? String(
              (responseData as { detail?: string }).detail || '',
            ).toLowerCase()
          : '';
      return (
        detail.includes('token') ||
        detail.includes('unauthorized') ||
        detail.includes('authentication') ||
        (detail.includes('expired') && detail.includes('token'))
      );
    };

    const isAiConsentRequired = (status: unknown, responseData: unknown) =>
      status === 403 &&
      typeof responseData === 'object' &&
      responseData !== null &&
      ('requiredProvider' in (responseData as object) ||
        String((responseData as { detail?: string }).detail || '')
          .toLowerCase()
          .includes('consent required'));

    try {
      let token = skipAuthBearer ? null : await getValidIdToken();
      let result = await executeRequest(token);

      console.log(
        '\nres-status: ' + result.status,
        '\nres-data: ' + JSON.stringify(result.data),
        '\n******** END ********\n',
      );

      return { data: result.data };
    } catch (axiosError) {
      let err = axiosError as AxiosError;
      let status: number | string = err.response?.status ?? 'No status';
      let responseData: unknown = err.response?.data ?? {};

      const consentBlock = isAiConsentRequired(status, responseData);

      // Expired ID token: force refresh once and retry the same request
      if (
        !skipAuthBearer &&
        isAuthFailure(status, responseData) &&
        !consentBlock
      ) {
        const freshToken = await getValidIdToken(true);
        if (freshToken) {
          try {
            const retryResult = await executeRequest(freshToken);
            console.log(
              '\nres-status (after token refresh): ' + retryResult.status,
              '\nres-data: ' + JSON.stringify(retryResult.data),
              '\n******** END ********\n',
            );
            return { data: retryResult.data };
          } catch (retryErr) {
            const retryAxios = retryErr as AxiosError;
            const retryStatus = retryAxios.response?.status;
            const retryData = retryAxios.response?.data;
            if (isAuthFailure(retryStatus, retryData)) {
              performLogout();
              return {
                error: {
                  status: retryStatus,
                  data: retryData || retryAxios.message,
                },
              };
            }
            err = retryAxios;
            status = retryStatus ?? 'No status';
            responseData = retryData ?? {};
          }
        } else {
          performLogout();
          return {
            error: {
              status: err.response?.status,
              data: err.response?.data || err.message,
            },
          };
        }
      }

      const isTrialScanLimit =
        (status === 429 || status === 403) &&
        typeof responseData === 'object' &&
        responseData !== null &&
        (String((responseData as { code?: string }).code || '') ===
          'daily_scan_limit_reached' ||
          typeof (responseData as { resetsAt?: string }).resetsAt === 'string');

      const isNoPetDetected =
        status === 422 &&
        typeof responseData === 'object' &&
        responseData !== null;

      const isQuotaPaywall = isQuotaOrPaywallError(status, responseData);

      // Screens that render field-level errors — avoid duplicate top flash toast
      const urlLower = String(absoluteUrl || '').toLowerCase();
      const isFieldHandledAuthError =
        urlLower.includes('identitytoolkit.googleapis.com') ||
        urlLower.includes('auth/register') ||
        urlLower.includes('auth/forgot-password') ||
        urlLower.includes('auth/verify-otp') ||
        urlLower.includes('auth/verify-reset-otp') ||
        urlLower.includes('auth/resend-otp') ||
        urlLower.includes('auth/resend-reset-otp') ||
        urlLower.includes('auth/reset-password') ||
        urlLower.includes('auth/change-password') ||
        /\/profile\/?(\?|$)/.test(urlLower);

      if (!consentBlock) {
        if (
          !isTrialScanLimit &&
          !isNoPetDetected &&
          !isQuotaPaywall &&
          !isFieldHandledAuthError
        ) {
          const toastMessage = getApiErrorMessage(
            {
              status,
              data: responseData || err.message,
            },
            'Something went wrong. Please check your connection and try again.',
          );
          showErrMsg(toastMessage);
        }
      }

      // Do NOT logout on subscription/profile quota 403s — those are paywall limits.
      // Only logout on unexpected non-consent, non-quota 403s that aren't auth failures.
      if (
        status === 403 &&
        !consentBlock &&
        !isQuotaPaywall &&
        !isAuthFailure(status, responseData)
      ) {
        performLogout();
      }

      console.error(
        `\nres-status: ${status}`,
        `\nres-data: ${JSON.stringify(responseData, null, 2)}`,
        '\n******** END ********\n',
      );

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export default axiosBaseQuery;
