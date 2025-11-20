import React, { useRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { showMessage } from 'react-native-flash-message';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import LogoView from '../../../components/views/LogoView';
import { useTheme } from '../../../hooks/useTheme';
import { CreateNewPasswordProps, RouteName } from '../../../navigation/types';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { useResetPasswordMutation } from '../../../features/auth/authApiSlice';
import { ResetPasswordArg } from '../../../features/auth/types';
import { resetPasswordSchema } from '../../../utils/validations';

const CreateNewPassword = ({ navigation, route }: CreateNewPasswordProps) => {
  const { phoneNumber } = route.params; // passed from CodeVerification screen
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const formik = useFormik({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async values => {
      try {
        const payload: ResetPasswordArg = {
          phoneNumber,
          password: values.password,
          confirmPassword: values.confirmPassword,
        };

        const res = await resetPassword(payload).unwrap();
        console.log('Password Reset Response:', res);

        showMessage({
          message: 'Password changed successfully!',
          type: 'success',
        });

        bottomSheetRef.current?.expand();
      } catch (error: any) {
        showMessage({
          message: 'Failed to reset password',
          description: error?.data?.message || 'Please try again later',
          type: 'danger',
        });
        console.log('Reset Password Error:', error);
      }
    },
  });

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
    navigation.navigate(RouteName.Login);
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
          keyboardShouldPersistTaps="handled"
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
            rightImageSource={icons.eye}
            secureTextEntry
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
          />

          <PrimaryInput
            leftImageSource={icons.lock}
            placeholder="Confirm New Password"
            rightImageSource={icons.eye}
            secureTextEntry
            containerStyle={{ marginTop: 18 }}
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
          />

          <View style={{ marginTop: 24, marginBottom: 20 }}>
            <PrimaryButton
              onPress={formik.handleSubmit}
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

      {/* ✅ Success Bottom Sheet */}
      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['30%']}>
        <Image source={icons.success} style={styles.successImage} />
        <AppText
          variant="heading"
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          Password Successfully Changed!
        </AppText>
        <PrimaryButton title="Okay" onPress={handleOkay} />
      </GlobalBottomSheet>
    </SafeAreaView>
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
    successImage: {
      width: 60,
      height: 60,
      resizeMode: 'contain',
      alignSelf: 'center',
      marginBottom: 24,
    },
  });
