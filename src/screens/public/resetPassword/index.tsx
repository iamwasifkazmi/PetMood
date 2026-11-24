import React, { useState } from 'react';
import {
  Keyboard,
  Platform,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import CountryPicker, {
  Country,
  FlagButton,
} from 'react-native-country-picker-modal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import parsePhoneNumber from 'libphonenumber-js';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';

import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import AppText from '../../../components/Text/AppText';
import FieldError from '../../../components/inputs/FieldError';
import AuthFormCard from '../../../components/layout/AuthFormCard';
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

const CountryCodePicker = CountryPicker as React.ComponentType<
  React.ComponentProps<typeof CountryPicker> & {
    closeButtonStyle?: { marginTop: number };
  }
>;

const ResetPassword = ({ navigation }: ResetPasswordProps) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);
  const insets = useSafeAreaInsets();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const pickerTopInset =
    Platform.OS === 'android' ? Math.max(insets.top, 48) : 0;

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

  const openCountryPicker = () => {
    Keyboard.dismiss();
    setShowCountryPicker(true);
  };

  return (
    <>
      <AuthFormCard
        title="Forgot Password"
        subtitle={
          <AppText variant="body" style={{ textAlign: 'center' }}>
            Enter your registered phone number to{'\n'}reset your account
            password.
          </AppText>
        }
      >
        <View
          style={[
            styles.phoneRow,
            {
              borderColor: showError ? colors.danger : colors.inputBorder,
            },
          ]}
        >
          <FlagButton
            countryCode={country.cca2}
            withEmoji
            withCallingCodeButton
            withFlagButton
            placeholder=""
            onOpen={openCountryPicker}
          />

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
      </AuthFormCard>

      <CountryCodePicker
        countryCode={country.cca2}
        visible={showCountryPicker}
        onClose={() => setShowCountryPicker(false)}
        onOpen={openCountryPicker}
        onSelect={value => {
          setCountry(value);
          setShowCountryPicker(false);
        }}
        withAlphaFilter
        withFilter
        withCallingCode
        withCloseButton
        withEmoji
        withFlag
        renderFlagButton={() => null}
        modalProps={
          Platform.OS === 'android'
            ? { statusBarTranslucent: true, animationType: 'slide' }
            : { animationType: 'slide' }
        }
        flatListProps={
          {
            keyboardShouldPersistTaps: 'handled',
          } as unknown as React.ComponentProps<typeof CountryPicker>['flatListProps']
        }
        theme={{
          backgroundColor: colors.card,
          onBackgroundTextColor: colors.text,
          fontSize: 16,
          filterPlaceholderTextColor: colors.placeholder,
        }}
        closeButtonStyle={{ marginTop: pickerTopInset }}
        renderCountryFilter={props => (
          <View
            style={[
              styles.countrySearchWrap,
              { marginTop: pickerTopInset, borderColor: colors.inputBorder },
            ]}
          >
            <TextInput
              value={props.value}
              onChangeText={text =>
                props.onChangeText?.(text.replace(/^\+/, ''))
              }
              onFocus={props.onFocus}
              onBlur={props.onBlur}
              placeholder="Search country or dialing code"
              placeholderTextColor={colors.placeholder}
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.countrySearch, { color: colors.text }]}
            />
          </View>
        )}
      />
    </>
  );
};

export default ResetPassword;

const useStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
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
    countrySearchWrap: {
      flex: 1,
      marginRight: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: colors.card,
    },
    countrySearch: {
      height: 48,
      paddingHorizontal: 12,
      fontSize: 16,
    },
  });
