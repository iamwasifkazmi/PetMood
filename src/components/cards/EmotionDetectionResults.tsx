import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import React from 'react';
import images from '../../assets/images';
import EmotionResultCard from './EmotionResultCard';
import icons from '../../assets/icons/icons';
import PrimaryButton from '../buttons/PrimaryButton';
import { useTheme } from '../../hooks/useTheme';
import { getCondidenceValue } from '../../utils/getConfidencePercentage';
import type { CreateScanRes } from '../../features/scanning/types';

interface Props {
  containerStyle?: ViewStyle;
  onRetake: () => void;
  onSave: () => void;
  isHistoryScreen?: boolean;
  deleteButtonTitle?: string;
  petScanResult: CreateScanRes;
  capturedImageUri?: string | null; // For locally captured images
}
const EmotionDetectionResults = ({
  containerStyle,
  onRetake,
  onSave,
  isHistoryScreen,
  deleteButtonTitle,
  petScanResult,
  capturedImageUri,
}: Props) => {
  const { colors } = useTheme();
  
  // Determine which image to show (priority order):
  // 1. Captured/uploaded image from local file
  // 2. mediaUrl from scan result (if it's an image)
  // 3. Pet's profile image from pet object
  // 4. Fallback to placeholder
  const getImageSource = () => {
    if (capturedImageUri) {
      return { uri: capturedImageUri.startsWith('file://') ? capturedImageUri : `file://${capturedImageUri}` };
    }
    if (petScanResult?.mediaUrl && petScanResult.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      return { uri: petScanResult.mediaUrl };
    }
    if (petScanResult?.pet?.image || petScanResult?.pet?.photoUrl) {
      return { uri: petScanResult.pet.image || petScanResult.pet.photoUrl };
    }
    return images.pet_detail;
  };
  
  return (
    <View style={[containerStyle, { gap: 24 }]}>
      <Image
        source={getImageSource()}
        style={{
          width: '100%',
          height: 160,
          borderRadius: 16,
          overflow: 'hidden',
        }}
        resizeMode="cover"
      />
      <EmotionResultCard
        Data={[
          {
            label: 'Name',
            categoryValue:
              petScanResult?.animalType || petScanResult?.pet?.name,
            icon: icons.dog_icon2,
          },
          {
            label: 'Detected Emotion',
            categoryValue: petScanResult?.emotion,
            icon: icons.dog_icon,
            isEmotionType: true,
          },
          ...(petScanResult?.date
            ? [
                {
                  label: 'Date & Time',
                  categoryValue: '2025-07-24 14:35',
                  icon: icons.calendar,
                },
              ]
            : []),
          {
            label: 'Confidence Score',
            categoryValue: getCondidenceValue(petScanResult?.confidence),
            icon: icons.pin_up,
          },

          ...(petScanResult?.breed
            ? [
                {
                  label: 'Pet Breed',
                  categoryValue:
                    'Your pet sounds happy and content. Great job! That cheerful bark says your pet is in a good mood!',
                  icon: icons.bulb,
                  suggestions: true,
                },
              ]
            : []),
        ]}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <PrimaryButton
          onPress={onRetake}
          title={deleteButtonTitle ? deleteButtonTitle : 'Retake'}
          style={{
            width: isHistoryScreen ? '100%' : '47%',
            backgroundColor: colors.danger,
          }}
        />
        {!isHistoryScreen && (
          <PrimaryButton
            onPress={onSave}
            title="Save"
            style={{ width: '47%' }}
          />
        )}
      </View>
    </View>
  );
};

export default EmotionDetectionResults;

const styles = StyleSheet.create({});
