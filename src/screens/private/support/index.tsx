import { useFormik } from 'formik';
import React, { useRef } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { SuccessImage } from '../../../components/views/SuccessImage';
import { useSendSupportMessageMutation } from '../../../features/support/supportApiSlice';
import { useTheme } from '../../../hooks/useTheme';
import { supportSchema } from '../../../utils/validations';

const Support = () => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, spacing);
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [sendSupportMessage, { isLoading }] = useSendSupportMessageMutation();

  const formik = useFormik({
    initialValues: {
      email: '',
      message: '',
    },
    validationSchema: supportSchema,
    validateOnMount: true,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await sendSupportMessage({
          email: values.email,
          details: values.message,
        }).unwrap();

        resetForm();
        bottomSheetRef?.current?.expand();
      } catch (error: any) {}
    },
  });

  const handleSend = async () => {
    await formik.validateForm();
    const firstError = Object.values(formik.errors)[0];
    if (firstError) {
      showMessage({ message: firstError as string, type: 'danger' });
      return;
    }
    formik.handleSubmit();
  };

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <Header />
      <View style={{ padding: spacing.padding, flex: 1 }}>
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 24 }}
        >
          Need Help? Contact Us
        </AppText>

        {/* Email Input */}
        <PrimaryInput
          placeholder="Enter your email address"
          leftImageSource={icons.email}
          containerStyle={{ marginBottom: 15 }}
          value={formik.values.email}
          onChangeText={text => formik.setFieldValue('email', text.toLowerCase())}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Message Input */}
        <View style={styles.inputView}>
          <Image
            source={icons.book}
            style={{ width: 20, height: 20, resizeMode: 'contain' }}
          />
          <TextInput
            placeholder="Type your message here..."
            style={{
              ...fonts.medium,
              minHeight: 100,
              paddingTop: 0,
              flex: 1,
              color: colors.text,
            }}
            multiline
            textAlignVertical="top"
            value={formik.values.message}
            onChangeText={formik.handleChange('message')}
          />
        </View>

        <PrimaryButton
          title="Send Message"
          onPress={handleSend}
          loading={isLoading}
          disabled={isLoading}
        />
      </View>

      {/* Success Bottom Sheet */}
      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['10%']}>
        <SuccessImage />
        <AppText
          variant="subheading"
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          Message Sent Successfully!
        </AppText>
        <PrimaryButton title={'Okay'} onPress={handleOkay} />
      </GlobalBottomSheet>
    </SafeAreaView>
  );
};

export default Support;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    inputView: {
      padding: 10,
      backgroundColor: colors.card,
      borderRadius: 6,
      borderColor: colors.inputBorder,
      borderWidth: 1,
      flexDirection: 'row',
      gap: 12,
      marginBottom: spacing.padding,
    },
  });
