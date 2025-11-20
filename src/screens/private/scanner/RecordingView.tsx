import { View, Text, Image, TouchableOpacity, ViewStyle } from 'react-native';
import React from 'react';
import CardView from '../../../components/cards/CardView';
import icons from '../../../assets/icons/icons';
import AppText from '../../../components/Text/AppText';
import { useTheme } from '../../../hooks/useTheme';

interface Props {
  onStartAudioRecording: () => void;
  onSelectCameraOption: () => void; // 🔹 New unified trigger for camera options
  style?: ViewStyle;
}
const RecordingView = ({
  onStartAudioRecording,
  onSelectCameraOption,
  style,
}: Props) => {
  const { colors } = useTheme();
  return (
    <View style={style}>
      <TouchableOpacity onPress={onStartAudioRecording}>
        <CardView
          style={{
            alignItems: 'center',
            gap: 5,
            padding: 32,
            marginBottom: 16,
          }}
        >
          <Image
            source={icons.mic}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
          <AppText variant="heading" style={{ fontSize: 16 }}>
            Record Audio
          </AppText>
          <AppText
            variant="body"
            style={{ fontSize: 13 }}
            color={colors.caption}
          >
            Bark/Meow/etc.
          </AppText>
        </CardView>
      </TouchableOpacity>
      <TouchableOpacity onPress={onSelectCameraOption}>
        <CardView style={{ alignItems: 'center', gap: 5, padding: 32 }}>
          <Image
            source={icons.video}
            style={{ width: 40, height: 40, resizeMode: 'contain' }}
          />
          <AppText variant="heading" style={{ fontSize: 16 }}>
            Record Video / Take Picture{' '}
          </AppText>
          <AppText
            variant="body"
            style={{ fontSize: 13 }}
            color={colors.caption}
          >
            Pet Face
          </AppText>
        </CardView>
      </TouchableOpacity>
    </View>
  );
};

export default RecordingView;
