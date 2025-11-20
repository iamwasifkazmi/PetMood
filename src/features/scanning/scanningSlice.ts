import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface scannPetSliceType {}

export const scannPetSlice = createSlice({
  name: 'scan',
  initialState: {} as scannPetSliceType,
  reducers: {
    // setToken: (state, action: PayloadAction<PetSliceType['token']>) => {
    //   state.token = action.payload;
    // },
  },
});

export const {} = scannPetSlice.actions;
