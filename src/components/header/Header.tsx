import { Pressable, StyleSheet, View } from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';

const Header = () => {
  const { colors, spacing } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();

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
      </View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  menuButton: {
    alignSelf: 'flex-start',
  },
});
