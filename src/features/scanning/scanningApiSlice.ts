import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import { DeletePetHistoryArg, ScanHistoryRes } from './types';

export const scanningApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'scanningApi',
  tagTypes: ['Scans'],
  endpoints: build => ({
    // 🔹 POST - Upload pet scan (image/audio/video)
    scanPet: build.mutation<CreateScanRes, CreateScanArg>({
      query: ({ petId, mediaType, file }) => {
        const formData = new FormData();
        formData.append('petId', String(petId));
        formData.append('mediaType', mediaType);
        formData.append('file', {
          uri: file.uri ?? file.path ?? file,
          name: file.fileName ?? 'upload.jpg',
          type: file.mime ?? 'image/jpeg',
        });

        return {
          url: 'scans',
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
      invalidatesTags: ['Scans'],
    }),

    getScanHistory: build.query<ScanHistoryRes[], { petId?: string } | void>({
      query: params => {
        let url = 'history';
        if (params?.petId) {
          url += `?petId=${params.petId}`;
        }
        return {
          url,
          method: 'GET',
        };
      },
      providesTags: ['Scans'],
    }),

    deletePetHistory: build.mutation<any, DeletePetHistoryArg>({
      query: arg => ({
        url: `history/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Scans'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          scanningApiSlice.util.updateQueryData(
            'getScanHistory',
            undefined,
            draft => {
              const index = draft.findIndex(item => item.id === arg.id);
              if (index !== -1) draft.splice(index, 1);
            },
          ),
        );

        try {
          await queryFulfilled; // wait for server confirmation
        } catch {
          patchResult.undo(); // rollback if delete fails
        }
      },
    }),
  }),
});

export const {
  useScanPetMutation,
  useGetScanHistoryQuery,
  useDeletePetHistoryMutation,
} = scanningApiSlice;
