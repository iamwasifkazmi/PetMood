import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface supportSliceState {
  token?: string;
}

export const supportSlice = createSlice({
  name: 'support',
  initialState: {} as supportSliceState,
  reducers: {},
});

export const {} = supportSlice.actions;
