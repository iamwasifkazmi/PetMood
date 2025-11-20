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
import Modal from 'react-native-modal';
import { showMessage } from 'react-native-flash-message';
import ImagePicker from 'react-native-image-crop-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import AntDesign from 'react-native-vector-icons/AntDesign';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import CardView from '../../../components/cards/CardView';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import CustomDropdown from '../../../components/views/dropdown';
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
import { HomeProps, RouteName } from '../../../navigation/types';
import {
  requestCameraPermission,
  requestGalleryPermission,
} from '../../../services/permission';
import EmptyView from './EmptyView';
import PetListCard from '../../../components/cards/AnimalListCard';
import { useGetUserDataQuery } from '../../../features/user/userApiSlice';
import { useDispatch } from 'react-redux';
import { setUser } from '../../../features/user/userSlice';
import PetDetails from '../profile/PetDetails';

const Home = ({ navigation }: HomeProps) => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [dob, setDob] = useState<Date | null>(null);
  const [isDateModalVisible, setIsDateModalVisible] = useState(false);
  const [isProfileCreated, setIsProfileCreated] = useState<boolean>(false);
  const [showPetDetails, setShowPetDetails] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | number>();
  const [petImage, setPetImage] = useState<string | null>(null);
  const [petName, setPetName] = useState<string>('');
  const [petDetails, setPetDetails] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);

  const dispatch = useDispatch();
  const { data, refetch, isFetching } = useGetAllProfilesQuery();
  const { data: userData } = useGetUserDataQuery();

  React.useEffect(() => {
    dispatch(setUser(userData ?? null));
  }, [userData]);

  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [createPetProfile, { isLoading }] = useCreatePetMutation();
  const [updatePetProfile, { isLoading: isUpdating }] =
    useUpdatePetProfileMutation();
  const [deletePetProfile, { isLoading: isDeleting }] =
    useDeletePetProfileMutation();

  const handleOkay = () => {
    bottomSheetRef?.current?.close();
    setIsProfileCreated(false);
    setShowPetDetails(false);
    resetForm();
  };

  const handleConfirmDelete = async () => {
    try {
      await deletePetProfile({ id: selectedId ?? '' }).unwrap();
      bottomSheetRef?.current?.close();
      refetch(); // Refresh the list after deletion
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
    setIsEdit(false);
  };

  const handleBackPress = () => {
    if (showPetDetails) {
      setShowPetDetails(false);
      setPetDetails(null);
    } else {
      setIsProfileCreated(false);
      setPetImage(null);
      resetForm();
    }
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
    if (event.type === 'set' && selectedDate) {
      setDob(selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Pet Date of Birth';
    return moment(date).format('DD MMM YYYY');
  };

  // ✅ Create/Update Pet API call
  const handleCreateProfile = async () => {
    if (!isProfileCreated) {
      setIsProfileCreated(true);
      return;
    }

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
        showMessage({
          message: 'Pet profile updated successfully!',
          type: 'success',
        });
        setIsEdit(false);
        setShowPetDetails(true);
        refetch(); // Refresh the list
      } else {
        const formData = new FormData();
        formData.append('name', petName.trim());
        formData.append('gender', selectedGender);
        formData.append('species', selectedSpecies);
        formData.append('breed', selectedBreed);
        formData.append('dateOfBirth', moment(dob).format('YYYY-MM-DD'));

        if (petImage) {
          formData.append('photoUrl', {
            uri: petImage.startsWith('file://')
              ? petImage
              : `file://${petImage}`,
            type: 'image/jpeg',
            name: `pet_${Date.now()}.jpg`,
          } as any);
        }

        await createPetProfile(formData).unwrap();
        bottomSheetRef?.current?.expand();
        resetForm();
        refetch(); // Refresh the list
      }
    } catch (err: any) {
      console.log('❌ Failed to create/update pet profile:', err);
      showMessage({
        message: isEdit
          ? 'Failed to update pet profile'
          : 'Failed to create pet profile',
        description: err?.data?.message || 'Please try again',
        type: 'danger',
      });
    }
  };

  const handleEditPet = () => {
    setIsEdit(true);
    setShowPetDetails(false);
    setIsProfileCreated(true);
    setSelectedId(petDetails?.id);
    setPetName(petDetails?.name || '');
    setSelectedGender(petDetails?.gender || '');
    setSelectedSpecies(petDetails?.species || '');
    setSelectedBreed(petDetails?.breed || '');
    setDob(petDetails?.dateOfBirth ? new Date(petDetails.dateOfBirth) : null);
    setPetImage(petDetails?.image || null);
  };

  const handleDeletePet = () => {
    bottomSheetRef?.current?.expand();
    setIsDeleteConfirmVisible(true);
    setSelectedId(petDetails?.id);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Header />
      <View style={{ padding: spacing.padding, flex: 1 }}>
        <View style={styles.headingView}>
          {(isProfileCreated || showPetDetails) && (
            <Pressable onPress={handleBackPress}>
              <AntDesign name="arrowleft" size={24} color="black" />
            </Pressable>
          )}
          <AppText variant="subheading">
            {showPetDetails
              ? 'Pet Details'
              : isProfileCreated
              ? `${isEdit ? 'Edit' : 'Add'} Pet Profile`
              : 'Home'}
          </AppText>
        </View>

        {showPetDetails ? (
          <PetDetails
            containerStyle={{ marginVertical: 24 }}
            petDetails={petDetails}
          />
        ) : isProfileCreated ? (
          <CardView>
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

            <CustomDropdown
              options={GENDER_OPTIONS}
              selectedValue={selectedGender}
              onValueChange={value => setSelectedGender(String(value))}
              placeholder="Select Pet Gender"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.pin_up}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <CustomDropdown
              options={SPECIES_OPTIONS}
              selectedValue={selectedSpecies}
              onValueChange={value => setSelectedSpecies(String(value))}
              placeholder="Select Pet Species"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <CustomDropdown
              options={BREED_OPTIONS}
              selectedValue={selectedBreed}
              onValueChange={value => setSelectedBreed(String(value))}
              placeholder="Select Pet Breed"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Pressable
              onPress={() => setIsDateModalVisible(true)}
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

            <Modal
              isVisible={isDateModalVisible}
              onBackdropPress={() => setIsDateModalVisible(false)}
              onBackButtonPress={() => setIsDateModalVisible(false)}
              backdropOpacity={0.5}
              style={{ justifyContent: 'flex-end', margin: 0 }}
            >
              <View
                style={{
                  backgroundColor: colors.card,
                  padding: 16,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                }}
              >
                <AppText
                  variant="subheading"
                  style={{ textAlign: 'center', marginBottom: 10 }}
                >
                  Select Date of Birth
                </AppText>

                <DateTimePicker
                  value={dob || new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={handleDateChange}
                />

                <PrimaryButton
                  title="Confirm"
                  onPress={() => setIsDateModalVisible(false)}
                  style={{ marginTop: 10 }}
                />
              </View>
            </Modal>
          </CardView>
        ) : (
          data?.length === 0 && (
            <CardView>
              <EmptyView />
            </CardView>
          )
        )}

        {isProfileCreated && !showPetDetails && (
          <PrimaryButton
            onPress={handleCreateProfile}
            title={isEdit ? 'Update Pet Profile' : 'Confirm'}
            style={{
              width: '100%',
              marginBottom: 5,
              marginTop: 20,
            }}
            loading={isLoading || isUpdating}
            disabled={isLoading || isUpdating}
          />
        )}

        {!isProfileCreated && !showPetDetails && (
          <>
            <PrimaryButton
              onPress={() => {
                navigation.navigate(RouteName.Profile);
              }}
              type="outlined"
              title="Add New Pet Profile"
              style={{ backgroundColor: colors.card, marginVertical: 24 }}
            />
            {data && data.length > 0 && (
              <PetListCard
                onPressItem={(pet: createPetRes) => {
                  setShowPetDetails(true);
                  setPetDetails(pet);
                  setIsProfileCreated(false);
                }}
                ANIMAL_DATA={data || []}
                setPetDetails={setPetDetails}
                refetch={refetch}
                isFetching={isFetching}
              />
            )}
          </>
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
            : `Pet Profile  \n Successfully ${isEdit ? 'Updated' : 'Added'}!`}
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

export default Home;

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
