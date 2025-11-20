import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AppSliceState {
  isInitialStepsDone: boolean;
}

export const appSlice = createSlice({
  name: 'app',
  initialState: { isInitialStepsDone: false } as AppSliceState,
  reducers: {
    setIsInitialStepsDone: (
      state,
      action: PayloadAction<AppSliceState['isInitialStepsDone']>,
    ) => {
      state.isInitialStepsDone = action.payload;
    },
  },
});

export const {setIsInitialStepsDone} = appSlice.actions;
