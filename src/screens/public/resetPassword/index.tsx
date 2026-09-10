import React, { useState } from 'react';
import {
  Platform,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import parsePhoneNumber from 'libphonenumber-js';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';

import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import AppText from '../../../components/Text/AppText';
import FieldError from '../../../components/inputs/FieldError';
import LogoView from '../../../components/views/LogoView';
import ScreenSafeArea from '../../../components/layout/ScreenSafeArea';
import { ResetPasswordProps, RouteName } from '../../../navigation/types';
import { useForgotPasswordMutation } from '../../../features/auth/authApiSlice';
import {
  getApiErrorMessage,
  phoneSchema,
} from '../../../utils/validations';

const DEFAULT_COUNTRY: Country = {
  cca2: 'US',
  currency: ['USD'],
  callingCode: ['1'],
  region: 'Americas',
  subregion: 'North America',
  flag: 'flag-us',
  name: 'United States',
};

const ResetPassword = ({ navigation }: ResetPasswordProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const formik = useFormik({
    initialValues: { number: '' },
    validationSchema: phoneSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async values => {
      const formattedPhoneNo = parsePhoneNumber(
        '+' + country.callingCode[0] + values.number,
      )?.formatInternational();

      if (!formattedPhoneNo) {
        formik.setFieldError('number', 'Please enter a valid phone number');
        return;
      }

      try {
        const phoneNumber = formattedPhoneNo.replace(/\s+/g, '');
        await forgotPassword({ phoneNumber }).unwrap();

        showMessage({
          message: 'Verification code sent successfully!',
          type: 'success',
        });

        navigation.navigate(RouteName.CodeVerification, {
          phoneNumber,
          isFromResetPassword: true,
        });
      } catch (error: unknown) {
        const msg = getApiErrorMessage(
          error,
          'This phone number is not registered. Please check and try again.',
        );
        formik.setFieldError('number', msg);
      }
    },
  });

  const showError =
    (submitAttempted || formik.touched.number) && formik.errors.number
      ? String(formik.errors.number)
      : undefined;

  const handleSubmit = async () => {
    setSubmitAttempted(true);
    formik.setTouched({ number: true });
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
          <Text style={styles.title}>Forgot Password</Text>

          <AppText
            variant="body"
            style={{ textAlign: 'center', marginBottom: 25 }}
          >
            Enter your registered phone number to{'\n'}reset your account
            password.
          </AppText>

          <View
            style={[
              styles.phoneRow,
              {
                borderColor: showError ? colors.danger : colors.inputBorder,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setShowCountryPicker(true)}>
              <CountryPicker
                countryCode={country.cca2}
                visible={showCountryPicker}
                onClose={() => setShowCountryPicker(false)}
                withAlphaFilter
                withFilter
                withCallingCode
                withCallingCodeButton
                withCloseButton
                withEmoji
                withFlag
                withFlagButton
                onSelect={value => setCountry(value)}
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.phoneInput, { color: colors.text }]}
              placeholder="Mobile Number *"
              placeholderTextColor={colors.placeholder}
              keyboardType="phone-pad"
              value={formik.values.number}
              onChangeText={formik.handleChange('number')}
              onBlur={formik.handleBlur('number')}
            />
          </View>
          <FieldError message={showError} />

          <View style={{ marginTop: 24 }}>
            <PrimaryButton
              onPress={handleSubmit}
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
                onPress={() => navigation.goBack()}
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

export default ResetPassword;

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
    phoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 12,
      minHeight: 46,
      backgroundColor: colors.card,
    },
    phoneInput: {
      flex: 1,
      fontSize: 15,
      paddingVertical: 8,
    },
  });
