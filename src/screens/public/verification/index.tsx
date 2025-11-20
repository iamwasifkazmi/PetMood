import { Formik } from 'formik';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  CodeField,
  useBlurOnFulfill,
} from 'react-native-confirmation-code-field';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import CellCard from '../../../components/cards/CellICard';
import LogoView from '../../../components/views/LogoView';
import { useTheme } from '../../../hooks/useTheme';
import { CodeVerificationProps, RouteName } from '../../../navigation/types';
import { showMessage } from 'react-native-flash-message';
import {
  useResendForgotPasswordOtpMutation,
  useResendOtpMutation,
  useSendOtpMutation,
  useVerifyForgotPasswordOtpMutation,
  useVerifyOtpMutation,
} from '../../../features/auth/authApiSlice';

const CELL_COUNT = 6;

const CodeVerification = ({ navigation, route }: CodeVerificationProps) => {
  const { phoneNumber, isFromResetPassword } = route.params;
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const [sendOtp] = useSendOtpMutation();
  const [resentOtp] = useResendOtpMutation();
  const [resendForgotOtp] = useResendForgotPasswordOtpMutation();
  const [verifyOTP, { isLoading }] = useVerifyOtpMutation();
  const [verifyForgotOTP, { isLoading: ForgotLoading }] =
    useVerifyForgotPasswordOtpMutation();

  const handleVerifyOtp = async (code: string) => {
    try {
      let formattedPhone = (phoneNumber ?? '').replace(/\s+/g, '').trim();

      // Optionally, ensure it starts with + (international format)
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone;
      }
      if (isFromResetPassword) {
        const res = await verifyForgotOTP({
          phoneNumber: formattedPhone,
          code,
        }).unwrap();
      } else {
        const res = await verifyOTP({
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
    } catch (err: any) {
      console.log('verify otp error', err);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.primary }}
      edges={['top']}
    >
      <Formik
        initialValues={{ code: '' }}
        onSubmit={values => {
          handleVerifyOtp(values.code);
        }}
      >
        {formik => {
          const codeInputRef = useBlurOnFulfill({
            value: formik.values.code,
            cellCount: CELL_COUNT,
          });

          useEffect(() => {
            if (formik.values.code.length === CELL_COUNT) {
              formik.handleSubmit();
            }
          }, [formik.values.code]);

          return (
            <View
              style={{
                paddingTop: 60,
                justifyContent: 'space-between',
                flex: 1,
              }}
            >
              <LogoView />
              <KeyboardAwareScrollView
                style={styles.bottomView}
                showsVerticalScrollIndicator={false}
              >
                <AppText style={styles.title}>OTP Code</AppText>
                <AppText variant="body" style={{ textAlign: 'center' }}>
                  Enter the OTP code we have sent.
                </AppText>

                <CodeField
                  autoFocus
                  ref={codeInputRef}
                  value={formik.values.code}
                  onChangeText={formik.handleChange('code')}
                  cellCount={CELL_COUNT}
                  keyboardType="number-pad"
                  rootStyle={styles.codeFieldRoot}
                  renderCell={options => (
                    <CellCard key={'cellItem-' + options.index} {...options} />
                  )}
                />

                <AppText
                  style={{
                    ...fonts.regular,
                    flex: 1,
                    flexWrap: 'wrap',
                    marginTop: 32,
                    textAlign: 'center',
                  }}
                  variant="body"
                >
                  If you didn’t receive the code please{' '}
                  <AppText
                    style={{ ...fonts.bold, color: colors.primary }}
                    onPress={() => {
                      const number = phoneNumber?.trim()?.replace(/\s+/g, '');
                      formik.setFieldValue('code', '');

                      if (number) {
                        if (isFromResetPassword) {
                          resendForgotOtp({ phoneNumber: number });
                        } else {
                          resentOtp({ phoneNumber: number });
                        }
                      } else {
                        showMessage({
                          message: 'Phone number is missing',
                          type: 'danger',
                        });
                      }
                    }}
                  >
                    Click Here
                  </AppText>
                </AppText>
              </KeyboardAwareScrollView>
            </View>
          );
        }}
      </Formik>
    </SafeAreaView>
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
    codeFieldRoot: {
      marginTop: 20,
      justifyContent: 'center',
    },
  });
