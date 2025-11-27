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
      FormData | UpdateProfileArg
    >({
      query: arg => {
        const isFormData = arg instanceof FormData;
        return {
          url: 'profile',
          method: 'patch',
          data: arg,
          headers: isFormData
            ? {
                'Content-Type': 'multipart/form-data',
              }
            : {
                'Content-Type': 'application/json',
              },
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled, getState }) {
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
          const currentUser = (getState() as any).user?.user;
          if (currentUser) {
            dispatch(setUser({ ...currentUser, ...updatedUser } as UserQueryRes));
          }
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
