import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ImagePicker from 'react-native-image-crop-picker';
import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';
import Header from '../../../components/header/Header';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PetListCard from '../../../components/cards/AnimalListCard';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import { WarningImage } from '../../../components/views/SuccessImage';
import EmotionDetectionResults from '../../../components/cards/EmotionDetectionResults';
import RecordingView from './RecordingView';
import RecordingProgressView from './RecordingProgressView';
import AudioPreview from './AudioPreview';
import {
  useGetScanHistoryQuery,
  useScanPetMutation,
} from '../../../features/scanning/scanningApiSlice';
import { getStaticFeatureFlag } from 'react-native-worklets';
import { useGetAllProfilesQuery } from '../../../features/pet/petApiSlice';
import { showErrMsg } from '../../../utils/flashMessage';

const Scanner = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  // 🧩 RTK Query Mutation
  const [createScan, { isLoading: isUploading, error: createScanError }] =
    useScanPetMutation();

  // State
  const [isRecordingView, setIsRecordingView] = useState(false);
  const [isVoiceCreated, setIsVoiceCreated] = useState(false);
  const [isStartAudioRecording, setIsStartAudioRecording] = useState(false);
  const [isStartVideoRecording, setIsStartVideoRecording] = useState(false);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
  const [petImage, setPetImage] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const { data: scanHistory, error } = useGetScanHistoryQuery();
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const { data, refetch, isFetching } = useGetAllProfilesQuery();
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [scanResult, setScanResult] = useState<CreateScanRes>(
    {} as CreateScanRes,
  );
  const handleUploadScan = async (
    fileUri: string,
    mediaType: 'audio' | 'video' | 'image',
  ) => {
    try {
      console.log('⬆️ Uploading scan:', fileUri);
      const response = await createScan({
        petId: selectedPet,
        mediaType,
        file: {
          uri: fileUri,
          type:
            mediaType === 'audio'
              ? 'audio/m4a'
              : mediaType === 'video'
              ? 'video/mp4'
              : 'image/jpeg',
          name:
            mediaType === 'audio'
              ? 'pet_audio.m4a'
              : mediaType === 'video'
              ? 'pet_video.mp4'
              : 'pet_image.jpg',
        },
      }).unwrap();
      setScanResult(response);
      console.log('✅ Scan uploaded successfully:', response);
    } catch (error: any) {
      console.log('❌ Upload failed:', error);
      if (error?.status === 403) {
        return;
      }
      Alert.alert(
        'Upload Failed',
        'Unable to upload the scan. Please try again.',
      );
    }
  };

  // 🎬 Generic handling
  const handleRecordingDone = () => {
    setIsAnalyzingMedia(true);
    bottomSheetRef.current?.expand();

    setTimeout(() => {
      setIsAnalyzingMedia(false);
    }, 2000);
  };

  const handleOkay = () => {
    setIsVoiceCreated(true);
    setIsRecordingView(false);
    setIsAnalyzingMedia(false);
    bottomSheetRef.current?.close();
  };

  const handleShowRecording = () => {
    if (!selectedPet) {
      showErrMsg('Please select a pet to upload the scan.');
      return;
    }
    setIsRecordingView(true);
  };

  const handleBackPress = () => {
    setIsRecordingView(false);
    setPetImage(null);
    setIsStartAudioRecording(false);
    setIsStartVideoRecording(false);
    setIsVoiceCreated(false);
    bottomSheetRef.current?.close();
  };

  // 🎥 Video
  const handleStartVideoRecording = async () => {
    try {
      const video = await ImagePicker.openCamera({ mediaType: 'video' });
      console.log('🎥 Video recorded:', video.path);
      handleRecordingDone();

      // Upload to backend
      await handleUploadScan(video.path, 'video');
    } catch (error) {
      console.log('❌ Video error:', error);
    }
  };

  // 📸 Picture
  const handleTakePicture = async () => {
    try {
      const image = await ImagePicker.openCamera({
        width: 800,
        height: 800,
        cropping: true,
        mediaType: 'photo',
      });
      console.log('📸 Image captured:', image.path);
      setPetImage(image.path);
      handleRecordingDone();

      // Upload to backend
      await handleUploadScan(image.path, 'image');
    } catch (error) {
      console.log('❌ Image error:', error);
    }
  };

  // 🎛️ Choose camera option
  const handleSelectCameraOption = () => {
    Alert.alert(
      'Choose Option',
      'Would you like to record a video or take a picture?',
      [
        { text: 'Record Video', onPress: handleStartVideoRecording },
        { text: 'Take Picture', onPress: handleTakePicture },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <Header />

      <View style={{ flex: 1, padding: spacing.md, paddingBottom: 0 }}>
        {/* 🔹 Header with Back */}
        <View style={styles.headingView}>
          {(isRecordingView || isVoiceCreated) && (
            <Pressable onPress={handleBackPress}>
              <AntDesign name="arrowleft" size={24} color={colors.text} />
            </Pressable>
          )}
          <AppText variant="subheading">
            {isRecordingView
              ? `Record ${
                  isStartAudioRecording
                    ? 'Audio'
                    : isStartVideoRecording
                    ? 'Video'
                    : 'Your Pet'
                }`
              : `Emotion ${isVoiceCreated ? 'Result' : 'Detection'}`}
          </AppText>
        </View>

        {/* 🔹 Main Content */}
        <View style={{ flex: 1 }}>
          {isRecordingView &&
            (isStartAudioRecording || isStartVideoRecording ? (
              <RecordingProgressView
                style={{ flex: 1 }}
                onStartRecord={() => setIsStartAudioRecording(true)}
                onStopRecord={async path => {
                  console.log('🎙️ Audio saved at:', path);
                  handleRecordingDone();
                  setIsStartAudioRecording(false);
                  setAudioPath(path);

                  // Upload to backend
                  await handleUploadScan(path, 'audio');
                }}
                onPlay={() => console.log('Playing back audio')}
              />
            ) : (
              <RecordingView
                style={{ flex: 1 }}
                onStartAudioRecording={() => setIsStartAudioRecording(true)}
                onSelectCameraOption={handleSelectCameraOption}
              />
            ))}

          {!isRecordingView && !isVoiceCreated && (
            <PetListCard
              onPressItem={() => {}}
              ANIMAL_DATA={data || []}
              refetch={refetch}
              isFetching={isFetching}
              selectable
              selectedPetId={selectedPet}
              onSelectPet={pet => setSelectedPet(pet?.id)}
            />
          )}

          {audioPath && isVoiceCreated && !isRecordingView && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <AudioPreview
                audioPath={audioPath || scanResult?.mediaUrl}
                duration={30000}
              />
              <EmotionDetectionResults
                onSave={() => {}}
                onRetake={() => {
                  setIsVoiceCreated(false);
                  setIsRecordingView(true);
                }}
                petScanResult={scanResult}
              />
            </ScrollView>
          )}
        </View>
      </View>

      {isUploading && (
        <View style={{ position: 'absolute', top: '50%', left: 0, right: 0 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ textAlign: 'center', color: colors.text }}>
            Uploading Scan...
          </AppText>
        </View>
      )}

      {!isRecordingView && !isVoiceCreated && (
        <PrimaryButton
          onPress={handleShowRecording}
          title="Start Scan"
          style={{
            width: '90%',
            position: 'absolute',
            bottom: 20,
            alignSelf: 'center',
          }}
        />
      )}

      {/* 🔹 Bottom Sheet */}
      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['10%']}>
        {isAnalyzingMedia ? (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <AppText
              variant="heading"
              style={{ textAlign: 'center', marginVertical: 20 }}
            >
              Analyzing Your Pet's Mood...
            </AppText>
          </>
        ) : (
          <>
            <WarningImage />
            <AppText variant="subheading" style={{ textAlign: 'center' }}>
              Are you sure you want to cancel this recording?
            </AppText>
            <AppText style={{ textAlign: 'center', marginBottom: 20 }}>
              Once canceled, this cannot be reverted.
            </AppText>
            <PrimaryButton
              title="Confirm"
              onPress={handleOkay}
              style={{ marginBottom: 16 }}
            />
            <PrimaryButton
              type="outlined"
              title="Cancel"
              onPress={handleOkay}
            />
          </>
        )}
      </GlobalBottomSheet>
    </View>
  );
};

export default Scanner;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    headingView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: 16,
    },
  });
