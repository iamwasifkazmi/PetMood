import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface cummunitySliceState {
  token?: string;
}

export const cummunitySlice = createSlice({
  name: 'cummunity',
  initialState: {} as cummunitySliceState,
  reducers: {},
});

export const {} = cummunitySlice.actions;
