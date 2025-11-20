import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UserSliceState {
  user: UserQueryRes | null;
}

const initialState: UserSliceState = {
  user: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserQueryRes | null>) => {
      state.user = action.payload;
    },
    clearUser: state => {
      state.user = null;
    },
  },
});

export const { setUser, clearUser } = userSlice.actions;

export default userSlice.reducer;
