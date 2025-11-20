// App.tsx
import React from 'react';
import { LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import FlashMessage from 'react-native-flash-message';

import { store } from './src/features/store';
import { useTheme } from './src/hooks/useTheme';
import RootNavigator from './src/navigation'; // This should be your main navigator with auth logic
import { navigationRef } from './services/navigationService';

LogBox.ignoreAllLogs();

const App = () => {
  const theme = useTheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <NavigationContainer theme={theme} ref={navigationRef}>
            {/* Render RootNavigator instead of DrawerNavigator directly */}
            <RootNavigator />
            <FlashMessage position="top" />
          </NavigationContainer>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
