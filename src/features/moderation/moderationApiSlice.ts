import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';

export interface ModerationReport {
  id: string;
  status: string;
  reason?: string;
  targetType?: 'post' | 'comment' | 'user';
  targetId?: string;
  createdAt?: string;
}

export interface GetModerationReportsRes {
  reports: ModerationReport[];
}

export interface ModerationActionArg {
  reportId: string;
  action:
    | 'mark_reviewed'
    | 'dismiss'
    | 'remove_content'
    | 'suspend_user'
    | 'remove_content_and_suspend_user';
  adminNote?: string;
  suspendReason?: string;
}

export const moderationApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'moderationApi',
  tagTypes: ['ModerationReports'],
  endpoints: build => ({
    getModerationReports: build.query<GetModerationReportsRes, { status?: string; limit?: number }>({
      query: ({ status = 'new', limit = 50 } = {}) => ({
        url: `admin/moderation/reports?status=${status}&limit=${limit}`,
        method: 'get',
      }),
      providesTags: ['ModerationReports'],
    }),
    takeModerationAction: build.mutation<any, ModerationActionArg>({
      query: ({ reportId, ...data }) => ({
        url: `admin/moderation/reports/${reportId}/action`,
        method: 'post',
        data,
      }),
      invalidatesTags: ['ModerationReports'],
    }),
  }),
});

export const { useGetModerationReportsQuery, useTakeModerationActionMutation } =
  moderationApiSlice;

