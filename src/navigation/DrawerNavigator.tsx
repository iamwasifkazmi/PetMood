// navigation/DrawerNavigator.tsx
import { createDrawerNavigator } from '@react-navigation/drawer';
import {
  CommonActions,
  DrawerActions,
  useNavigation,
} from '@react-navigation/native';
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

// Screens
import { store } from '../features/store';
import { useDeleteUserAccountMutation } from '../features/user/userApiSlice';
import { clearUser } from '../features/user/userSlice';
import PrivacyPolicy from '../screens/private/privacyPolicy';
import Settings from '../screens/private/settings';
import Support from '../screens/private/support';
import BottomTabStack from './BottomTabStack';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const navigation = useNavigation();
  const { user } = store.getState().user;
  const [deleteUserAccount] = useDeleteUserAccountMutation();
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
              store.dispatch({
                type: 'LOGOUT',
              });
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'Splash' }],
                }),
              );
              navigation.dispatch(DrawerActions.closeDrawer());
              store.dispatch(clearUser());
            } catch (error) {
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
          store.dispatch({
            type: 'LOGOUT',
          });
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Splash' }],
            }),
          );
          navigation.dispatch(DrawerActions.closeDrawer());
          store.dispatch(clearUser());
        },
      },
    ]);
  };

  return (
    <View {...props} contentContainerStyle={{ flex: 1 }}>
      {/* Profile Header */}
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://randomuser.me/api/portraits/men/41.jpg' }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.userName}>{user?.name}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>
      </View>

      {/* Drawer Items */}
      <View style={styles.menuItems}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            props.navigation.navigate('MainApp', {
              screen: 'Home', // <-- Replace with your actual tab name
            });
            props.navigation.dispatch(DrawerActions.closeDrawer());
          }}
        >
          <Icon name="home-outline" size={22} color="#999" />
          <Text style={styles.menuText}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            props.navigation.navigate('Settings');
            props.navigation.dispatch(DrawerActions.closeDrawer());
          }}
        >
          <Icon name="cog-outline" size={22} color="#999" />
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            props.navigation.navigate('Support');
            props.navigation.dispatch(DrawerActions.closeDrawer());
          }}
        >
          <Icon name="face-agent" size={22} color="#999" />
          <Text style={styles.menuText}>Support</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => {
            props.navigation.navigate('PrivacyPolicy');
            props.navigation.dispatch(DrawerActions.closeDrawer());
          }}
        >
          <Icon name="file-lock-outline" size={22} color="#999" />
          <Text style={styles.menuText}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
          <Icon name="delete-outline" size={22} color="red" />
          <Text style={[styles.menuText, { color: 'red', fontWeight: 'bold' }]}>
            Delete Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Icon name="logout" size={22} color="#999" />
          <Text style={styles.menuText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DrawerNavigator = () => {
  return (
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

      {/* Drawer-only screens */}
      <Drawer.Screen
        name="Settings"
        component={Settings}
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
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
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#116466',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 80,
  },
  profileImage: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    marginRight: 12,
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2,
  },
  menuItems: {
    marginTop: 20,
    paddingHorizontal: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 15,
    color: '#999',
  },
});

export default DrawerNavigator;
