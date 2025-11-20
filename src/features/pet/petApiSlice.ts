import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';

export const petApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'petApi',
  tagTypes: ['Pets'],
  endpoints: build => ({
    createPet: build.mutation<createPetRes, FormData>({
      query: formData => {
        if ((formData as any)._parts) {
          (formData as any)._parts.forEach(([key, value]: any) => {
            console.log(key, value);
          });
        } else {
          console.log(formData);
        }

        return {
          url: 'pets',
          method: 'POST',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
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
    }),

    getAllProfiles: build.query<createPetRes[], void>({
      query: () => ({
        url: 'pets',
        method: 'GET',
      }),
    }),

    getPetHistory: build.query<PetHistoryRes, petHistoryArg>({
      query: ({ petId = '' } = {}) => ({
        url: `history`,
        method: 'GET',
        params: { petId },
      }),
    }),

    updatePetProfile: build.mutation<PetHistoryRes, updatePetProfileArg>({
      query: arg => ({
        url: `pets/${arg.id}`,
        method: 'PATCH',
        data: arg,
      }),
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
