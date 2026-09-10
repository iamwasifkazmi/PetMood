import { Formik } from 'formik';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import {
  CodeField,
  useBlurOnFulfill,
} from 'react-native-confirmation-code-field';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import CellCard from '../../../components/cards/CellICard';
import FieldError from '../../../components/inputs/FieldError';
import LogoView from '../../../components/views/LogoView';
import ScreenSafeArea from '../../../components/layout/ScreenSafeArea';
import { useTheme } from '../../../hooks/useTheme';
import { CodeVerificationProps, RouteName } from '../../../navigation/types';
import { showMessage } from 'react-native-flash-message';
import {
  useResendForgotPasswordOtpMutation,
  useResendOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useVerifyOtpMutation,
} from '../../../features/auth/authApiSlice';
import { getApiErrorMessage } from '../../../utils/validations';

const CELL_COUNT = 6;
const RESEND_COOLDOWN_SEC = 60;
const OTP_EXPIRY_SEC = 10 * 60;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const CodeVerification = ({ navigation, route }: CodeVerificationProps) => {
  const { phoneNumber, isFromResetPassword } = route.params;
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [resendOtp] = useResendOtpMutation();
  const [resendForgotOtp] = useResendForgotPasswordOtpMutation();
  const [verifyOTP, { isLoading }] = useVerifyOtpMutation();
  const [verifyForgotOTP, { isLoading: forgotLoading }] =
    useVerifyForgotPasswordOtpMutation();

  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [expirySeconds, setExpirySeconds] = useState(OTP_EXPIRY_SEC);

  useEffect(() => {
    const id = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
      setExpirySeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatPhone = useCallback(() => {
    let formattedPhone = (phoneNumber ?? '').replace(/\s+/g, '').trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone;
    }
    return formattedPhone;
  }, [phoneNumber]);

  const maskedPhone = useMemo(() => {
    const raw = formatPhone().replace(/\s+/g, '');
    if (raw.length < 6) {
      return raw;
    }
    const start = raw.slice(0, Math.min(4, raw.length - 4));
    const end = raw.slice(-3);
    return `${start}${'*'.repeat(Math.max(3, raw.length - start.length - 3))}${end}`;
  }, [formatPhone]);

  const handleVerifyOtp = async (code: string) => {
    setOtpError(null);
    if (expirySeconds <= 0) {
      setOtpError('This OTP has expired. Please request a new code.');
      return;
    }

    try {
      const formattedPhone = formatPhone();
      if (isFromResetPassword) {
        await verifyForgotOTP({
          phoneNumber: formattedPhone,
          code,
        }).unwrap();
      } else {
        await verifyOTP({
          phoneNumber: formattedPhone,
          code,
        }).unwrap();
      }

      showMessage({
        message: 'OTP verified successfully!',
        type: 'success',
      });

      if (isFromResetPassword) {
        navigation.navigate(RouteName.CreateNewPassword, {
          phoneNumber: formattedPhone,
        });
      } else {
        navigation.navigate(RouteName.Login);
      }
    } catch (err: unknown) {
      setOtpError(
        getApiErrorMessage(err, 'Invalid or expired OTP. Please try again.'),
      );
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) {
      return;
    }

    const number = formatPhone();
    if (!number) {
      showMessage({ message: 'Phone number is missing', type: 'danger' });
      return;
    }

    try {
      if (isFromResetPassword) {
        await resendForgotOtp({ phoneNumber: number }).unwrap();
      } else {
        await resendOtp({ phoneNumber: number }).unwrap();
      }
      setOtpError(null);
      setResendCooldown(RESEND_COOLDOWN_SEC);
      setExpirySeconds(OTP_EXPIRY_SEC);
      showMessage({ message: 'A new OTP has been sent.', type: 'success' });
    } catch (err: unknown) {
      showMessage({
        message: getApiErrorMessage(
          err,
          'Please wait before requesting a new OTP.',
        ),
        type: 'danger',
      });
      setResendCooldown(RESEND_COOLDOWN_SEC);
    }
  };

  return (
    <ScreenSafeArea style={{ backgroundColor: colors.primary }}>
      <Formik
        initialValues={{ code: '' }}
        onSubmit={values => handleVerifyOtp(values.code)}
      >
        {formik => {
          const codeInputRef = useBlurOnFulfill({
            value: formik.values.code,
            cellCount: CELL_COUNT,
          });

          useEffect(() => {
            if (formik.values.code.length === CELL_COUNT && !isLoading && !forgotLoading) {
              formik.handleSubmit();
            }
          }, [formik.values.code]);

          return (
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
                <AppText style={styles.title}>OTP Code</AppText>
                <AppText variant="body" style={{ textAlign: 'center' }}>
                  Enter the OTP code we sent to
                </AppText>
                <AppText
                  variant="heading"
                  style={{ textAlign: 'center', marginTop: 6, fontSize: 16 }}
                  color={colors.primary}
                >
                  {maskedPhone}
                </AppText>

                <AppText
                  size={13}
                  color={colors.caption}
                  style={{ textAlign: 'center', marginTop: 12 }}
                >
                  {expirySeconds > 0
                    ? `Code expires in ${formatTimer(expirySeconds)}`
                    : 'OTP expired — request a new code'}
                </AppText>

                <CodeField
                  autoFocus
                  ref={codeInputRef}
                  value={formik.values.code}
                  onChangeText={text => {
                    setOtpError(null);
                    formik.setFieldValue('code', text);
                  }}
                  cellCount={CELL_COUNT}
                  keyboardType="number-pad"
                  rootStyle={styles.codeFieldRoot}
                  renderCell={options => (
                    <CellCard key={'cellItem-' + options.index} {...options} />
                  )}
                />
                <FieldError message={otpError} />

                <AppText
                  style={{
                    ...fonts.regular,
                    marginTop: 32,
                    textAlign: 'center',
                  }}
                  variant="body"
                >
                  {resendCooldown > 0 ? (
                    `Resend available in ${formatTimer(resendCooldown)}`
                  ) : (
                    <>
                      If you didn’t receive the code please{' '}
                      <AppText
                        style={{ ...fonts.bold, color: colors.primary }}
                        onPress={handleResend}
                      >
                        click here
                      </AppText>
                    </>
                  )}
                </AppText>
              </KeyboardAwareScrollView>
            </View>
          );
        }}
      </Formik>
    </ScreenSafeArea>
  );
};

export default CodeVerification;

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
    codeFieldRoot: {
      marginTop: 20,
      justifyContent: 'center',
    },
  });
