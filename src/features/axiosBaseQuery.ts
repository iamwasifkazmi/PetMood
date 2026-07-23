import type { BaseQueryFn } from '@reduxjs/toolkit/query';
import type { AxiosError, AxiosRequestConfig } from 'axios';
import axios from 'axios';
import { showErrMsg } from '../utils/flashMessage';
import { getValidIdToken } from '../services/firebaseTokenService';
import { performLogout } from '../services/authSession';
import { isQuotaOrPaywallError } from '../utils/subscriptionQuotas';

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

      return axios({
        url: url,
        baseURL: typeof _baseUrl === 'string' ? _baseUrl : baseUrl,
        method,
        data,
        params,
        headers: {
          ...(bearerToken &&
            !skipAuthBearer && {
              Authorization: `Bearer ${bearerToken}`,
            }),
          ...headers,
        },
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
      let detail =
        (err.response?.data as { detail?: string })?.detail ||
        (err.response?.data as { error?: { message?: string } })?.error
          ?.message ||
        err.message;

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
            detail =
              (retryData as { detail?: string })?.detail ||
              retryAxios.message;
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
        status === 429 &&
        typeof responseData === 'object' &&
        responseData !== null &&
        typeof (responseData as { resetsAt?: string }).resetsAt === 'string';

      const isNoPetDetected =
        status === 422 &&
        typeof responseData === 'object' &&
        responseData !== null;

      const isQuotaPaywall = isQuotaOrPaywallError(status, responseData);

      if (!consentBlock) {
        if (isTrialScanLimit) {
          const d = responseData as {
            detail?: string;
            resetsAt: string;
            used?: number;
            limit?: number;
          };
          const t = new Date(d.resetsAt);
          const resetLabel = Number.isNaN(t.getTime())
            ? d.resetsAt
            : t.toLocaleString();
          const head =
            d.detail ||
            'Daily scan limit reached. Please try again later.';
          const usage =
            d.limit != null && d.used != null
              ? ` Uses this UTC day: ${d.used}/${d.limit}.`
              : '';
          showErrMsg(
            `${head}${usage} Resets at ${resetLabel} (server midnight UTC).`,
          );
        } else if (!isNoPetDetected && !isQuotaPaywall) {
          // Quota/paywall 403s: screens show Alert + Subscribe CTA (avoid double toast)
          showErrMsg(detail);
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
