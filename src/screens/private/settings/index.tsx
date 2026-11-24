import React, { useRef, useState } from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useNavigation } from '@react-navigation/native';
import { ValidationError } from 'yup';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import Header from '../../../components/header/Header';
import { useTheme } from '../../../hooks/useTheme';
import PersonalDetailsTab from './PersonalDetailsTab';
import SecurityTab, { SecurityFieldErrors } from './SecurityTab';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { SuccessImage } from '../../../components/views/SuccessImage';
import { useSelector } from 'react-redux';
import { RootState } from '../../../features/store';
import { useUpdateUserProfileMutation } from '../../../features/user/userApiSlice';
import { useChangePasswordMutation } from '../../../features/auth/authApiSlice';
import {
  changePasswordSchema,
  getApiErrorMessage,
  SAVE_CHANGES_ERROR,
} from '../../../utils/validations';

const Settings = () => {
  const navigation = useNavigation();
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const { user } = useSelector((state: RootState) => state.user);

  const [petImage, setPetImage] = useState<string | null>(null);
  const [email, setEmail] = React.useState((user?.email ?? '').toLowerCase());
  const [name, setName] = React.useState(user?.name ?? '');
  const [phone, setPhone] = React.useState(user?.number ?? '');
  const [selectedLocation, setSelectedLocation] = React.useState<string>(
    (user as any)?.location ?? '',
  );

  // Sync with user state changes (including photoUrl updates)
  React.useEffect(() => {
    if (user?.email) setEmail(user.email.toLowerCase());
    if (user?.name) setName(user.name);
    if (user?.number) setPhone(user.number);
    if ((user as any)?.location) setSelectedLocation((user as any).location);
  }, [user?.email, user?.name, user?.number, (user as any)?.location]);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityErrors, setSecurityErrors] = useState<SecurityFieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'personal_details' | 'security'>(
    'personal_details',
  );
  const scrollRef = useRef<KeyboardAwareScrollView>(null);

  const [updateProfile, updateProfileProps] = useUpdateUserProfileMutation();
  const [changePassword, changePasswordProps] = useChangePasswordMutation();

  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const isPersonalTab = activeTab === 'personal_details';
  const isSecurityTab = activeTab === 'security';

  const openGallery = async () => {
    // Android: system Photo Picker — no READ_MEDIA_IMAGES (Play policy)
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
        mediaType: 'photo',
      });
      setPetImage(image.path);
    } catch {
      // user cancelled
    }
  };

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
  };

  const clearSecurityField = (field: keyof SecurityFieldErrors) => {
    setSecurityErrors(prev => ({ ...prev, [field]: undefined }));
    setSaveError(null);
  };

  const scrollLocationIntoView = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd(true);
    }, 280);
  };

  const handleSaveChanges = async () => {
    setSaveError(null);
    try {
      if (isPersonalTab) {
        const hasLocalPhoto = Boolean(petImage && !petImage.startsWith('http'));

        // Text-only updates: JSON (multipart FormData often fails on Android release builds).
        // Photo updates: multipart with file field `photoUrl`.
        if (hasLocalPhoto) {
          const formData = new FormData();
          if (name) {
            formData.append('name', name);
          }
          if (phone) {
            formData.append('number', phone);
          }
          if (selectedLocation) {
            formData.append('location', selectedLocation);
          }
          formData.append('photoUrl', {
            uri: petImage!.startsWith('file://')
              ? petImage!
              : `file://${petImage}`,
            type: 'image/jpeg',
            name: `profile_${Date.now()}.jpg`,
          } as any);
          await updateProfile(formData).unwrap();
        } else {
          const body: {
            name?: string;
            number?: string;
            location?: string;
          } = {};
          if (name.trim()) {
            body.name = name.trim();
          }
          if (phone.trim()) {
            body.number = phone.trim();
          }
          body.location = selectedLocation.trim();
          await updateProfile(body).unwrap();
        }

        // Clear local image state - user state will be updated with new photoUrl from backend
        setPetImage(null);
        bottomSheetRef?.current?.expand();
      } else if (isSecurityTab) {
        try {
          await changePasswordSchema.validate(
            { currentPassword, newPassword, confirmPassword },
            { abortEarly: false },
          );
        } catch (validationError) {
          const next: SecurityFieldErrors = {};
          if (validationError instanceof ValidationError) {
            validationError.inner.forEach(item => {
              if (
                item.path === 'currentPassword' ||
                item.path === 'newPassword' ||
                item.path === 'confirmPassword'
              ) {
                next[item.path] = item.message;
              }
            });
            if (
              !next.currentPassword &&
              !next.newPassword &&
              !next.confirmPassword &&
              validationError.path
            ) {
              const path = validationError.path as keyof SecurityFieldErrors;
              if (
                path === 'currentPassword' ||
                path === 'newPassword' ||
                path === 'confirmPassword'
              ) {
                next[path] = validationError.message;
              }
            }
          }
          setSecurityErrors(next);
          return;
        }

        setSecurityErrors({});
        const emailUser = user?.email?.toLowerCase();
        if (!emailUser) {
          setSaveError(
            'Your account email is missing. Sign out and sign in again, then retry.',
          );
          return;
        }
        await changePassword({
          email: emailUser,
          currentPassword,
          newPassword,
          confirmPassword,
        }).unwrap();
        bottomSheetRef?.current?.expand();
        setConfirmPassword('');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (error: unknown) {
      const detail = getApiErrorMessage(error, SAVE_CHANGES_ERROR);
      const lower = detail.toLowerCase();
      if (
        isSecurityTab &&
        (lower.includes('current password') ||
          lower.includes('incorrect password') ||
          lower.includes('wrong password') ||
          lower.includes('invalid credentials'))
      ) {
        setSecurityErrors({ currentPassword: detail });
        setSaveError(null);
        return;
      }
      setSaveError(detail);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <KeyboardAwareScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.padding, paddingBottom: 160 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid
        enableAutomaticScroll
        extraScrollHeight={120}
        extraHeight={80}
        keyboardOpeningTime={0}
        enableResetScrollToCoords={false}
      >
        <AppText
          variant="heading"
          fontWeight="semiBold"
          style={{ marginBottom: 24 }}
        >
          Settings
        </AppText>

        {saveError ? (
          <View style={styles.saveError}>
            <AppText size={13} color={colors.danger} style={{ flex: 1 }}>
              {saveError}
            </AppText>
            <TouchableOpacity
              onPress={() => void handleSaveChanges()}
              disabled={
                updateProfileProps.isLoading || changePasswordProps.isLoading
              }
              style={styles.retryButton}
            >
              <AppText size={13} color={colors.primary} fontWeight="bold">
                Retry
              </AppText>
            </TouchableOpacity>
          </View>
        ) : null}

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
            onPress={() => {
              setSaveError(null);
              setActiveTab('personal_details');
            }}
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
            onPress={() => {
              setSaveError(null);
              setActiveTab('security');
            }}
          >
            <AppText
              fontWeight="bold"
              color={isSecurityTab ? colors.card : colors.caption}
            >
              Security
            </AppText>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={{ marginTop: 16, marginBottom: 8 }}
          onPress={() => (navigation as any).navigate('AiConsent')}
        >
          <AppText size={14} color={colors.primary} fontWeight="medium">
            AI analysis consent (grant / revoke)
          </AppText>
        </TouchableOpacity>

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
                source={
                  petImage
                    ? { uri: petImage }
                    : user?.photoUrl
                    ? { uri: user.photoUrl }
                    : images.gallery_rounded
                }
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
              setEmail={value => {
                setSaveError(null);
                setEmail(value);
              }}
              name={name}
              setName={value => {
                setSaveError(null);
                setName(value);
              }}
              setPhone={value => {
                setSaveError(null);
                setPhone(value);
              }}
              selectedLocation={selectedLocation}
              setSelectedLocation={value => {
                setSaveError(null);
                setSelectedLocation(value);
              }}
              onLocationFocus={scrollLocationIntoView}
            />
          </>
        )}

        {/* Security */}
        {isSecurityTab && (
          <SecurityTab
            currentPassword={currentPassword}
            setCurrentPassword={value => {
              clearSecurityField('currentPassword');
              setCurrentPassword(value);
            }}
            newPassword={newPassword}
            setNewPassword={value => {
              clearSecurityField('newPassword');
              setNewPassword(value);
            }}
            confirmPassword={confirmPassword}
            setConfirmPassword={value => {
              clearSecurityField('confirmPassword');
              setConfirmPassword(value);
            }}
            errors={securityErrors}
          />
        )}

        {/* Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PrimaryButton
            title="Cancel"
            style={{ width: '47%' }}
            type="outlined"
            onPress={() => {
              (navigation as any).navigate('MainApp', {
                screen: 'Home',
              });
            }}
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
      </KeyboardAwareScrollView>

      {/* Bottom Sheet */}
      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['35%']}>
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
    saveError: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: '#FDECEC',
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 16,
    },
    retryButton: {
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
  });
