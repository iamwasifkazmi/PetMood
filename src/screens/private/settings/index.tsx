import React, { useRef, useState } from 'react';
import { Alert, Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import { requestGalleryPermission } from '../../../services/permission';
import PersonalDetailsTab from './PersonalDetailsTab';
import SecurityTab from './SecurityTab';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { SuccessImage } from '../../../components/views/SuccessImage';
import { useSelector } from 'react-redux';
import { RootState } from '../../../features/store';
import { useUpdateUserProfileMutation } from '../../../features/user/userApiSlice';
import { useChangePasswordMutation } from '../../../features/auth/authApiSlice';
import { showErrMsg } from '../../../utils/flashMessage';

const Settings = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const { user } = useSelector((state: RootState) => state.user);

  const [petImage, setPetImage] = useState<string | null>(null);
  const [email, setEmail] = React.useState(user?.email ?? '');
  const [name, setName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState('');
  const [selectedLocation, setSelectedLocation] = React.useState<
    string | number
  >('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'personal_details' | 'security'>(
    'personal_details',
  );

  const [updateProfile, updateProfileProps] = useUpdateUserProfileMutation();
  const [changePassword, changePasswordProps] = useChangePasswordMutation();

  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  console.log('user', user);
  const isPersonalTab = activeTab === 'personal_details';
  const isSecurityTab = activeTab === 'security';

  const openGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    })
      .then(image => {
        setPetImage(image.path);
      })
      .catch(() => {});
  };

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
  };

  const handleSaveChanges = async () => {
    try {
      if (isPersonalTab) {
        const payload = {
          name,
          number: phone,
          location: selectedLocation?.toString(),
        };
        await updateProfile(payload).unwrap();
        bottomSheetRef?.current?.expand();
      } else if (isSecurityTab) {
        const emailUser = user?.email;
        const payload = {
          email: emailUser ?? '',
          currentPassword,
          newPassword,
          confirmPassword,
        };
        const res = await changePassword(payload).unwrap();
        bottomSheetRef?.current?.expand();
        setConfirmPassword('');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error: any) {
      console.log('Change Password Error:', JSON.stringify(error, null, 2));

      const errMsg =
        error?.data?.detail || // case 1: RTK unwrap format
        error?.data?.data?.detail || // case 2: axiosBaseQuery wrapped error
        error?.message || // fallback
        'Something went wrong. Please try again.';

      showErrMsg(errMsg);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <View style={{ padding: spacing.padding }}>
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 24 }}
        >
          Settings
        </AppText>

        {/* Tabs */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingTop: 0,
          }}
        >
          <TouchableOpacity
            style={{
              ...styles.postTab,
              backgroundColor: isPersonalTab
                ? colors.primary
                : colors.background,
            }}
            onPress={() => setActiveTab('personal_details')}
          >
            <AppText
              fontWeight="bold"
              color={isPersonalTab ? colors.card : colors.caption}
            >
              Personal Details
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              ...styles.postTab,
              backgroundColor: isSecurityTab
                ? colors.primary
                : colors.background,
            }}
            onPress={() => setActiveTab('security')}
          >
            <AppText
              fontWeight="bold"
              color={isSecurityTab ? colors.card : colors.caption}
            >
              Security
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Personal Details */}
        {isPersonalTab && (
          <>
            <View
              style={{
                alignSelf: 'center',
                marginBottom: 16,
                marginTop: 32,
              }}
            >
              <Image
                source={petImage ? { uri: petImage } : images.gallery_rounded}
                style={styles.image}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.cameraPicker}
                onPress={openGallery}
              >
                <Image
                  source={icons.camera}
                  style={{ resizeMode: 'contain', width: 10, height: 10 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            <AppText
              variant="subheading"
              style={{ alignSelf: 'center', marginBottom: 15 }}
            >
              {user?.name}
            </AppText>

            <PersonalDetailsTab
              email={email}
              setEmail={setEmail}
              name={name}
              setName={setName}
              setPhone={setPhone}
              selectedLocation={selectedLocation}
              setSelectedLocation={setSelectedLocation}
            />
          </>
        )}

        {/* Security */}
        {isSecurityTab && (
          <SecurityTab
            currentPassword={currentPassword}
            setCurrentPassword={setCurrentPassword}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
          />
        )}

        {/* Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PrimaryButton
            title="Cancel"
            style={{ width: '47%' }}
            type="outlined"
          />
          <PrimaryButton
            title="Save Changes"
            loading={
              updateProfileProps.isLoading || changePasswordProps.isLoading
            }
            style={{ width: '47%' }}
            onPress={handleSaveChanges}
          />
        </View>
      </View>

      {/* Bottom Sheet */}
      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['10%']}>
        <SuccessImage />
        <AppText
          variant="subheading"
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          {isSecurityTab
            ? 'Password Successfully Changed!'
            : 'Profile Successfully Updated!'}
        </AppText>
        <PrimaryButton title={'Okay'} onPress={handleOkay} />
      </GlobalBottomSheet>
    </View>
  );
};

export default Settings;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    postTab: {
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      width: '46%',
    },
    cameraPicker: {
      width: 30,
      height: 30,
      borderWidth: 5,
      borderColor: colors.card,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 50,
      position: 'absolute',
      bottom: 0,
      right: 0,
    },
    image: {
      resizeMode: 'contain',
      width: 84,
      height: 84,
      overflow: 'hidden',
      borderRadius: 50,
    },
  });
