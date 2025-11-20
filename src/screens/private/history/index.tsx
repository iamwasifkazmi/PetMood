import React, { useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PetListCard from '../../../components/cards/AnimalListCard';
import EmotionDetectionResults from '../../../components/cards/EmotionDetectionResults';
import Header from '../../../components/header/Header';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import AppText from '../../../components/Text/AppText';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { WarningImage } from '../../../components/views/SuccessImage';
import { useGetPetHistoryQuery } from '../../../features/pet/petApiSlice';
import { useDeletePetHistoryMutation } from '../../../features/scanning/scanningApiSlice';
import { useTheme } from '../../../hooks/useTheme';
import { HistoryProps } from '../../../navigation/types';

const History = ({ navigation }: HistoryProps) => {
  const { colors, fonts, spacing } = useTheme();
  const [showEmotionResult, setShowEmotionResult] = useState<boolean>(false);
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [petDetails, setPetDetails] = useState<any>(null);
  const [petId, setPetId] = useState<string>('');
  const { data: petHistory } = useGetPetHistoryQuery(
    { petId },
    { refetchOnMountOrArgChange: true, refetchOnReconnect: true },
  );
  const [deletePetHistory, { isLoading: isDeletingPetHistory }] =
    useDeletePetHistoryMutation();
  const styles = useStyles(colors, spacing);
  const handleBackPress = () => {
    setShowEmotionResult(false);
  };
  const handleShowEmotions = () => {
    setShowEmotionResult(true);
  };

  const handleAction = async (action: 'confirm' | 'cancel') => {
    if (action === 'confirm') {
      await deletePetHistory({ id: petDetails?.id }).unwrap();
      setShowEmotionResult(false);
      bottomSheetRef?.current?.close();
    }
  };
  console.log('petHistory', petHistory);
  return (
    <View style={{ flex: 1 }}>
      <Header />
      <View style={{ padding: spacing.md, flex: 1, paddingBottom: 0 }}>
        <View style={styles.headingView}>
          {showEmotionResult && (
            <Pressable onPress={handleBackPress}>
              <AntDesign name="arrowleft" size={24} color="black" />
            </Pressable>
          )}
          <AppText variant="subheading">
            {showEmotionResult ? 'Emotion Result' : 'History'}
          </AppText>
        </View>
        {!showEmotionResult && (
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
              renderLeft={() => (
                <Image
                  source={icons.calendar2}
                  style={{
                    width: 18,
                    height: 18,
                    resizeMode: 'contain',
                    marginRight: 6,
                  }}
                />
              )}
              onPress={() => {}}
              type="outlined"
              title="Select Date Range"
              style={{ backgroundColor: colors.card, marginVertical: 24 }}
            />
          </>
        )}
        {showEmotionResult ? (
          <EmotionDetectionResults
            isHistoryScreen
            petScanResult={petDetails}
            onSave={() => {}}
            onRetake={() => {
              bottomSheetRef?.current?.expand();
            }}
            deleteButtonTitle="Delete"
          />
        ) : (
          <PetListCard
            showEmotions
            ANIMAL_DATA={petHistory || []}
            onPressItem={handleShowEmotions}
            setPetDetails={setPetDetails}
          />
        )}
        <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['10%']}>
          <WarningImage />
          <AppText
            variant="subheading"
            style={{ textAlign: 'center', marginBottom: 16 }}
          >
            {'Are you sure you want to  \n delete this result?'}
          </AppText>
          <AppText style={{ textAlign: 'center', marginBottom: 20 }}>
            Once deleted this cannot be reverted.
          </AppText>

          <PrimaryButton
            title={'confirm'}
            loading={isDeletingPetHistory}
            onPress={() => {
              handleAction('confirm');
            }}
          />
          <PrimaryButton
            style={{ marginTop: 16 }}
            type="outlined"
            title={'Cancel'}
            onPress={() => {
              handleAction('cancel');
              bottomSheetRef?.current?.close();
              setShowEmotionResult(false);
            }}
          />
        </GlobalBottomSheet>
      </View>
    </View>
  );
};

export default History;
const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    dropdownContainer: {
      marginBottom: 20,
    },
    headingView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: 16,
    },
    imagePickerRow: {
      flexDirection: 'row',
      marginBottom: 15,
    },
    petImage: {
      width: '100%',
      height: 180,
      borderRadius: 12,
      marginBottom: 20,
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
