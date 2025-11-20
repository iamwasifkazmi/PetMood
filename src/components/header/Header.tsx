import { Image, Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import images from '../../assets/images';
import AppText from '../Text/AppText';
import { DrawerActions, useNavigation } from '@react-navigation/native';

const Header = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation();

  const handleMenu = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.primary, paddingLeft: spacing.padding },
      ]}
    >
      <Pressable style={styles.menuButton} onPress={handleMenu}>
        <Ionicons name="menu" size={24} color={colors.card} />
      </Pressable>
      <View style={styles.centerContent}>
        <Image source={images.simple_logo} style={styles.logo} />
        <AppText color={colors.card} variant="subheading">
          PetMood
        </AppText>
      </View>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    height: 100,
    paddingTop: 20,
    justifyContent: 'center',
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    marginTop: 15,
  },
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 52,
    height: 40,
    resizeMode: 'contain',
  },
});
