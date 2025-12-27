import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface cummunitySliceState {
  token?: string;
}

export const cummunitySlice = createSlice({
  name: 'Community',
  initialState: {} as cummunitySliceState,
  reducers: {},
});

export const {} = cummunitySlice.actions;
