import moment from 'moment';
import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
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
import CardView from '../../../components/cards/CardView';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import Dropdown from '../../../components/Dropdown';
import DatePicker from '../../../components/DatePicker';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import {
  SuccessImage,
  WarningImage,
} from '../../../components/views/SuccessImage';
import {
  GENDER_OPTIONS,
  SPECIES_OPTIONS,
  getBreedOptionsForSpecies,
} from '../../../constants/petOptions';
import {
  useCreatePetMutation,
  useDeletePetProfileMutation,
  useGetAllProfilesQuery,
  useUpdatePetProfileMutation,
} from '../../../features/pet/petApiSlice';
import { useTheme } from '../../../hooks/useTheme';
import { useSubscription } from '../../../hooks/useSubscription';
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
import {
  getApiErrorCode,
  getApiErrorDetail,
  profilesUsageLabel,
} from '../../../utils/subscriptionQuotas';
import { navigateToSubscription } from '../../../utils/navigateToSubscription';

const Home = ({ navigation }: HomeProps) => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const { quotas, canAddPet, refetchStatus } = useSubscription();

  const [selectedGender, setSelectedGender] = useState<string>('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  const [selectedBreed, setSelectedBreed] = useState<string>('');
  const [dob, setDob] = useState<Date | null>(null);
  const [isProfileCreated, setIsProfileCreated] = useState<boolean>(false);
  const [showPetDetails, setShowPetDetails] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | number>();
  const [petImage, setPetImage] = useState<string | null>(null);
  const [petName, setPetName] = useState<string>('');
  const [petDetails, setPetDetails] = useState<any>(null);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const dispatch = useDispatch();
  const { data, refetch, isFetching } = useGetAllProfilesQuery(
    searchQuery ? { search: searchQuery } : undefined
  );
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

  const breedOptions = useMemo(
    () => getBreedOptionsForSpecies(selectedSpecies, selectedBreed),
    [selectedSpecies, selectedBreed],
  );

  const handleSpeciesChange = (value: string | number) => {
    setSelectedSpecies(String(value));
    setSelectedBreed('');
  };

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

  const handleDateChange = (selectedDate: Date) => {
    setDob(selectedDate);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Pet Date of Birth';
    return moment(date).format('DD MMM YYYY');
  };

  // ✅ Create/Update Pet API call
  const handleCreateProfile = async () => {
    if (!isProfileCreated) {
      if (!canAddPet) {
        const detail =
          quotas?.tier === 'none'
            ? 'You can only create one pet profile without a subscription. Please subscribe to add more profiles.'
            : 'Profile limit reached for your subscription. Please upgrade to add more pets.';
        Alert.alert('Profile limit', detail, [
          { text: 'Not now', style: 'cancel' },
          {
            text: 'Subscribe',
            onPress: () => navigateToSubscription(navigation as any),
          },
        ]);
        return;
      }
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

    try {
      if (isEdit && selectedId) {
        // Update: Use FormData for update
        const formData = new FormData();
        formData.append('name', petName.trim());
        formData.append('gender', String(selectedGender));
        formData.append('species', String(selectedSpecies));
        formData.append('breed', String(selectedBreed));
        formData.append('dateOfBirth', moment(dob).format('YYYY-MM-DD'));

        if (petImage && !petImage.startsWith('http')) {
          // Only append if it's a local file path, not a URL
          formData.append('photoUrl', {
            uri: petImage.startsWith('file://')
              ? petImage
              : `file://${petImage}`,
            type: 'image/jpeg',
            name: `pet_${Date.now()}.jpg`,
          } as any);
        }

        const res = await updatePetProfile({
          id: String(selectedId),
          formData: formData,
        }).unwrap();
        showMessage({
          message: 'Pet profile updated successfully!',
          type: 'success',
        });
        setIsEdit(false);
        setShowPetDetails(true);
        refetch(); // Refresh the list
      } else {
        // Create: Use FormData for create
        const formData = new FormData();
        formData.append('name', petName.trim());
        formData.append('gender', selectedGender);
        formData.append('species', selectedSpecies);
        formData.append('breed', selectedBreed);
        formData.append('dateOfBirth', moment(dob).format('YYYY-MM-DD'));

        if (petImage && !petImage.startsWith('http')) {
          // Only append if it's a local file path, not a URL
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
        void refetchStatus();
      }
    } catch (err: any) {
      console.log('❌ Failed to create/update pet profile:', err);
      const code = getApiErrorCode(err);
      const detail = getApiErrorDetail(err);
      if (err?.status === 403 && code === 'profile_limit_reached') {
        Alert.alert(
          'Profile limit',
          detail ||
            'Profile limit reached for your subscription. Please subscribe to add more pets.',
          [
            { text: 'Not now', style: 'cancel' },
            {
              text: 'Subscribe',
              onPress: () => navigateToSubscription(navigation as any),
            },
          ],
        );
        return;
      }
      showMessage({
        message: isEdit
          ? 'Failed to update pet profile'
          : 'Failed to create pet profile',
        description: detail || err?.data?.message || 'Please try again',
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

            <Dropdown
              options={GENDER_OPTIONS}
              selectedValue={selectedGender}
              onValueChange={value => setSelectedGender(String(value))}
              placeholder="Select Pet Gender"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.pin_up}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Dropdown
              options={SPECIES_OPTIONS}
              selectedValue={selectedSpecies}
              onValueChange={handleSpeciesChange}
              placeholder="Select Pet Species"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <Dropdown
              options={breedOptions}
              selectedValue={selectedBreed}
              onValueChange={value => setSelectedBreed(String(value))}
              placeholder={
                selectedSpecies ? 'Select Pet Breed' : 'Select species first'
              }
              searchable
              searchPlaceholder="Search breeds..."
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.paw}
              leftIconStyle={{ tintColor: colors.primary }}
            />

            <DatePicker
              value={dob}
              onDateChange={handleDateChange}
              placeholder="Select Pet Date of Birth"
              containerStyle={styles.dropdownContainer}
              leftIcon={icons.calendar}
              leftIconStyle={{ tintColor: colors.primary }}
              maximumDate={new Date()}
              formatDate={formatDate}
            />
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
                if (!canAddPet) {
                  const detail =
                    quotas?.tier === 'none'
                      ? 'You can only create one pet profile without a subscription. Please subscribe to add more profiles.'
                      : 'Profile limit reached for your subscription. Please upgrade to add more pets.';
                  Alert.alert('Profile limit', detail, [
                    { text: 'Not now', style: 'cancel' },
                    {
                      text: 'Subscribe',
                      onPress: () => navigateToSubscription(navigation as any),
                    },
                  ]);
                  return;
                }
                navigation.navigate(RouteName.Profile, { openAddForm: true });
              }}
              type="outlined"
              title={
                canAddPet
                  ? 'Add New Pet Profile'
                  : 'Subscribe to Add More Pets'
              }
              style={{ backgroundColor: colors.card, marginVertical: 24 }}
            />
            {profilesUsageLabel(quotas) ? (
              <AppText
                size={13}
                color={colors.caption}
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                {profilesUsageLabel(quotas)}
                {quotas?.profilesRemaining != null
                  ? ` · ${quotas.profilesRemaining} remaining`
                  : ''}
              </AppText>
            ) : null}
            
            {/* Search Input */}
            <PrimaryInput
              leftImageSource={icons.search}
              placeholder="Search..."
              containerStyle={{
                borderRadius: 50,
                borderColor: colors.border,
                marginBottom: 16,
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            
            {data && data.length > 0 && (
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
