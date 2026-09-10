import React, { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
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
import { CreateNewPasswordProps, RouteName } from '../../../navigation/types';
import { useResetPasswordMutation } from '../../../features/auth/authApiSlice';
import { ResetPasswordArg } from '../../../features/auth/types';
import {
  getApiErrorMessage,
  PASSWORD_REQUIREMENTS_MSG,
  resetPasswordSchema,
} from '../../../utils/validations';

const CreateNewPassword = ({ navigation, route }: CreateNewPasswordProps) => {
  const { phoneNumber } = route.params;
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async values => {
      try {
        const payload: ResetPasswordArg = {
          phoneNumber,
          password: values.password,
          confirmPassword: values.confirmPassword,
        };

        await resetPassword(payload).unwrap();

        Alert.alert(
          'Password changed',
          'Your password has been reset successfully.',
          [
            {
              text: 'Sign In',
              onPress: () => navigation.navigate(RouteName.Login),
            },
          ],
        );
      } catch (error: unknown) {
        formik.setFieldError(
          'confirmPassword',
          getApiErrorMessage(error, 'Failed to reset password. Please try again.'),
        );
      }
    },
  });

  const showError = (field: 'password' | 'confirmPassword') =>
    (submitAttempted || formik.touched[field]) && formik.errors[field]
      ? String(formik.errors[field])
      : undefined;

  const handleReset = async () => {
    setSubmitAttempted(true);
    formik.setTouched({ password: true, confirmPassword: true });
    const errors = await formik.validateForm();
    if (Object.keys(errors).length > 0) {
      return;
    }
    formik.handleSubmit();
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
          <Text style={styles.title}>Set New Password</Text>

          <AppText
            variant="body"
            style={{ textAlign: 'center', marginBottom: 25 }}
          >
            Your new password must be different from{'\n'}previously used ones.
          </AppText>

          <PrimaryInput
            leftImageSource={icons.lock}
            placeholder="New Password"
            required
            rightImageSource={icons.eye}
            secureTextEntry
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={showError('password')}
          />
          {!showError('password') ? (
            <AppText size={12} color={colors.caption} style={{ marginLeft: 4, marginBottom: 8 }}>
              {PASSWORD_REQUIREMENTS_MSG}
            </AppText>
          ) : null}

          <PrimaryInput
            leftImageSource={icons.lock}
            placeholder="Confirm New Password"
            required
            rightImageSource={icons.eye}
            secureTextEntry
            containerStyle={{ marginTop: 8 }}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
            onBlur={formik.handleBlur('confirmPassword')}
            error={showError('confirmPassword')}
          />

          <View style={{ marginTop: 24 }}>
            <PrimaryButton
              onPress={handleReset}
              title="Reset Password"
              loading={isLoading}
              disabled={isLoading}
            />

            <AppText
              variant="body"
              style={{ alignSelf: 'center', marginTop: 24 }}
            >
              Back to
              <AppText
                onPress={() => navigation.navigate(RouteName.Login)}
                variant="heading"
                style={{ fontSize: 14 }}
                color={colors.primary}
              >
                {' '}
                Sign In
              </AppText>
            </AppText>
          </View>
        </KeyboardAwareScrollView>
      </View>
    </ScreenSafeArea>
  );
};

export default CreateNewPassword;

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
