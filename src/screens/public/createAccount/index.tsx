import CheckBox from '@react-native-community/checkbox';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import parsePhoneNumber from 'libphonenumber-js';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import LogoView from '../../../components/views/LogoView';
import { useTheme } from '../../../hooks/useTheme';
import { CreateAccountProps, RouteName } from '../../../navigation/types';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import AppText from '../../../components/Text/AppText';
import {
  useRegisterUserMutation,
  useVerifyOtpMutation,
} from '../../../features/auth/authApiSlice';
import { signupSchemaEnglish } from '../../../utils/validations';

const { height } = Dimensions.get('window');

const DEFAULT_COUNTRY: Country = {
  cca2: 'US',
  currency: ['USD'],
  callingCode: ['1'],
  region: 'Americas',
  subregion: 'North America',
  flag: 'flag-us',
  name: 'United States',
};

const CreateAccount = ({ navigation }: CreateAccountProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [register, { isLoading }] = useRegisterUserMutation();

  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);

  const formik = useFormik({
    initialValues: {
      fullName: '',
      email: '',
      number: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
    validationSchema: signupSchemaEnglish,
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
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
        const number = formattedPhoneNo?.replace(/\s+/g, '');

        const payload = {
          name: values.fullName,
          email: values.email,
          number: number,
          password: values.password,
          confirmPassword: values.confirmPassword,
        };
        console.log('payload', payload);

        const res = await register(payload).unwrap();
        console.log('object', res);
        showMessage({
          message: 'Account created successfully!',
          type: 'success',
        });
        resetForm();
        navigation.navigate(RouteName.CodeVerification, {
          phoneNumber: formattedPhoneNo,
        });
      } catch (err: any) {
        // showMessage({
        //   message: 'Signup failed',
        //   description: err?.data?.message || 'Please try again',
        //   type: 'danger',
        // });
        // console.log('Signup Error:', err);
      }
    },
  });

  const handleCreateAccount = async () => {
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
          <Text style={styles.title}>Create Your Account</Text>

          <View style={{ gap: 12 }}>
            <PrimaryInput
              leftImageSource={icons.profile}
              placeholder="Full Name"
              value={formik.values.fullName}
              onChangeText={formik.handleChange('fullName')}
            />

            <PrimaryInput
              leftImageSource={icons.email}
              placeholder="Email"
              keyboardType="email-address"
              value={formik.values.email}
              onChangeText={formik.handleChange('email')}
            />

            {/* Country Picker + Mobile Input */}
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

            <PrimaryInput
              leftImageSource={icons.lock}
              placeholder="Password"
              rightImageSource={icons.eye}
              secureTextEntry
              value={formik.values.password}
              onChangeText={formik.handleChange('password')}
            />

            <PrimaryInput
              leftImageSource={icons.lock}
              placeholder="Confirm Password"
              rightImageSource={icons.eye}
              secureTextEntry
              value={formik.values.confirmPassword}
              onChangeText={formik.handleChange('confirmPassword')}
            />
          </View>

          {/* Terms and Conditions */}
          <View
            style={{
              flexDirection: 'row',
              marginTop: 20,
              alignItems: 'flex-start',
            }}
          >
            <CheckBox
              boxType="square"
              disabled={false}
              style={styles.checkbox}
              onFillColor={colors.primary}
              onTintColor={colors.primary}
              tintColor={colors.border}
              onCheckColor={'white'}
              value={formik.values.agreeTerms}
              onChange={e =>
                formik.setFieldValue('agreeTerms', e.nativeEvent.value)
              }
            />
            <Text style={{ ...fonts.regular, flex: 1, flexWrap: 'wrap' }}>
              I agree to the{' '}
              <Text
                style={{ ...fonts.bold, color: colors.primary }}
                onPress={() => {}}
              >
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text
                style={{ ...fonts.bold, color: colors.primary }}
                onPress={() => {}}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </View>

          {/* Buttons */}
          <View style={{ marginTop: 24, marginBottom: 20 }}>
            <PrimaryButton
              onPress={handleCreateAccount}
              title="Create Account"
              loading={isLoading}
              disabled={isLoading}
            />

            <AppText
              variant="body"
              style={{ alignSelf: 'center', marginTop: 24 }}
            >
              Already have an account?
              <AppText
                onPress={() => {
                  navigation.navigate(RouteName.Login);
                }}
                variant="heading"
                style={{ fontSize: 14 }}
                color={colors.primary}
              >
                {' '}
                Sign In
              </AppText>
            </AppText>

            {/* <View style={styles.orContainer}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View> */}

            {/* <TouchableOpacity style={styles.socialButton}>
              <Image source={icons.google} style={styles.googleLogo} />
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Image source={icons.apple} style={styles.googleLogo} />
              <Text style={styles.socialButtonText}>
                Continue with App Login
              </Text>
            </TouchableOpacity> */}
          </View>
        </KeyboardAwareScrollView>
      </View>
    </SafeAreaView>
  );
};

export default CreateAccount;

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
    checkbox: {
      width: 20,
      height: 20,
      marginRight: 10,
      marginLeft: 10,
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
      ...fonts.medium,
      color: colors.text,
    },
  });
