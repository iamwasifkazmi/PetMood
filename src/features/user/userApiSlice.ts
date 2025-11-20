import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import { setUser } from '../user/userSlice';

export const userApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'userApi',
  tagTypes: ['User'],
  endpoints: build => ({
    getUserData: build.query<UserQueryRes, void>({
      query: () => ({
        url: '/me',
        method: 'get',
      }),
      providesTags: ['User'],
    }),

    updateUserProfile: build.mutation<
      { detail: string; updated: Partial<UserQueryRes> },
      UpdateProfileArg
    >({
      query: arg => ({
        url: 'profile',
        method: 'patch',
        data: arg,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          const updatedUser = data.updated;

          // ✅ Update cached user data
          dispatch(
            userApiSlice.util.updateQueryData(
              'getUserData',
              undefined,
              draft => {
                Object.assign(draft, updatedUser);
              },
            ),
          );

          // ✅ Update Redux `user` slice
          dispatch(setUser(prev => ({ ...prev, ...updatedUser } as any)));
        } catch (error) {
          console.log('Update user failed:', error);
        }
      },
      invalidatesTags: ['User'],
    }),
    deleteUserAccount: build.mutation<void, void>({
      query: () => ({
        url: 'account',
        method: 'delete',
      }),
    }),
  }),
});

export const {
  useGetUserDataQuery,
  useUpdateUserProfileMutation,
  useDeleteUserAccountMutation,
} = userApiSlice;
