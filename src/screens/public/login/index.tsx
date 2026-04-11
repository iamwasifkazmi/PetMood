import React from 'react';
import {
  Image,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import LogoView from '../../../components/views/LogoView';
import { useTheme } from '../../../hooks/useTheme';
import { LoginProps, RouteName } from '../../../navigation/types';
import { useLoginMutation } from '../../../features/auth/authApiSlice';
import { loginSchema } from '../../../utils/validations';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';
import { store } from '../../../features/store';
import { setToken } from '../../../features/auth/authSlice';

const Login = ({ navigation }: LoginProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [login, { isLoading }] = useLoginMutation();

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        const res = await login({
          email: values.email,
          password: values.password,
          returnSecureToken: true,
        }).unwrap();
        store.dispatch(setToken(res?.idToken));

        console.log('res', res);
        showSuccessMsg('Login successful!');
        // navigation.navigate(RouteName.BottomTabStack);
        resetForm();
      } catch (err: any) {}
    },
  });

  const handleLogin = async () => {
    await formik.validateForm();
    const firstError = Object.values(formik.errors)[0];
    if (firstError) {
      showMessage({ message: firstError as string, type: 'danger' });
      return;
    }
    formik.handleSubmit();
  };

  const handleResetPassword = () => {
    navigation.navigate(RouteName.ResetPassword);
  };

  /** iOS/Android password autofill often fills the field without firing onChangeText; onChange usually still runs. */
  const syncEmailFromNativeChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const text = e.nativeEvent.text;
    if (text !== undefined && text !== formik.values.email) {
      formik.setFieldValue('email', text, false);
    }
  };

  const syncPasswordFromNativeChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const text = e.nativeEvent.text;
    if (text !== undefined && text !== formik.values.password) {
      formik.setFieldValue('password', text, false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary }}
      edges={['top']}
    >
      <View
        style={{ paddingTop: 60, justifyContent: 'space-between', flex: 1 }}
      >
        <LogoView />
        <KeyboardAwareScrollView
          style={styles.bottomView}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Sign In To Your Account</Text>

          <View style={{ gap: 12 }}>
            <PrimaryInput
              leftImageSource={icons.email}
              placeholder="Email"
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={formik.handleChange('email')}
              onChange={syncEmailFromNativeChange}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
              importantForAutofill="yes"
            />

            <PrimaryInput
              leftImageSource={icons.lock}
              placeholder="Password"
              secureTextEntry
              iconColor={colors.primary}
              value={formik.values.password}
              onChangeText={formik.handleChange('password')}
              onChange={syncPasswordFromNativeChange}
              textContentType="password"
              autoComplete="password"
              importantForAutofill="yes"
            />
          </View>

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: 16 }}
            onPress={handleResetPassword}
          >
            <AppText
              variant="heading"
              style={{ fontSize: 14 }}
              color={colors.primary}
            >
              Forgot Password?
            </AppText>
          </TouchableOpacity>

          <View style={{ marginTop: 24, marginBottom: 20 }}>
            <PrimaryButton
              onPress={handleLogin}
              title="Sign In"
              loading={isLoading}
              disabled={isLoading}
            />

            <AppText
              variant="body"
              style={{ alignSelf: 'center', marginTop: 24 }}
            >
              Don’t have an account?
              <AppText
                onPress={() => {
                  navigation.navigate(RouteName.CreateAccount);
                }}
                variant="heading"
                style={{ fontSize: 14 }}
                color={colors.primary}
              >
                {' '}
                Sign Up
              </AppText>
            </AppText>

            {/* <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View> */}
            {/* 
            <TouchableOpacity style={styles.socialButton}>
              <Image source={icons.google} style={styles.googleLogo} />
              <AppText variant="heading" style={styles.socialButtonText}>
                Sign In with Google
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Image source={icons.apple} style={styles.googleLogo} />
              <AppText variant="heading" style={styles.socialButtonText}>
                Sign In with Apple
              </AppText>
            </TouchableOpacity> */}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};

export default Login;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    bottomView: {
      backgroundColor: colors.card,
      padding: spacing.padding,
      borderTopEndRadius: 50,
      borderTopStartRadius: 50,
      paddingBottom: 40,
      marginTop: 40,
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      ...fonts.semiBold,
      marginBottom: 16,
    },
    orContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 20,
    },
    orLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#DBDFE1',
    },
    orText: {
      marginHorizontal: 10,
      ...fonts.regular,
      color: colors.text,
    },
    socialButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 50,
      paddingVertical: 12,
      alignItems: 'center',
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12,
    },
    googleLogo: {
      width: 24,
      height: 24,
      resizeMode: 'contain',
    },
    socialButtonText: {
      fontSize: 14,
    },
  });
