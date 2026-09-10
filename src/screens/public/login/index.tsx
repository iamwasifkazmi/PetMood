import React, { useRef, useState } from 'react';
import {
  Keyboard,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputChangeEventData,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFormik } from 'formik';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import LogoView from '../../../components/views/LogoView';
import ScreenSafeArea from '../../../components/layout/ScreenSafeArea';
import { useTheme } from '../../../hooks/useTheme';
import { LoginProps, RouteName } from '../../../navigation/types';
import { useLoginMutation } from '../../../features/auth/authApiSlice';
import { loginSchema } from '../../../utils/validations';
import { showSuccessMsg } from '../../../utils/flashMessage';
import { store } from '../../../features/store';
import { setAuthSession } from '../../../features/auth/authSlice';

const Login = ({ navigation }: LoginProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [login, { isLoading }] = useLoginMutation();
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const emailDraftRef = useRef('');
  const passwordDraftRef = useRef('');

  const attemptLogin = async (
    email: string,
    password: string,
    resetForm: () => void,
  ) => {
    try {
      const res = await login({
        email,
        password,
        returnSecureToken: true,
      }).unwrap();

      const idToken = res?.idToken;
      const refreshToken = res?.refreshToken;
      if (
        !idToken ||
        typeof idToken !== 'string' ||
        !refreshToken ||
        typeof refreshToken !== 'string'
      ) {
        setLoginError(
          'Could not complete sign-in (no token from server). Please try again.',
        );
        return;
      }

      store.dispatch(
        setAuthSession({
          idToken,
          refreshToken,
          expiresIn: res.expiresIn || '3600',
        }),
      );
      resetForm();
      setLoginError(null);
      showSuccessMsg('Login successful!');
    } catch (err: unknown) {
      const alreadyShownByAxios =
        err &&
        typeof err === 'object' &&
        ('status' in err || 'data' in err);
      const message = alreadyShownByAxios
        ? 'Please enter valid credentials.'
        : typeof (err as { message?: string })?.message === 'string'
          ? (err as { message: string }).message
          : 'Please enter valid credentials.';
      setLoginError(message);
      // Field-level error only — axios already suppresses Identity Toolkit toasts
    }
  };

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      await attemptLogin(values.email, values.password, resetForm);
    },
  });

  const showError = (field: 'email' | 'password') => {
    if (field === 'email' && loginError && !formik.values.email.trim()) {
      return loginError;
    }
    if (
      (submitAttempted || formik.touched[field]) &&
      formik.errors[field]
    ) {
      return formik.errors[field];
    }
    if (field === 'password' && loginError && submitAttempted) {
      return loginError;
    }
    return undefined;
  };

  const handleLogin = () => {
    if (isLoading) return;

    passwordInputRef.current?.blur();
    emailInputRef.current?.blur();
    Keyboard.dismiss();

    setTimeout(() => {
      const email = (emailDraftRef.current || formik.values.email).trim();
      const password = passwordDraftRef.current || formik.values.password;

      setSubmitAttempted(true);
      formik.setValues({ email, password }, false);
      formik.setTouched({ email: true, password: true });

      void (async () => {
        try {
          await loginSchema.validate({ email, password }, { abortEarly: false });
          setLoginError(null);
          await attemptLogin(email, password, formik.resetForm);
        } catch (e: unknown) {
          if (e && typeof e === 'object' && 'inner' in e) {
            const inner = (e as { inner?: { path?: string; message?: string }[] })
              .inner;
            inner?.forEach(item => {
              if (item.path === 'email' || item.path === 'password') {
                formik.setFieldError(item.path, item.message);
              }
            });
          }
        }
      })();
    }, 100);
  };

  const syncEmailFromNativeChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const text = e.nativeEvent.text;
    if (text !== undefined) {
      emailDraftRef.current = text;
      setLoginError(null);
      if (text !== formik.values.email) {
        formik.setFieldValue('email', text, false);
      }
    }
  };

  const syncPasswordFromNativeChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const text = e.nativeEvent.text;
    if (text !== undefined) {
      passwordDraftRef.current = text;
      setLoginError(null);
      if (text !== formik.values.password) {
        formik.setFieldValue('password', text, false);
      }
    }
  };

  return (
    <ScreenSafeArea style={{ backgroundColor: colors.primary }}>
      <View style={{ paddingTop: 60, flex: 1 }}>
        <LogoView />
        <KeyboardAwareScrollView
          style={styles.bottomView}
          contentContainerStyle={{ paddingBottom: 72, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === 'android' ? 100 : 40}
          extraHeight={Platform.OS === 'android' ? 140 : 60}
          keyboardOpeningTime={0}
          enableResetScrollToCoords={false}
        >
          <Text style={styles.title}>Sign In To Your Account</Text>

          <View style={{ gap: 4 }}>
            <PrimaryInput
              ref={emailInputRef}
              leftImageSource={icons.email}
              placeholder="Email"
              required
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={text => {
                emailDraftRef.current = text;
                setLoginError(null);
                formik.handleChange('email')(text);
              }}
              onBlur={formik.handleBlur('email')}
              onChange={syncEmailFromNativeChange}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
              importantForAutofill="yes"
              error={showError('email')}
            />

            <PrimaryInput
              ref={passwordInputRef}
              leftImageSource={icons.lock}
              placeholder="Password"
              required
              secureTextEntry
              iconColor={colors.primary}
              value={formik.values.password}
              onChangeText={text => {
                passwordDraftRef.current = text;
                setLoginError(null);
                formik.handleChange('password')(text);
              }}
              onBlur={formik.handleBlur('password')}
              onChange={syncPasswordFromNativeChange}
              textContentType="password"
              autoComplete="password"
              importantForAutofill="yes"
              error={showError('password')}
            />
          </View>

          <TouchableOpacity
            style={{ alignSelf: 'flex-end', marginTop: 16 }}
            onPress={() => navigation.navigate(RouteName.ResetPassword)}
          >
            <AppText
              variant="heading"
              style={{ fontSize: 14 }}
              color={colors.primary}
            >
              Forgot Password?
            </AppText>
          </TouchableOpacity>

          <View style={{ marginTop: 24 }}>
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
                onPress={() => navigation.navigate(RouteName.CreateAccount)}
                variant="heading"
                style={{ fontSize: 14 }}
                color={colors.primary}
              >
                {' '}
                Sign Up
              </AppText>
            </AppText>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </ScreenSafeArea>
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
      marginTop: 40,
      flex: 1,
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      ...fonts.semiBold,
      marginBottom: 16,
    },
  });
