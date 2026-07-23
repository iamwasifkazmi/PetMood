import React, { useCallback, useRef, useState } from 'react';
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
import { WarningImage } from '../../../components/views/SuccessImage';
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
import { showErrMsg } from '../../../utils/flashMessage';
import AiConsentModal from '../../../components/modals/AiConsentModal';
import {
  useLazyGetAiConsentQuery,
  useSetAiConsentMutation,
} from '../../../features/privacy/privacyApiSlice';
import { AiProviderKey } from '../../../features/privacy/types';
import { useSubscription } from '../../../hooks/useSubscription';
import {
  formatResetsAt,
  getApiErrorCode,
  getApiErrorDetail,
  scansLeftLabel,
} from '../../../utils/subscriptionQuotas';
import { navigateToSubscription } from '../../../utils/navigateToSubscription';

const Scanner = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  const navigation = useNavigation();
  const { quotas, canScan, requiresSubscription, refetchStatus } =
    useSubscription();

  // 🧩 RTK Query Mutation
  const [createScan, { isLoading: isUploading }] = useScanPetMutation();

  // State
  const [isRecordingView, setIsRecordingView] = useState(false);
  const [isVoiceCreated, setIsVoiceCreated] = useState(false);
  const [isStartAudioRecording, setIsStartAudioRecording] = useState(false);
  const [isStartVideoRecording, setIsStartVideoRecording] = useState(false);
  const [isAnalyzingMedia, setIsAnalyzingMedia] = useState(false);
  const [petImage, setPetImage] = useState<string | null>(null);
  const [audioPath, setAudioPath] = useState<string | null>(null);
  const { data: scanHistory } = useGetScanHistoryQuery();
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const { data, refetch, isFetching } = useGetAllProfilesQuery();
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [scanResult, setScanResult] = useState<CreateScanRes>(
    {} as CreateScanRes,
  );

  // AI consent state
  const [consentVisible, setConsentVisible] = useState(false);
  const [requiredProvider, setRequiredProvider] = useState<AiProviderKey | null>(
    null,
  );
  const [pendingRetry, setPendingRetry] = useState<{
    fileUri: string;
    mediaType: 'audio' | 'video' | 'image';
  } | null>(null);

  const [fetchAiConsent, aiConsentQuery] = useLazyGetAiConsentQuery();
  const [setAiConsent, setAiConsentState] = useSetAiConsentMutation();

  useFocusEffect(
    useCallback(() => {
      void refetchStatus();
    }, [refetchStatus]),
  );

  const openPaywall = useCallback(
    (message: string) => {
      Alert.alert('Subscription required', message, [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Subscribe',
          onPress: () => navigateToSubscription(navigation as any),
        },
      ]);
    },
    [navigation],
  );

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
      'No pet was detected in this photo. Please retake with your pet clearly visible.'
    );
  };

  const openConsent = async (provider?: string) => {
    setRequiredProvider((provider as AiProviderKey) || null);
    setConsentVisible(true);
    try {
      await fetchAiConsent().unwrap();
    } catch {
      // ignore; modal can still show with generic copy
    }
  };

  const getRequiredProviderForMedia = (
    mediaType: 'audio' | 'video' | 'image',
  ): AiProviderKey | null => {
    // Backend disclosure: images -> nyckel, audio -> assemblyai.
    // Video uses the image/video analysis pipeline; update if your backend differs.
    if (mediaType === 'audio') return 'assemblyai';
    return 'nyckel';
  };

  const handleUploadScan = async (
    fileUri: string,
    mediaType: 'audio' | 'video' | 'image',
  ) => {
    try {
      // ✅ Ask for consent BEFORE first scan / before any upload
      const required = getRequiredProviderForMedia(mediaType);
      try {
        const res = await fetchAiConsent().unwrap();
        const granted = !!res?.consent?.granted;
        const providers = (res?.consent?.providers || []) as AiProviderKey[];
        const providerAllowed = required ? providers.includes(required) : granted;

        if (!granted || !providerAllowed) {
          setPendingRetry({ fileUri, mediaType });
          await openConsent(required || undefined);
          return;
        }
      } catch {
        // If we can't fetch consent, fail closed: require explicit consent before scanning
        setPendingRetry({ fileUri, mediaType });
        await openConsent(required || undefined);
        return;
      }

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
      void refetchStatus();
    } catch (error: any) {
      console.log('❌ Upload failed:', error);
      const code = getApiErrorCode(error);
      const detail = getApiErrorDetail(error);

      if (error?.status === 403 && code === 'subscription_required') {
        openPaywall(
          detail ||
            'You do not have an active subscription. Please subscribe to scan your pet’s emotions.',
        );
        return;
      }

      if (error?.status === 403 && error?.data?.requiredProvider) {
        const provider = error?.data?.requiredProvider as string | undefined;
        setPendingRetry({ fileUri, mediaType });
        await openConsent(provider);
        return;
      }

      if (error?.status === 403) {
        // Unknown 403 with consent-like body without code — keep prior consent flow
        const provider = error?.data?.requiredProvider as string | undefined;
        if (
          provider ||
          String(detail || '')
            .toLowerCase()
            .includes('consent')
        ) {
          setPendingRetry({ fileUri, mediaType });
          await openConsent(provider);
          return;
        }
        openPaywall(
          detail ||
            'You need an active subscription to scan. Please subscribe to continue.',
        );
        return;
      }

      if (error?.status === 429) {
        // Global flash already showed daily limit + resetsAt
        void refetchStatus();
        return;
      }
      if (error?.status === 422) {
        Alert.alert('No pet detected', getScanErrorDetail(error), [
          { text: 'Retake', onPress: resetScanForRetake },
        ]);
        return;
      }
      Alert.alert(
        'Upload Failed',
        detail || 'Unable to upload the scan. Please try again.',
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

    if (!canScan) {
      if (requiresSubscription || quotas?.scansAllowed === false) {
        openPaywall(
          'You do not have an active subscription. Please subscribe to scan your pet’s emotions.',
        );
        return;
      }
      if (quotas?.scansRemainingToday === 0) {
        Alert.alert(
          'Daily scan limit reached',
          `You’ve used all scans for today. Try again after ${formatResetsAt(
            quotas.resetsAt,
          )}.`,
        );
        return;
      }
      showErrMsg('Scanning is not available right now.');
      return;
    }

    // Show consent before the user starts any scan flow
    (async () => {
      try {
        const res = await fetchAiConsent().unwrap();
        const granted = !!res?.consent?.granted;
        if (!granted) {
          setPendingRetry(null);
          await openConsent(undefined);
          return;
        }
        setIsRecordingView(true);
      } catch {
        // If consent state cannot be fetched, require explicit consent
        setPendingRetry(null);
        await openConsent(undefined);
      }
    })();
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
      <AiConsentModal
        visible={consentVisible}
        loading={aiConsentQuery.isFetching || setAiConsentState.isLoading}
        disclosure={aiConsentQuery.data?.disclosure}
        initialEnabledProviders={(aiConsentQuery.data?.consent?.providers || []) as AiProviderKey[]}
        requiredProvider={requiredProvider}
        onClose={() => {
          setConsentVisible(false);
          setPendingRetry(null);
          setRequiredProvider(null);
          showErrMsg(
            'You can enable AI analysis anytime from the menu: AI consent.',
          );
        }}
        onSubmit={async providers => {
          try {
            await setAiConsent({ granted: true, providers }).unwrap();
            setConsentVisible(false);
            const retry = pendingRetry;
            setPendingRetry(null);
            setRequiredProvider(null);
            if (retry) {
              await handleUploadScan(retry.fileUri, retry.mediaType);
            } else {
              // Consent opened from "Start Scan" (no pending upload yet)
              setIsRecordingView(true);
            }
          } catch (e) {
            showErrMsg('Unable to save consent. Please try again.');
          }
        }}
      />

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

          {(audioPath || petImage || scanResult?.mediaUrl) && isVoiceCreated && !isRecordingView && (
            <ScrollView showsVerticalScrollIndicator={false}>
              {audioPath && (
                <AudioPreview
                  audioPath={audioPath || scanResult?.mediaUrl}
                  duration={30000}
                />
              )}
              <EmotionDetectionResults
                onSave={() => {}}
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
            bottom: 20,
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
