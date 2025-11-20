import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PetSliceType {}

export const petSlice = createSlice({
  name: 'pet',
  initialState: {} as PetSliceType,
  reducers: {
    // setToken: (state, action: PayloadAction<PetSliceType['token']>) => {
    //   state.token = action.payload;
    // },
  },
});

export const {} = petSlice.actions;
