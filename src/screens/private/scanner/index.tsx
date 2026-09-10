import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import ImagePicker from 'react-native-image-crop-picker';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';
import Header from '../../../components/header/Header';
import AppText from '../../../components/Text/AppText';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import PetListCard from '../../../components/cards/AnimalListCard';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import EmotionDetectionResults from '../../../components/cards/EmotionDetectionResults';
import RecordingView from './RecordingView';
import RecordingProgressView from './RecordingProgressView';
import AudioPreview from './AudioPreview';
import {
  useGetScanHistoryQuery,
  useScanPetMutation,
} from '../../../features/scanning/scanningApiSlice';
import type { CreateScanRes } from '../../../features/scanning/types';
import { useGetAllProfilesQuery } from '../../../features/pet/petApiSlice';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';
import { useSubscription } from '../../../hooks/useSubscription';
import { useSafeBottomPadding } from '../../../hooks/useSafeBottomPadding';
import {
  formatResetsAt,
  getApiErrorDetail,
  scansLeftLabel,
} from '../../../utils/subscriptionQuotas';
import {
  openDailyScanLimitFromQuotas,
  openScanPaywall,
  showDailyScanLimitAlert,
  showSubscriptionRequiredAlert,
} from '../../../utils/subscriptionAlerts';

const Scanner = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const navigation = useNavigation();
  const bottomPad = useSafeBottomPadding(8);
  const { quotas, canScan, requiresSubscription, refetchStatus } =
    useSubscription();

  const [createScan, { isLoading: isUploading }] = useScanPetMutation();

  const [isRecordingView, setIsRecordingView] = useState(false);
  const [isVoiceCreated, setIsVoiceCreated] = useState(false);
  const [isStartAudioRecording, setIsStartAudioRecording] = useState(false);
  const [isStartVideoRecording, setIsStartVideoRecording] = useState(false);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
  const [petImage, setPetImage] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  useGetScanHistoryQuery();
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const { data, refetch, isFetching } = useGetAllProfilesQuery();
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [scanResult, setScanResult] = useState<CreateScanRes>(
    {} as CreateScanRes,
  );

  useFocusEffect(
    useCallback(() => {
      void refetchStatus();
    }, [refetchStatus]),
  );

  const handleSaveScan = () => {
    showSuccessMsg('Scan saved to your history.');
    setIsVoiceCreated(false);
    setIsRecordingView(false);
    setPetImage(null);
    setAudioPath(null);
    setScanResult({} as CreateScanRes);
    setIsStartAudioRecording(false);
    setIsStartVideoRecording(false);
    // Keep selected pet and go to History so user doesn't land on an empty pet list
    (navigation as any).navigate('History');
  };

  const resetScanForRetake = () => {
    setIsVoiceCreated(false);
    setIsRecordingView(true);
    setPetImage(null);
    setAudioPath(null);
    setScanResult({} as CreateScanRes);
    setIsAnalyzingMedia(false);
    setIsStartAudioRecording(false);
    setIsStartVideoRecording(false);
    bottomSheetRef.current?.close();
  };

  const getScanErrorDetail = (error: unknown): string => {
    return (
      getApiErrorDetail(error) ||
      'No pet was detected. Please retake with your pet clearly visible or audible.'
    );
  };

  const handleUploadScan = async (
    fileUri: string,
    mediaType: 'audio' | 'video' | 'image',
    mime?: string,
    fileName?: string,
  ) => {
    try {
      console.log('⬆️ Uploading scan:', fileUri, mediaType, mime);
      setIsAnalyzingMedia(true);
      bottomSheetRef.current?.expand();

      const defaultType =
        mediaType === 'audio'
          ? 'audio/m4a'
          : mediaType === 'video'
            ? 'video/mp4'
            : 'image/jpeg';
      const defaultName =
        mediaType === 'audio'
          ? 'pet_audio.m4a'
          : mediaType === 'video'
            ? 'pet_video.mp4'
            : 'pet_image.jpg';

      const response = await createScan({
        petId: selectedPet,
        mediaType,
        file: {
          uri: fileUri,
          type: mime || defaultType,
          mime: mime || defaultType,
          name: fileName || defaultName,
          fileName: fileName || defaultName,
        },
      }).unwrap();
      setScanResult(response);
      setIsVoiceCreated(true);
      setIsRecordingView(false);
      setIsAnalyzingMedia(false);
      bottomSheetRef.current?.close();
      console.log('✅ Scan uploaded successfully:', response);
      void refetchStatus();
    } catch (error: any) {
      console.log('❌ Upload failed:', error);
      setIsAnalyzingMedia(false);
      bottomSheetRef.current?.close();

      if (showSubscriptionRequiredAlert(error, navigation as any)) {
        return;
      }

      if (showDailyScanLimitAlert(error)) {
        void refetchStatus();
        return;
      }

      if (error?.status === 403) {
        openScanPaywall(
          navigation as any,
          getApiErrorDetail(error) ||
            'You need an active subscription to scan. Please subscribe to continue.',
        );
        return;
      }

      if (error?.status === 429) {
        showDailyScanLimitAlert(error);
        void refetchStatus();
        return;
      }

      if (error?.status === 422) {
        Alert.alert(
          'No pet detected',
          `${getScanErrorDetail(error)}\n\nTips: center your pet in frame, use good lighting, keep the clip short, and reduce background noise for audio.`,
          [{ text: 'Retake', onPress: resetScanForRetake }],
        );
        return;
      }

      Alert.alert(
        'Upload Failed',
        getApiErrorDetail(error) ||
          'Unable to upload the scan. Please try again.',
      );
    }
  };

  const handleShowRecording = () => {
    if (!selectedPet) {
      showErrMsg('Please select a pet to upload the scan.');
      return;
    }

    if (!canScan) {
      if (requiresSubscription || quotas?.scansAllowed === false) {
        openScanPaywall(
          navigation as any,
          quotas?.tier === 'expired_locked'
            ? 'Your trial has ended. Please subscribe to continue scanning your pet’s emotions.'
            : 'You do not have an active subscription. Please subscribe to scan your pet’s emotions.',
        );
        return;
      }
      if (quotas?.scansRemainingToday === 0) {
        openDailyScanLimitFromQuotas(quotas.resetsAt);
        return;
      }
      showErrMsg('Scanning is not available right now.');
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

  const handleStartVideoRecording = async () => {
    try {
      const video = await ImagePicker.openCamera({
        mediaType: 'video',
        compressVideoPreset:
          Platform.OS === 'android' ? 'LowQuality' : 'MediumQuality',
      });
      const path = video.path || (video as { sourceURL?: string }).sourceURL;
      if (!path) {
        Alert.alert('Video Error', 'Could not access the recorded video file.');
        return;
      }
      console.log('🎥 Video recorded:', path, video.mime, video.size);
      await handleUploadScan(
        path,
        'video',
        video.mime || 'video/mp4',
        video.filename || `pet_video_${Date.now()}.mp4`,
      );
    } catch (error: any) {
      if (error?.code === 'E_PICKER_CANCELLED') {
        return;
      }
      console.log('❌ Video error:', error);
      Alert.alert(
        'Video Error',
        'Unable to record video. Please try again or use a shorter clip.',
      );
    }
  };

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
      await handleUploadScan(
        image.path,
        'image',
        image.mime || 'image/jpeg',
        image.filename || `pet_image_${Date.now()}.jpg`,
      );
    } catch (error) {
      console.log('❌ Image error:', error);
    }
  };

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

        <View style={{ flex: 1 }}>
          {isRecordingView &&
            (isStartAudioRecording || isStartVideoRecording ? (
              <RecordingProgressView
                style={{ flex: 1 }}
                onStartRecord={() => setIsStartAudioRecording(true)}
                onStopRecord={async path => {
                  console.log('🎙️ Audio saved at:', path);
                  setIsStartAudioRecording(false);
                  setAudioPath(path);
                  await handleUploadScan(path, 'audio', 'audio/m4a', 'pet_audio.m4a');
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

          {(audioPath || petImage || scanResult?.mediaUrl) && isVoiceCreated && !isRecordingView && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {audioPath && (
                <AudioPreview
                  audioPath={audioPath || scanResult?.mediaUrl}
                  duration={30000}
                />
              )}
              <EmotionDetectionResults
                onSave={handleSaveScan}
                onRetake={resetScanForRetake}
                petScanResult={scanResult}
                capturedImageUri={petImage}
              />
            </ScrollView>
          )}
        </View>
      </View>

      {isUploading && !isVoiceCreated && (
        <View style={{ position: 'absolute', top: '50%', left: 0, right: 0 }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <AppText style={{ textAlign: 'center', color: colors.text }}>
            Uploading Scan...
          </AppText>
        </View>
      )}

      {!isRecordingView && !isVoiceCreated && (
        <View
          style={{
            position: 'absolute',
            bottom: bottomPad + 12,
            left: '5%',
            right: '5%',
            width: '90%',
            alignSelf: 'center',
          }}
        >
          {scansLeftLabel(quotas) ? (
            <AppText
              size={13}
              color={colors.caption}
              style={{ textAlign: 'center', marginBottom: 8 }}
            >
              {scansLeftLabel(quotas)}
              {quotas?.scansRemainingToday === 0 && quotas?.resetsAt
                ? ` · Resets ${formatResetsAt(quotas.resetsAt)}`
                : ''}
            </AppText>
          ) : null}
          <PrimaryButton
            onPress={handleShowRecording}
            title={
              requiresSubscription || quotas?.scansAllowed === false
                ? 'Subscribe to Scan'
                : quotas?.scansRemainingToday === 0
                  ? 'Daily Limit Reached'
                  : 'Start Scan'
            }
            disabled={isUploading}
          />
        </View>
      )}

      <GlobalBottomSheet ref={bottomSheetRef} snapPoints={['30%']}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText
          variant="heading"
          style={{ textAlign: 'center', marginVertical: 20 }}
        >
          Analyzing Your Pet's Mood...
        </AppText>
        <AppText style={{ textAlign: 'center', marginBottom: 8 }}>
          Please wait while we upload and process your recording.
        </AppText>
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
