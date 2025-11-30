import { Image, Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import images from '../../assets/images';
import AppText from '../Text/AppText';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';

const Header = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();

  const handleMenu = () => {
    // Only open drawer - do NOT navigate
    navigation.dispatch(DrawerActions.openDrawer());
  };

  const handleLogoPress = () => {
    // Close drawer first, then navigate to Home screen
    navigation.dispatch(DrawerActions.closeDrawer());
    setTimeout(() => {
      (navigation as any).navigate('MainApp', {
        screen: 'Home',
      });
    }, 100);
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.primary, paddingLeft: spacing.padding },
        ]}
      >
        <Pressable 
          style={styles.menuButton} 
          onPress={handleMenu}
        >
          <Ionicons name="menu" size={28} color={colors.card} />
        </Pressable>
        <View style={styles.centerContainer}>
          <Pressable 
            onPress={handleLogoPress}
            style={styles.logoPressable}
          >
            <Image source={images.simple_logo} style={styles.logo} />
            <AppText color={colors.card} variant="subheading">
              PetMood
            </AppText>
          </Pressable>
        </View>
        <View style={styles.rightSpacer} />
      </View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    minHeight: 60,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    alignSelf: 'center',
  },
  centerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  logoPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rightSpacer: {
    width: 44, // Same width as menu button to balance layout
    marginLeft: 'auto',
  },
  logo: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
  },
});
