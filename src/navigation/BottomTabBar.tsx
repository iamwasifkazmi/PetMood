import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import icons from '../assets/icons/icons';
import AppText from '../components/Text/AppText';
import { useTheme } from '../hooks/useTheme';
import { useSafeBottomPadding } from '../hooks/useSafeBottomPadding';
import { RootState, useAppSelector } from '../features/store';

const tabIcons = {
  Home: icons.home,
  Profile: icons.paw,
  History: icons.history,
  Community: icons.community,
  Scanner: icons.scanner,
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors } = useTheme();
  const bottomPad = useSafeBottomPadding(4);
  const isTabBarVisible = useAppSelector(
    (state: RootState) => state.tabBar.isVisible,
  );

  if (!isTabBarVisible) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: bottomPad,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        if (route.name === 'Scanner') {
          return (
            <TouchableOpacity
              key={route.key}
              style={{
                ...styles.scannerButton,
                backgroundColor: colors.primary,
              }}
              onPress={() => navigation.navigate(route.name)}
            >
              <Image source={icons.scanner} style={styles.scannerIcon} />
            </TouchableOpacity>
          );
        }

        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
          >
            <Image
              source={tabIcons[route.name as keyof typeof tabIcons]}
              style={[
                styles.icon,
                { tintColor: isFocused ? colors.primary : colors.greyLight },
              ]}
            />
            <AppText
              style={[
                styles.label,
                { color: isFocused ? colors.primary : colors.greyLight },
              ]}
            >
              {route.name}
            </AppText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomTabBar;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 26,
    height: 26,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  label: {
    fontSize: 12,
  },
  scannerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  scannerIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
    resizeMode: 'contain',
  },
});
