import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import parsePhoneNumber from 'libphonenumber-js';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import AppText from '../../../components/Text/AppText';
import LogoView from '../../../components/views/LogoView';
import { ResetPasswordProps, RouteName } from '../../../navigation/types';
import { useForgotPasswordMutation } from '../../../features/auth/authApiSlice';
import { phoneSchema } from '../../../utils/validations'; // 👈 create this if not already

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

  const formik = useFormik({
    initialValues: { number: '' },
    validationSchema: phoneSchema,
    onSubmit: async values => {
      const formattedPhoneNo = parsePhoneNumber(
        '+' + country.callingCode[0] + values.number,
      )?.formatInternational();

      if (!formattedPhoneNo) {
        showMessage({
          message: 'Please enter a valid phone number',
          type: 'danger',
        });
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
      } catch (error: any) {
        showMessage({
          message: 'Request failed',
          description: error?.data?.message || 'Please try again',
          type: 'danger',
        });
      }
    },
  });

  const handleSubmit = async () => {
    await formik.validateForm();
    const firstError = Object.values(formik.errors)[0];
    if (firstError) {
      showMessage({ message: firstError as string, type: 'danger' });
      return;
    }
    formik.handleSubmit();
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
          <Text style={styles.title}>Forgot Password</Text>

          <AppText
            variant="body"
            style={{ textAlign: 'center', marginBottom: 25 }}
          >
            Enter your registered phone number to{'\n'}reset your account
            password.
          </AppText>

          {/* 📱 Country Picker + Phone Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 6,
              paddingHorizontal: 12,
              height: 46,
            }}
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
              style={{ flex: 1 }}
              placeholder="Mobile Number"
              keyboardType="phone-pad"
              value={formik.values.number}
              onChangeText={formik.handleChange('number')}
            />
          </View>

          <View style={{ marginTop: 24, marginBottom: 20 }}>
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
    </SafeAreaView>
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
  });
