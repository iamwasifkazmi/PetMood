import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import ScreenSafeArea from '../../../components/layout/ScreenSafeArea';
import { useTheme } from '../../../hooks/useTheme';
import { RouteName, SplashProps } from '../../../navigation/types';

const Splash = ({ navigation }: SplashProps) => {
  const { colors, fonts } = useTheme();
  const styles = useStyles(colors, fonts);
  const handleCreateAccount = (type: 'signin' | 'splash' | 'signup') => {
    if (type === 'signin') {
      navigation.navigate(RouteName.Login);
    } else if (type === 'signup') {
      navigation.navigate(RouteName.CreateAccount);
    } else {
      navigation.navigate(RouteName.Onboarding);
    }
  };
  return (
    <ScreenSafeArea style={{ backgroundColor: colors.primary }}>
      <View style={styles.container}>
        <View style={styles.logoWrapper}>
          <Image
            style={styles.logo}
            source={images.logo}
            resizeMode="contain"
          />
        </View>
        <View style={styles.buttonWrapper}>
          <PrimaryButton
            onPress={() => {
              handleCreateAccount('splash');
            }}
            title="Create Account"
            style={{ backgroundColor: colors.card }}
            titleStyle={{ color: colors.primary }}
          />
          <PrimaryButton
            onPress={() => {
              handleCreateAccount('signin');
            }}
            title="Sign In"
            style={{ borderWidth: 1, borderColor: colors.card, marginTop: 12 }}
          />
        </View>
      </View>
    </ScreenSafeArea>
  );
};

export default Splash;

const useStyles = (colors: Theme['colors'], fonts: Theme['fonts']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 24,
    },
    logoWrapper: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    logo: {
      width: 200,
      height: 194,
      marginTop: 30,
    },
    buttonWrapper: {
      marginBottom: 12,
      gap: 5,
    },
  });
