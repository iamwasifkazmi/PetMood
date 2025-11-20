import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import {
  ChangePasswordArg,
  ForgotPasswordArg,
  loginArg,
  loginRes,
  RegisterUserArg,
  RegisterUserRes,
  ResendOtpArg,
  ResendOtpRes,
  ResetPasswordArg,
  SendOtpArg,
  SendOtpRes,
  VerifyOtpArg,
  VerifyOtpRes,
} from './types';

export const authApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'authApi',
  endpoints: build => ({
    login: build.mutation<loginRes, loginArg>({
      query: arg => ({
        url: `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyCyjwF43r2-cVFSGeZ_WWxjskTa3QgeyPY`,
        data: arg,
        method: 'post',
      }),
    }),
    sendOtp: build.mutation<SendOtpRes, SendOtpArg>({
      query: arg => ({
        url: 'auth/send-otp',
        data: arg,
        method: 'post',
      }),
    }),
    resendOtp: build.mutation<ResendOtpRes, ResendOtpArg>({
      query: arg => ({
        url: 'auth/resend-otp',
        data: arg,
        method: 'post',
      }),
    }),
    registerUser: build.mutation<RegisterUserRes, RegisterUserArg>({
      query: arg => ({
        url: 'auth/register',
        data: arg,
        method: 'post',
      }),
    }),
    verifyOtp: build.mutation<VerifyOtpRes, VerifyOtpArg>({
      query: arg => ({
        url: 'auth/verify-otp-and-register',
        data: arg,
        method: 'post',
      }),
    }),
    changePassword: build.mutation<any, ChangePasswordArg>({
      query: arg => ({
        url: 'auth/change-password',
        data: arg,
        method: 'post',
      }),
    }),
    forgotPassword: build.mutation<any, ForgotPasswordArg>({
      query: arg => ({
        url: 'auth/forgot-password',
        data: arg,
        method: 'post',
      }),
    }),
    verifyForgotPasswordOtp: build.mutation<VerifyOtpRes, VerifyOtpArg>({
      query: arg => ({
        url: 'auth/verify-reset-otp',
        data: arg,
        method: 'post',
      }),
    }),
    resendForgotPasswordOtp: build.mutation<ResendOtpRes, ResendOtpArg>({
      query: arg => ({
        url: 'auth/resend-reset-otp',
        data: arg,
        method: 'post',
      }),
    }),
    resetPassword: build.mutation<any, ResetPasswordArg>({
      query: arg => ({
        url: 'auth/reset-password',
        data: arg,
        method: 'post',
      }),
    }),
  }),
});

export const {
  useResendOtpMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useRegisterUserMutation,
  useLoginMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useVerifyForgotPasswordOtpMutation,
  useResendForgotPasswordOtpMutation,
  useResetPasswordMutation,
} = authApiSlice;
