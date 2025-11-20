import React, { useState, useRef, useEffect } from 'react';
import {
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import NitroSound from 'react-native-nitro-sound';
import RNFS from 'react-native-fs';
import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import { useTheme } from '../../../hooks/useTheme';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';

interface Props {
  style: ViewStyle;
  onStopRecord: (path: string) => void;
  onPlay: () => void;
  onStartRecord: () => void;
}

const BAR_COUNT = 30;

const RecordingProgressView = ({
  style,
  onStopRecord,
  onPlay,
  onStartRecord,
}: Props) => {
  const { colors } = useTheme();
  const styles = useStyles(colors);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Create animated values for bars
  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);
  const animatedValues = bars.map(() => useSharedValue(Math.random()));

  // Start waveform animation
  const startWaveAnimation = () => {
    animatedValues.forEach(val => {
      val.value = withRepeat(
        withTiming(Math.random(), { duration: 400 + Math.random() * 300 }),
        -1,
        true,
      );
    });
  };

  // Stop waveform animation
  const stopWaveAnimation = () => {
    animatedValues.forEach(val => cancelAnimation(val));
  };

  // 🕒 Format mm:ss.SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}.${String(milliseconds).padStart(2, '0')}`;
  };

  // 🎤 Start recording
  const handleStartRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Microphone permission denied');
          return;
        }
      }

      const fileName = `pet_audio_${Date.now()}.m4a`;
      const path =
        Platform.OS === 'ios'
          ? `${RNFS.DocumentDirectoryPath}/${fileName}`
          : `${RNFS.CachesDirectoryPath}/${fileName}`;

      console.log('🎙️ Start recording to:', path);
      await NitroSound.startRecorder(path);

      setRecordingPath(path);
      setIsRecording(true);
      setElapsedTime(0);
      onStartRecord();
      startWaveAnimation();

      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 100);
      }, 100);
    } catch (err) {
      console.log('❌ Audio recording error:', err);
    }
  };

  // 🛑 Stop recording
  const handleStopRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const result = await NitroSound.stopRecorder();
      console.log('🛑 Recording stopped:', result);
      stopWaveAnimation();
      setIsRecording(false);
      onStopRecord(recordingPath || '');
    } catch (err) {
      console.log('❌ Stop recording error:', err);
    }
  };

  // ▶️ Play recording
  const handlePlayRecording = async () => {
    try {
      if (!recordingPath) return;
      await NitroSound.startPlayer(recordingPath);
      console.log('▶️ Playing audio from:', recordingPath);
      onPlay();
    } catch (err) {
      console.log('❌ Playback error:', err);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      stopWaveAnimation();
    };
  }, []);

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name="mic-outline" size={50} color={colors.primary} />

      <AppText
        variant="subheading"
        fontWeight="bold"
        style={{ marginTop: 8, color: colors.text }}
      >
        {isRecording ? formatTime(elapsedTime) : '00:00.00'}
      </AppText>

      {/* 🎵 Animated waveform while recording */}
      <View style={styles.waveformContainer}>
        {bars.map((barIndex, i) => {
          const animatedStyle = useAnimatedStyle(() => {
            const height = interpolate(
              animatedValues[i].value,
              [0, 1],
              [8, 50],
            );
            return {
              height,
              backgroundColor: isRecording ? colors.primary : '#BCC1C6',
              opacity: interpolate(animatedValues[i].value, [0, 1], [0.5, 1]),
            };
          });

          return (
            <Animated.View key={barIndex} style={[styles.bar, animatedStyle]} />
          );
        })}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleStopRecording}
          disabled={!isRecording}
        >
          <Image source={icons.cross} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}
          onPress={isRecording ? handleStopRecording : handleStartRecording}
        >
          {isRecording ? (
            <Ionicons name="pause" size={24} color={colors.card} />
          ) : (
            <Octicons name="dot-fill" size={40} color={colors.card} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={handlePlayRecording}
          disabled={!recordingPath}
        >
          <Image source={icons.tick} style={{ width: 24, height: 24 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RecordingProgressView;

const useStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    controls: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 40,
      position: 'absolute',
      bottom: 20,
    },
    button: {
      width: 52,
      height: 52,
      borderRadius: 50,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
      height: 60,
      width: '90%',
    },
    bar: {
      width: 4,
      borderRadius: 2,
      marginHorizontal: 1,
    },
  });
