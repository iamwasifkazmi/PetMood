import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';
import { DeletePetHistoryArg, CreateScanArg, CreateScanRes, ScanHistoryRes } from './types';

export const scanningApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'scanningApi',
  tagTypes: ['Scans'],
  endpoints: build => ({
    // 🔹 POST - Upload pet scan (image/audio/video)
    scanPet: build.mutation<CreateScanRes, CreateScanArg>({
      query: ({ petId, mediaType, file }) => {
        const rawUri = file.uri ?? file.path ?? file;
        let uri = typeof rawUri === 'string' ? rawUri : String(rawUri);
        // content:// and http(s) must stay as-is; absolute paths need file://
        if (
          uri &&
          !uri.startsWith('file://') &&
          !uri.startsWith('content://') &&
          !uri.startsWith('http://') &&
          !uri.startsWith('https://')
        ) {
          uri = `file://${uri}`;
        }

        const mimeByMedia: Record<CreateScanArg['mediaType'], string> = {
          audio: 'audio/m4a',
          video: 'video/mp4',
          image: 'image/jpeg',
        };

        const nameByMedia: Record<CreateScanArg['mediaType'], string> = {
          audio: 'pet_audio.m4a',
          video: 'pet_video.mp4',
          image: 'pet_image.jpg',
        };

        let mime = String(
          file.type || file.mime || mimeByMedia[mediaType],
        ).toLowerCase();
        // Strip codec params (e.g. video/mp4; codecs=...) — many servers reject them
        mime = mime.split(';')[0].trim();
        if (mediaType === 'video' && (!mime || mime === 'application/octet-stream')) {
          mime = 'video/mp4';
        }
        if (mediaType === 'audio' && (!mime || mime === 'application/octet-stream')) {
          mime = 'audio/m4a';
        }
        if (mediaType === 'image' && (!mime || mime === 'application/octet-stream')) {
          mime = 'image/jpeg';
        }

        let name = file.name ?? file.fileName ?? nameByMedia[mediaType];
        if (typeof name !== 'string' || !name.trim()) {
          name = nameByMedia[mediaType];
        }
        // Ensure extension matches media type (Android often omits filename)
        if (mediaType === 'video' && !/\.(mp4|mov|m4v|3gp|webm)$/i.test(name)) {
          name = `${name.replace(/\.[^.]+$/, '') || 'pet_video'}.mp4`;
        }
        if (mediaType === 'audio' && !/\.(m4a|mp3|wav|aac|caf)$/i.test(name)) {
          name = `${name.replace(/\.[^.]+$/, '') || 'pet_audio'}.m4a`;
        }
        if (mediaType === 'image' && !/\.(jpe?g|png|webp|heic)$/i.test(name)) {
          name = `${name.replace(/\.[^.]+$/, '') || 'pet_image'}.jpg`;
        }

        const formData = new FormData();
        formData.append('petId', String(petId));
        formData.append('mediaType', mediaType);
        formData.append('file', {
          uri,
          name,
          type: mime,
        } as any);

        return {
          url: 'scans',
          method: 'POST',
          data: formData,
          // Do NOT set Content-Type — RN/axios must add multipart boundary
          timeout: 180000,
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
