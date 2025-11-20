import { Image, Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.primary }}>
      <View
        style={[
          styles.container,
          { backgroundColor: colors.primary, paddingLeft: spacing.padding },
        ]}
      >
        <Pressable style={styles.menuButton} onPress={handleMenu}>
          <Ionicons name="menu" size={28} color={colors.card} />
        </Pressable>
        <View style={styles.centerContent}>
          <Image source={images.simple_logo} style={styles.logo} />
          <AppText color={colors.card} variant="subheading">
            PetMood
          </AppText>
        </View>
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
  centerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
  },
});
