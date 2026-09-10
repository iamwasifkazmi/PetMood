// navigation/DrawerNavigator.tsx
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import React from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../features/store';
import { SubscriptionEntitlementSync } from '../features/subscription/SubscriptionEntitlementSync';
import { useDeleteUserAccountMutation } from '../features/user/userApiSlice';
import { performLogout } from '../services/authSession';
import PrivacyPolicy from '../screens/private/privacyPolicy';
import PrivacyAiConsentScreen from '../screens/private/privacyAiConsent';
import Settings from '../screens/private/settings';
import Support from '../screens/private/support';
import Subscription from '../screens/private/subscription';
import BottomTabStack from './BottomTabStack';
import { useTheme } from '../hooks/useTheme';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { user } = useSelector((state: RootState) => state.user);
  const [deleteUserAccount] = useDeleteUserAccountMutation();
  const activeRoute = props.state?.routes?.[props.state.index]?.name;

  const isActive = (name: string) => activeRoute === name;

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUserAccount().unwrap();
              navigation.dispatch(DrawerActions.closeDrawer());
              performLogout();
            } catch {
              Alert.alert(
                'Error',
                'Failed to delete account. Please try again later.',
              );
            }
          },
        },
      ],
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          navigation.dispatch(DrawerActions.closeDrawer());
          performLogout();
        },
      },
    ]);
  };

  const go = (routeName: string, params?: object) => {
    props.navigation.navigate(routeName, params);
    props.navigation.dispatch(DrawerActions.closeDrawer());
  };

  const MenuRow = ({
    label,
    icon,
    routeName,
    onPress,
    danger,
  }: {
    label: string;
    icon: string;
    routeName?: string;
    onPress?: () => void;
    danger?: boolean;
  }) => {
    const active = routeName ? isActive(routeName) : false;
    return (
      <TouchableOpacity
        style={[
          styles.menuItem,
          active && {
            backgroundColor: colors.primary + '18',
            borderRadius: 10,
          },
        ]}
        onPress={onPress}
      >
        <Icon
          name={icon}
          size={22}
          color={danger ? 'red' : active ? colors.primary : '#999'}
        />
        <Text
          style={[
            styles.menuText,
            active && { color: colors.primary, fontWeight: '700' },
            danger && { color: 'red', fontWeight: 'bold' },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      <View style={styles.header}>
        <Image
          source={
            user?.photoUrl
              ? { uri: user.photoUrl }
              : require('../assets/images/gallery_rounded.png')
          }
          style={styles.profileImage}
          defaultSource={require('../assets/images/gallery_rounded.png')}
        />
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email?.toLowerCase()}</Text>
        </View>
      </View>

      <View style={styles.menuItems}>
        <MenuRow
          label="Home"
          icon="home-outline"
          routeName="MainApp"
          onPress={() =>
            go('MainApp', {
              screen: 'Home',
            })
          }
        />
        <MenuRow
          label="Settings"
          icon="cog-outline"
          routeName="Settings"
          onPress={() => go('Settings')}
        />
        <MenuRow
          label="AI consent"
          icon="lock-outline"
          routeName="AiConsent"
          onPress={() => go('AiConsent')}
        />
        <MenuRow
          label="Subscription"
          icon="crown-outline"
          routeName="Subscription"
          onPress={() => go('Subscription')}
        />
        <MenuRow
          label="Support"
          icon="face-agent"
          routeName="Support"
          onPress={() => go('Support')}
        />
        <MenuRow
          label="Privacy Policy"
          icon="file-lock-outline"
          routeName="PrivacyPolicy"
          onPress={() => go('PrivacyPolicy')}
        />
        <MenuRow
          label="Delete Account"
          icon="delete-outline"
          danger
          onPress={handleDeleteAccount}
        />
        <MenuRow label="Logout" icon="logout" onPress={handleLogout} />
      </View>
    </DrawerContentScrollView>
  );
};

const DrawerNavigator = () => {
  return (
    <>
      <SubscriptionEntitlementSync />
      <Drawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerPosition: 'left',
          drawerType: 'front',
          swipeEnabled: true,
        }}
        drawerContent={props => <CustomDrawerContent {...props} />}
      >
        <Drawer.Screen
          name="MainApp"
          component={BottomTabStack}
          options={{
            drawerLabel: 'Home',
            title: 'Home',
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={Settings}
          options={{
            drawerLabel: 'Settings',
            title: 'Settings',
          }}
        />
        <Drawer.Screen
          name="AiConsent"
          component={PrivacyAiConsentScreen}
          options={{
            drawerLabel: 'AI consent',
            title: 'AI analysis consent',
          }}
        />
        <Drawer.Screen
          name="Subscription"
          component={Subscription}
          options={{
            drawerLabel: 'Subscription',
            title: 'Subscription',
          }}
        />
        <Drawer.Screen
          name="Support"
          component={Support}
          options={{
            drawerLabel: 'Support',
            title: 'Support',
          }}
        />
        <Drawer.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicy}
          options={{
            drawerLabel: 'Privacy Policy',
            title: 'Privacy Policy',
          }}
        />
      </Drawer.Navigator>
    </>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 12,
  },
  profileImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  userEmail: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  menuItems: {
    padding: 12,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    gap: 14,
  },
  menuText: {
    fontSize: 15,
    color: '#333',
  },
});
