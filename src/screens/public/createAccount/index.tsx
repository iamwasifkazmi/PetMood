import CheckBox from '@react-native-community/checkbox';
import React, { useRef, useState } from 'react';
import {
  Keyboard,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useFormik } from 'formik';
import { showMessage } from 'react-native-flash-message';
import CountryPicker, { Country } from 'react-native-country-picker-modal';
import parsePhoneNumberFromString from 'libphonenumber-js';

import icons from '../../../assets/icons/icons';
import {
  PRIVACY_POLICY_WEB_URL,
  TERMS_AND_CONDITIONS_URL,
} from '../../../common/legalUrls';
import { Theme } from '../../../common/theme';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import FieldError from '../../../components/inputs/FieldError';
import LogoView from '../../../components/views/LogoView';
import ScreenSafeArea from '../../../components/layout/ScreenSafeArea';
import { useTheme } from '../../../hooks/useTheme';
import { CreateAccountProps, RouteName } from '../../../navigation/types';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import AppText from '../../../components/Text/AppText';
import { useRegisterUserMutation } from '../../../features/auth/authApiSlice';
import {
  getApiErrorMessage,
  PASSWORD_REQUIREMENTS_MSG,
  signupSchemaEnglish,
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

type Step = 1 | 2;

const STEP1_FIELDS = ['fullName', 'email', 'number'] as const;
const STEP2_FIELDS = ['password', 'confirmPassword', 'agreeTerms'] as const;

const CreateAccount = ({ navigation }: CreateAccountProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  const [register, { isLoading }] = useRegisterUserMutation();
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [country, setCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [step, setStep] = useState<Step>(1);

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
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { resetForm }) => {
      const raw = values.number.replace(/\s+/g, '');
      const cc = country.cca2 as Parameters<typeof parsePhoneNumberFromString>[1];
      let parsed = parsePhoneNumberFromString(raw, cc);
      if (!parsed?.isValid()) {
        parsed = parsePhoneNumberFromString(
          `+${country.callingCode[0]}${raw}`,
          cc,
        );
      }

      const formattedPhoneNo =
        parsed?.isValid() === true ? parsed.formatInternational() : undefined;

      if (!formattedPhoneNo) {
        formik.setFieldError('number', 'Please enter a valid phone number');
        setStep(1);
        return;
      }

      try {
        const number = formattedPhoneNo.replace(/\s+/g, '');
        await register({
          name: values.fullName,
          email: values.email,
          number,
          password: values.password,
          confirmPassword: values.confirmPassword,
        }).unwrap();

        showMessage({
          message: 'Account created successfully!',
          type: 'success',
        });
        resetForm();
        setStep(1);
        setSubmitAttempted(false);
        navigation.navigate(RouteName.CodeVerification, {
          phoneNumber: formattedPhoneNo,
        });
      } catch (err: unknown) {
        const msg = getApiErrorMessage(
          err,
          'Signup failed. Please try again.',
        );
        const lower = msg.toLowerCase();
        if (lower.includes('email')) {
          formik.setFieldError('email', msg);
          setStep(1);
        } else if (
          lower.includes('phone') ||
          lower.includes('number') ||
          lower.includes('mobile')
        ) {
          formik.setFieldError('number', msg);
          setStep(1);
        } else {
          formik.setFieldError('password', msg);
          setStep(2);
        }
        setSubmitAttempted(true);
      }
    },
  });

  const showError = (field: keyof typeof formik.values) =>
    (submitAttempted || formik.touched[field]) && formik.errors[field]
      ? String(formik.errors[field])
      : undefined;

  const goToStep2 = async () => {
    Keyboard.dismiss();
    setSubmitAttempted(true);
    formik.setTouched({
      fullName: true,
      email: true,
      number: true,
    });

    const errors = await formik.validateForm();
    const step1HasError = STEP1_FIELDS.some(f => Boolean(errors[f]));
    if (step1HasError) {
      return;
    }

    // Validate phone with country code before leaving step 1
    const raw = formik.values.number.replace(/\s+/g, '');
    const cc = country.cca2 as Parameters<typeof parsePhoneNumberFromString>[1];
    let parsed = parsePhoneNumberFromString(raw, cc);
    if (!parsed?.isValid()) {
      parsed = parsePhoneNumberFromString(
        `+${country.callingCode[0]}${raw}`,
        cc,
      );
    }
    if (!parsed?.isValid()) {
      formik.setFieldError('number', 'Please enter a valid phone number');
      return;
    }

    setSubmitAttempted(false);
    setStep(2);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToPosition(0, 0, true);
    });
  };

  const goToStep1 = () => {
    Keyboard.dismiss();
    setSubmitAttempted(false);
    setStep(1);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToPosition(0, 0, true);
    });
  };

  const handleCreateAccount = async () => {
    Keyboard.dismiss();
    setSubmitAttempted(true);
    formik.setTouched({
      fullName: true,
      email: true,
      number: true,
      password: true,
      confirmPassword: true,
      agreeTerms: true,
    });
    const errors = await formik.validateForm();
    if (STEP1_FIELDS.some(f => Boolean(errors[f]))) {
      setStep(1);
      return;
    }
    if (STEP2_FIELDS.some(f => Boolean(errors[f]))) {
      return;
    }
    formik.handleSubmit();
  };

  const openLegalUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      showMessage({ message: 'Unable to open link.', type: 'danger' });
    }
  };

  return (
    <ScreenSafeArea style={{ backgroundColor: colors.primary }}>
      <View style={{ paddingTop: 48, flex: 1 }}>
        <LogoView />

        <KeyboardAwareScrollView
          ref={scrollRef}
          style={styles.bottomView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll
          extraScrollHeight={Platform.OS === 'android' ? 100 : 40}
          extraHeight={Platform.OS === 'android' ? 140 : 60}
          keyboardOpeningTime={0}
          enableResetScrollToCoords={false}
          nestedScrollEnabled
        >
          <Text style={styles.title}>Create Your Account</Text>
          <AppText
            size={13}
            color={colors.caption}
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            Step {step} of 2
            {step === 1 ? ' · Your details' : ' · Password & terms'}
          </AppText>

          {step === 1 ? (
            <View style={{ gap: 4 }}>
              <PrimaryInput
                leftImageSource={icons.profile}
                placeholder="Full Name"
                required
                value={formik.values.fullName}
                onChangeText={formik.handleChange('fullName')}
                onBlur={formik.handleBlur('fullName')}
                error={showError('fullName')}
                returnKeyType="next"
                autoCapitalize="words"
              />

              <PrimaryInput
                leftImageSource={icons.email}
                placeholder="Email"
                required
                keyboardType="email-address"
                value={formik.values.email}
                onChangeText={text =>
                  formik.setFieldValue('email', text.toLowerCase())
                }
                onBlur={formik.handleBlur('email')}
                autoCapitalize="none"
                autoCorrect={false}
                error={showError('email')}
                returnKeyType="next"
              />

              <View style={{ marginTop: 10 }}>
                <View
                  style={[
                    styles.phoneRow,
                    {
                      borderColor: showError('number')
                        ? colors.danger
                        : colors.inputBorder,
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
                    returnKeyType="done"
                    onSubmitEditing={() => void goToStep2()}
                  />
                </View>
                <FieldError message={showError('number')} />
              </View>

              <View style={{ marginTop: 28 }}>
                <PrimaryButton onPress={() => void goToStep2()} title="Next" />

                <AppText
                  variant="body"
                  style={{ alignSelf: 'center', marginTop: 24 }}
                >
                  Already have an account?
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
            </View>
          ) : (
            <View style={{ gap: 4 }}>
              <PrimaryInput
                leftImageSource={icons.lock}
                placeholder="Password"
                required
                rightImageSource={icons.eye}
                secureTextEntry
                value={formik.values.password}
                onChangeText={formik.handleChange('password')}
                onBlur={formik.handleBlur('password')}
                error={showError('password')}
                returnKeyType="next"
                textContentType="newPassword"
                autoComplete="password-new"
              />
              {!showError('password') ? (
                <AppText
                  size={12}
                  color={colors.caption}
                  style={{ marginLeft: 4 }}
                >
                  {PASSWORD_REQUIREMENTS_MSG}
                </AppText>
              ) : null}

              <PrimaryInput
                leftImageSource={icons.lock}
                placeholder="Confirm Password"
                required
                rightImageSource={icons.eye}
                secureTextEntry
                value={formik.values.confirmPassword}
                onChangeText={formik.handleChange('confirmPassword')}
                onBlur={formik.handleBlur('confirmPassword')}
                error={showError('confirmPassword')}
                returnKeyType="done"
                textContentType="newPassword"
                autoComplete="password-new"
              />

              <View style={styles.termsRow}>
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
                    onPress={() => openLegalUrl(TERMS_AND_CONDITIONS_URL)}
                  >
                    Terms & Conditions
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={{ ...fonts.bold, color: colors.primary }}
                    onPress={() => openLegalUrl(PRIVACY_POLICY_WEB_URL)}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
              <FieldError message={showError('agreeTerms')} />

              <View style={{ marginTop: 24, gap: 12 }}>
                <PrimaryButton
                  onPress={() => void handleCreateAccount()}
                  title="Create Account"
                  loading={isLoading}
                  disabled={isLoading}
                />
                <PrimaryButton
                  title="Back"
                  type="outlined"
                  onPress={goToStep1}
                  disabled={isLoading}
                />
              </View>
            </View>
          )}
        </KeyboardAwareScrollView>
      </View>
    </ScreenSafeArea>
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
      paddingHorizontal: spacing.padding,
      paddingTop: spacing.padding,
      borderTopEndRadius: 50,
      borderTopStartRadius: 50,
      marginTop: 40,
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 72,
      flexGrow: 1,
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      ...fonts.semiBold,
      marginBottom: 8,
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
    termsRow: {
      flexDirection: 'row',
      marginTop: 20,
      alignItems: 'flex-start',
    },
    checkbox: {
      width: 20,
      height: 20,
      marginRight: 10,
      marginLeft: 10,
    },
  });
