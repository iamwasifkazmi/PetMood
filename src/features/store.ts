import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Action,
  combineSlices,
  configureStore,
  ThunkAction,
} from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { useDispatch, useSelector } from 'react-redux';
import { persistReducer, persistStore } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import { tabBarSlice } from './tabBar/tabBarSlice';
import { authApiSlice } from './auth/authApiSlice';
import { authSlice } from './auth/authSlice';
import { petApiSlice } from './pet/petApiSlice';
import { petSlice } from './pet/petSlice';
import { supportApiSlice } from './support/supportApiSlice';
import { supportSlice } from './support/supportSlice';
import { cummunityApiSlice } from './cummunity/cummunityApiSlice';
import { cummunitySlice } from './cummunity/cummunitySlice';
import { scannPetSlice } from './scanning/scanningSlice';
import { scanningApiSlice } from './scanning/scanningApiSlice';
import { userApiSlice } from './user/userApiSlice';
import { userSlice } from './user/userSlice';

const rootReducer = combineSlices(
  tabBarSlice,
  authApiSlice,
  authSlice,
  petApiSlice,
  petSlice,
  supportApiSlice,
  supportSlice,
  cummunityApiSlice,
  cummunitySlice,
  scannPetSlice,
  scanningApiSlice,
  userApiSlice,
  userSlice,
);

// Infer the `RootState` type from the root reducer
export type RootState = ReturnType<typeof rootReducer>;

const persistedReducer = persistReducer(
  {
    key: 'root',
    storage: AsyncStorage,
    stateReconciler: autoMergeLevel2,
  },
  (state, action) => {
    if (action.type === 'LOGOUT') {
      state = {
        app: state.app,
      };
    }
    if (action.type === 'CLEAR_STORE') {
      state = undefined;
    }
    return rootReducer(state, action);
  },
);

export const store = configureStore({
  reducer: persistedReducer as unknown as typeof rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      immutableCheck: false,
      serializableCheck: false,
      actionCreatorCheck: false,
    }).concat(
      authApiSlice.middleware,
      petApiSlice.middleware,
      supportApiSlice.middleware,
      cummunityApiSlice.middleware,
      scanningApiSlice.middleware,
      userApiSlice.middleware,
    ),
});

// required for `refetchOnFocus`/`refetchOnReconnect` behaviors
setupListeners(store.dispatch);

export const persistor = persistStore(store);

// Infer the type of `store`
export type AppStore = typeof store;
// Infer the `AppDispatch` type from the store itself
export type AppDispatch = AppStore['dispatch'];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
