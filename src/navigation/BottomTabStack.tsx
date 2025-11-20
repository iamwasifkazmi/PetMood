import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import Community from '../screens/private/community';
import History from '../screens/private/history';
import Home from '../screens/private/Home';
import Profile from '../screens/private/profile';
import Scanner from '../screens/private/scanner';
import BottomTabBar from './BottomTabBar';
import { RouteName, StackParamList } from './types';

const Tab = createBottomTabNavigator<StackParamList>();

const BottomTabStack = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name={RouteName.Home} component={Home} />
      <Tab.Screen name={RouteName.Profile} component={Profile} />
      <Tab.Screen name={RouteName.Scanner} component={Scanner} />
      <Tab.Screen name={RouteName.History} component={History} />

      <Tab.Screen name={RouteName.Community} component={Community} />
    </Tab.Navigator>
  );
};

export default BottomTabStack;
