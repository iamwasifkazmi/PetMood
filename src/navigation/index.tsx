// navigation/index.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { RouteName, StackParamList } from './types';
import useIsSignedIn from '../hooks/useIsSignedIn';

// Public Screens
import Splash from '../screens/public/onboarding/Splash';
import Onboarding from '../screens/public/onboarding';
import CreateAccount from '../screens/public/createAccount';
import Login from '../screens/public/login';
import CodeVerification from '../screens/public/verification';
import ResetPassword from '../screens/public/resetPassword';
import CreateNewPassword from '../screens/public/createNewPassword';

// Private Navigation
import DrawerNavigator from './DrawerNavigator';

export const Stack = createNativeStackNavigator<StackParamList>();

const RootNavigator = () => {
  const { isSignedIn } = useIsSignedIn();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        // 🔐 Private Stack - Only accessible when signed in
        <Stack.Screen
          name={RouteName.DrawerTabStack}
          component={DrawerNavigator}
        />
      ) : (
        // 🚪 Public Stack
        <>
          <Stack.Screen name={RouteName.Splash} component={Splash} />
          <Stack.Screen name={RouteName.Onboarding} component={Onboarding} />
          <Stack.Screen name={RouteName.Login} component={Login} />
          <Stack.Screen
            name={RouteName.CreateAccount}
            component={CreateAccount}
          />
          <Stack.Screen
            name={RouteName.CodeVerification}
            component={CodeVerification}
          />
          <Stack.Screen
            name={RouteName.ResetPassword}
            component={ResetPassword}
          />
          <Stack.Screen
            name={RouteName.CreateNewPassword}
            component={CreateNewPassword}
          />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
