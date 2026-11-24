import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';

export const petApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'petApi',
  tagTypes: ['Pets'],
  endpoints: build => ({
    createPet: build.mutation<createPetRes, FormData | CreatePetArg>({
      query: arg => {
        const looksLikeFormData =
          typeof FormData !== 'undefined' &&
          (arg instanceof FormData ||
            Object.prototype.toString.call(arg) === '[object FormData]' ||
            Array.isArray((arg as any)._parts));

        return {
          url: 'pets',
          method: 'POST',
          data: arg,
          // Text-only: JSON. Photo: FormData — do NOT set multipart Content-Type
          // (RN must add the boundary; axios urlencoded default breaks Android).
          headers: looksLikeFormData
            ? undefined
            : { 'Content-Type': 'application/json' },
        };
      },

      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: newPet } = await queryFulfilled;
          dispatch(
            petApiSlice.util.updateQueryData(
              'getAllProfiles',
              undefined,
              draft => {
                draft.push(newPet);
              },
            ),
          );
        } catch (err) {
          console.error('Failed to update pet list:', err);
        }
      },
      invalidatesTags: ['Pets'],
    }),

    getAllProfiles: build.query<createPetRes[], getAllProfilesArg | void>({
      query: (params) => {
        const queryParams: Record<string, string> = {};
        
        if (params?.search) {
          queryParams.search = params.search;
        }
        
        return {
          url: 'pets',
          method: 'GET',
          params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        };
      },
      providesTags: ['Pets'],
    }),

    getPetHistory: build.query<PetHistoryRes, petHistoryArg>({
      query: ({ petId = '', search = '', startDate, endDate } = {}) => {
        const params: Record<string, string> = {};

        if (petId) {
          params.petId = petId;
        }
        if (search) {
          params.search = search;
        }
        if (startDate) {
          params.startDate = startDate;
        }
        if (endDate) {
          params.endDate = endDate;
        }

        return {
          url: `history`,
          method: 'GET',
          params,
        };
      },
    }),

    updatePetProfile: build.mutation<PetHistoryRes, { id: string; formData: FormData } | updatePetProfileArg>({
      query: arg => {
        // Check if it's FormData format { id, formData }
        if (
          'formData' in arg &&
          arg.formData &&
          (arg.formData instanceof FormData ||
            Array.isArray((arg.formData as any)._parts))
        ) {
          return {
            url: `pets/${arg.id}`,
            method: 'PATCH',
            data: arg.formData,
            // Do NOT set Content-Type — RN/axios must add multipart boundary
          };
        }
        
        // Otherwise it's the regular updatePetProfileArg object (JSON)
        const { id, ...body } = arg as updatePetProfileArg;
        return {
          url: `pets/${id}`,
          method: 'PATCH',
          data: body,
          headers: { 'Content-Type': 'application/json' },
        };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data: updatedPet } = await queryFulfilled;
          dispatch(
            petApiSlice.util.updateQueryData(
              'getAllProfiles',
              undefined,
              draft => {
                const index = draft.findIndex(pet => pet.id === arg.id);
                if (index !== -1) {
                  draft[index] = { ...draft[index], ...updatedPet };
                }
              },
            ),
          );
        } catch (err) {
          console.error('Failed to update cached pet profile:', err);
        }
      },
      invalidatesTags: ['Pets'],
    }),

    deletePetProfile: build.mutation<
      { success: boolean },
      { id: string | number }
    >({
      query: ({ id }) => ({
        url: `pets/${id}`,
        method: 'DELETE',
      }),
      async onQueryStarted({ id }, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            petApiSlice.util.updateQueryData(
              'getAllProfiles',
              undefined,
              draft => {
                return draft.filter(pet => pet.id !== id);
              },
            ),
          );
        } catch (err) {
          console.error('Failed to delete pet from cache:', err);
        }
      },
      invalidatesTags: ['Pets'],
    }),
  }),
});

export const {
  useCreatePetMutation,
  useGetAllProfilesQuery,
  useGetPetHistoryQuery,
  useUpdatePetProfileMutation,
  useDeletePetProfileMutation,
} = petApiSlice;
