import React, { useRef } from 'react';
import {
  Keyboard,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TextInput,
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
      if (!idToken || typeof idToken !== 'string') {
        console.error('Login response missing idToken', res);
        showErrMsg(
          'Could not complete sign-in (no token from server). Please try again.',
        );
        return;
      }

      store.dispatch(setToken(idToken));
      resetForm();
      showSuccessMsg('Login successful!');
    } catch (err: any) {
      const alreadyShownByAxios = err?.status != null || err?.data != null;
      if (!alreadyShownByAxios) {
        const msg =
          typeof err?.message === 'string' ? err.message : 'Sign in failed.';
        showErrMsg(msg);
      }
      console.error('Login error', err);
    }
  };

  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  /** iOS Keychain/AutoFill can show text before React state updates; keep last known strings for submit. */
  const emailDraftRef = useRef('');
  const passwordDraftRef = useRef('');

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema: loginSchema,
    validateOnMount: false,
    onSubmit: async (values, { resetForm }) => {
      await attemptLogin(values.email, values.password, resetForm);
    },
  });

  const handleLogin = () => {
    if (isLoading) {
      return;
    }
    // Dismiss focus so iOS commits Keychain/AutoFill into the native field and fires onChange* once.
    passwordInputRef.current?.blur();
    emailInputRef.current?.blur();
    Keyboard.dismiss();
    // One tick of delay so native value syncs to JS before we validate and submit.
    setTimeout(() => {
      const email = (emailDraftRef.current || formik.values.email).trim();
      const password = passwordDraftRef.current || formik.values.password;

      void (async () => {
        try {
          await loginSchema.validate({ email, password });
        } catch (e: unknown) {
          const msg = getYupFirstError(e) ?? 'Check your input';
          showMessage({ message: msg, type: 'danger' });
          return;
        }
        formik.setValues({ email, password }, false);
        await attemptLogin(email, password, formik.resetForm);
      })();
    }, 100);
  };

  const handleResetPassword = () => {
    navigation.navigate(RouteName.ResetPassword);
  };

  /** iOS/Android autofill: prefer native `text` so Formik state matches the visible field. */
  const syncEmailFromNativeChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
  ) => {
    const text = e.nativeEvent.text;
    if (text !== undefined) {
      emailDraftRef.current = text;
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
      if (text !== formik.values.password) {
        formik.setFieldValue('password', text, false);
      }
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
              ref={emailInputRef}
              leftImageSource={icons.email}
              placeholder="Email"
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={text => {
                emailDraftRef.current = text;
                formik.handleChange('email')(text);
              }}
              onChange={syncEmailFromNativeChange}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
              autoComplete="email"
              importantForAutofill="yes"
            />

            <PrimaryInput
              ref={passwordInputRef}
              leftImageSource={icons.lock}
              placeholder="Password"
              secureTextEntry
              iconColor={colors.primary}
              value={formik.values.password}
              onChangeText={text => {
                passwordDraftRef.current = text;
                formik.handleChange('password')(text);
              }}
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

function getYupFirstError(e: unknown): string | null {
  if (e && typeof e === 'object') {
    const inner = (e as { inner?: { message?: string }[] }).inner;
    if (Array.isArray(inner) && inner[0]?.message) {
      return inner[0].message;
    }
    const err = (e as { errors?: string[] }).errors;
    if (Array.isArray(err) && err[0]) {
      return err[0];
    }
  }
  return null;
}

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
