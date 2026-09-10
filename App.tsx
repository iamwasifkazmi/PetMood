import React from 'react';
import { ActivityIndicator, LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { NavigationContainer } from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import { persistor, store } from './src/features/store';
import { useTheme } from './src/hooks/useTheme';
import { AuthSessionBootstrap } from './src/components/auth/AuthSessionBootstrap';
import RootNavigator from './src/navigation';
import { navigationRef } from './services/navigationService';

LogBox.ignoreAllLogs();

const FlashMessageHost = () => {
  const insets = useSafeAreaInsets();
  return <FlashMessage position="top" statusBarHeight={insets.top} />;
};

const App = () => {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate
            persistor={persistor}
            loading={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.background,
                }}
              >
                <ActivityIndicator size="large" />
              </View>
            }
          >
            <AuthSessionBootstrap>
              <BottomSheetModalProvider>
                <NavigationContainer theme={theme} ref={navigationRef}>
                  <RootNavigator />
                  <FlashMessageHost />
                </NavigationContainer>
              </BottomSheetModalProvider>
            </AuthSessionBootstrap>
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
