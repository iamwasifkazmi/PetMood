import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import moment from 'moment';
import React, { useRef, useState } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { showMessage } from 'react-native-flash-message';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PetListCard from '../../../components/cards/AnimalListCard';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import Dropdown from '../../../components/Dropdown';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import {
  SuccessImage,
  WarningImage,
} from '../../../components/views/SuccessImage';
import {
  BREED_OPTIONS,
  GENDER_OPTIONS,
  SPECIES_OPTIONS,
} from '../../../constants/petOptions';
import {
  useCreatePetMutation,
  useDeletePetProfileMutation,
  useGetAllProfilesQuery,
  useUpdatePetProfileMutation,
} from '../../../features/pet/petApiSlice';
import { useTheme } from '../../../hooks/useTheme';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from '../../../services/permission';
import { formatDate } from '../../../utils/formatTime';
import PetDetails from './PetDetails';

const Profile = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  const [selectedGender, setSelectedGender] = useState<string | number>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string | number>('');
  const [selectedBreed, setSelectedBreed] = useState<string | number>('');
  const [dob, setDob] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [petName, setPetName] = useState<string>('');
  const [isProfileCreated, setIsProfileCreated] = useState<boolean>(false);
  const [showPetDetails, setShowPetDetails] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | number>();
  const [isPetAdded, setIsPetAdd] = useState<boolean>(false);
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [petImage, setPetImage] = useState<string | null>(null);
  const [petDetails, setPetDetails] = useState<any>(null);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const { data, refetch, isFetching } = useGetAllProfilesQuery();
  const [createPetProfile, { isLoading }] = useCreatePetMutation();
  const [updatePetProfile, { isLoading: isUpdating }] =
    useUpdatePetProfileMutation();
  const [deletePetProfile, { isLoading: isDeleting }] =
    useDeletePetProfileMutation();

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
    setShowPetDetails(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePetProfile({ id: selectedId ?? '' }).unwrap();
      bottomSheetRef?.current?.close();
    } catch (error) {
      console.log('Failed to delete pet:', error);
    } finally {
      setIsProfileCreated(false);
      setPetImage(null);
      setShowPetDetails(false);
    }
  };

  const resetForm = () => {
    setPetName('');
    setSelectedGender('');
    setSelectedSpecies('');
    setSelectedBreed('');
    setDob(null);
    setPetImage(null);
    setIsProfileCreated(false);
  };

  const handleCreateProfile = async () => {
    // if (!isProfileCreated) {
    //   setIsProfileCreated(true);
    //   return;
    // }

    if (
      !petName ||
      !selectedGender ||
      !selectedSpecies ||
      !selectedBreed ||
      !dob
    ) {
      showMessage({
        message: 'Please fill all required fields.',
        type: 'danger',
      });
      return;
    }

    const payload = {
      name: petName.trim(),
      gender: String(selectedGender),
      species: String(selectedSpecies),
      breed: String(selectedBreed),
      dateOfBirth: moment(dob).format('YYYY-MM-DD'),
    };

    try {
      if (isEdit && selectedId) {
        const res = await updatePetProfile({
          id: String(selectedId),
          ...payload,
        }).unwrap();
        console.log('res', res);
        showMessage({
          message: 'Pet profile updated successfully!',
          type: 'success',
        });
        setIsEdit(false);
        setShowPetDetails(true);
      } else {
        await createPetProfile(payload).unwrap();
        console.log('callled');
        bottomSheetRef?.current?.expand();
        resetForm();
      }
    } catch (err: any) {
      showMessage({
        message: isEdit
          ? 'Failed to update pet profile'
          : 'Failed to create pet profile',
        description: err?.data?.message || 'Please try again',
        type: 'danger',
      });
    } finally {
      setIsProfileCreated(false);
      setPetImage(null);
      setShowPetDetails(false);
      setIsDeleteConfirmVisible(false);
    }
  };

  const handleBackPress = () => {
    setIsProfileCreated(false);
    setPetImage(null);
    setShowPetDetails(false);
  };

  const openGallery = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
      });
      setPetImage(image.path);
    } catch (e) {}
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      const image = await ImagePicker.openCamera({
        width: 300,
        height: 300,
        cropping: true,
      });
      setPetImage(image.path);
    } catch (e) {}
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDate) {
      setDob(selectedDate);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Header />
      <View style={{ padding: spacing.padding, flex: 1, paddingBottom: 0 }}>
        <View style={styles.headingView}>
          {(isProfileCreated || showPetDetails) && (
            <Pressable onPress={handleBackPress}>
              <AntDesign name="arrowleft" size={24} color="black" />
            </Pressable>
          )}
          <AppText variant="subheading">
            {isProfileCreated
              ? `${isEdit ? 'Edit' : 'Add'} Pet Profile`
              : 'Pet Profiles'}
          </AppText>
        </View>

        {isProfileCreated && !showPetDetails ? (
          <>
            <View style={{ alignSelf: 'center', marginBottom: 20 }}>
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
                />
              </TouchableOpacity>
            </View>

            <PrimaryInput
              placeholder="Pet Name"
              leftImageSource={icons.dog_icon2}
              containerStyle={{ marginBottom: 15 }}
              value={petName}
              onChangeText={setPetName}
            />

            <Dropdown
              options={GENDER_OPTIONS}
              selectedValue={selectedGender}
              onValueChange={setSelectedGender}
              placeholder="Select Pet Gender"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.pin_up}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Dropdown
              options={SPECIES_OPTIONS}
              selectedValue={selectedSpecies}
              onValueChange={setSelectedSpecies}
              placeholder="Select Pet Species"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Dropdown
              options={BREED_OPTIONS}
              selectedValue={selectedBreed}
              onValueChange={setSelectedBreed}
              placeholder="Select Pet Breed"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={styles.datePickerContainer}
            >
              <Image
                source={icons.calendar}
                style={{
                  width: 18,
                  height: 18,
                  tintColor: colors.primary,
                  marginRight: 8,
                }}
              />
              <AppText
                style={{ color: dob ? colors.text : colors.placeholder }}
              >
                {formatDate(dob)}
              </AppText>
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={dob || new Date()}
                mode="date"
                themeVariant="light"
                display="spinner"
                maximumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </>
        ) : showPetDetails ? (
          <PetDetails
            containerStyle={{ marginVertical: 24 }}
            onDelete={() => {
              bottomSheetRef?.current?.expand();
              setIsDeleteConfirmVisible(true);
              setSelectedId(petDetails?.id);
            }}
            onEdit={() => {
              setIsEdit(true);
              setShowPetDetails(false);
              setIsProfileCreated(true);
              setSelectedId(petDetails?.id);
              setPetName(petDetails?.name || '');
              setSelectedGender(petDetails?.gender || '');
              setSelectedSpecies(petDetails?.species || '');
              setSelectedBreed(petDetails?.breed || '');
              setDob(
                petDetails?.dateOfBirth
                  ? new Date(petDetails.dateOfBirth)
                  : null,
              );
              setPetImage(petDetails?.image || null);
            }}
            petDetails={petDetails}
          />
        ) : (
          <>
            <PrimaryInput
              leftImageSource={icons.search}
              placeholder="Search..."
              containerStyle={{
                borderRadius: 50,
                borderColor: colors.border,
              }}
            />
            <PrimaryButton
              onPress={() => {
                setIsProfileCreated(true), setIsDeleteConfirmVisible(false);
                setIsEdit(false);
                // resetForm();
              }}
              type="outlined"
              title="Add New Pet Profile"
              style={{ backgroundColor: colors.card, marginVertical: 24 }}
            />
            <PetListCard
              onPressItem={() => {
                setShowPetDetails(true);
                setIsProfileCreated(false);
              }}
              ANIMAL_DATA={data || []}
              setPetDetails={setPetDetails}
              refetch={refetch}
              isFetching={isFetching}
            />
          </>
        )}

        {isProfileCreated && !showPetDetails && (
          <PrimaryButton
            onPress={handleCreateProfile}
            title={
              isEdit
                ? 'Update Pet Profile'
                : isProfileCreated
                ? 'Confirm'
                : 'Create Pet Profile'
            }
            style={{ width: '100%', marginBottom: isProfileCreated ? 5 : 46 }}
            loading={isLoading || isUpdating}
            disabled={isLoading || isUpdating}
          />
        )}
      </View>

      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['10%']}>
        {isDeleteConfirmVisible ? <WarningImage /> : <SuccessImage />}
        <AppText
          variant="subheading"
          style={{ textAlign: 'center', marginBottom: 24 }}
        >
          {isDeleteConfirmVisible
            ? `Are you sure you want to \n delete this Pet Profile?`
            : `Pet Profile  \n Succesfully Added!`}
        </AppText>
        <PrimaryButton
          loading={isDeleting}
          title="Okay"
          onPress={isDeleteConfirmVisible ? handleConfirmDelete : handleOkay}
        />
      </GlobalBottomSheet>
    </SafeAreaView>
  );
};

export default Profile;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    dropdownContainer: {
      marginBottom: 20,
    },
    datePickerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      height: 50,
      borderColor: colors.inputBorder,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderRadius: 10,
      marginBottom: 20,
    },
    headingView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: 16,
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
