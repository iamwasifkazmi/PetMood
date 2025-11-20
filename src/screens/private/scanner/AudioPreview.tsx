import React, { useEffect, useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AppText from '../../../components/Text/AppText';
import { useTheme } from '../../../hooks/useTheme';
import NitroSound from 'react-native-nitro-sound';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
  interpolate,
} from 'react-native-reanimated';
import RNFS from 'react-native-fs';

interface Props {
  audioPath: string;
  duration: number; // in ms
}

const BAR_COUNT = 30;

const AudioPreview = ({ audioPath, duration }: Props) => {
  const { colors } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [remainingTime, setRemainingTime] = useState(duration);
  const intervalRef = useRef<NodeJs.Timeout | null>(null);

  const bars = Array.from({ length: BAR_COUNT }, (_, i) => i);
  const fixedPath = audioPath.startsWith('file://')
    ? audioPath
    : `file://${audioPath}`;

  // Shared values for each bar
  const animatedValues = bars.map(() => useSharedValue(Math.random()));

  const formatTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  };

  const startWaveAnimation = () => {
    animatedValues.forEach(val => {
      val.value = withRepeat(
        withTiming(Math.random(), { duration: 400 + Math.random() * 300 }),
        -1,
        true,
      );
    });
  };

  const stopWaveAnimation = () => {
    animatedValues.forEach(val => cancelAnimation(val));
  };

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handlePlayPause = async () => {
    try {
      const fileExists = await RNFS.exists(fixedPath.replace('file://', ''));
      if (!fileExists) {
        console.warn('⚠️ Audio file does not exist:', fixedPath);
        return;
      }

      if (isPlaying) {
        await NitroSound.stopPlayer();
        stopWaveAnimation();
        clearTimer();
        setIsPlaying(false);
        setRemainingTime(duration);
      } else {
        console.log('▶️ Playing audio from:', fixedPath);
        setIsPlaying(true);
        startWaveAnimation();

        await NitroSound.startPlayer(fixedPath);

        // Countdown timer
        setRemainingTime(duration);
        const startTime = Date.now();
        intervalRef.current = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(duration - elapsed, 0);
          setRemainingTime(remaining);
          if (remaining <= 0) {
            clearTimer();
            stopWaveAnimation();
            setIsPlaying(false);
          }
        }, 200);
      }
    } catch (err) {
      console.log('❌ Playback error:', err);
      stopWaveAnimation();
      clearTimer();
      setIsPlaying(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWaveAnimation();
      clearTimer();
      NitroSound.stopPlayer();
    };
  }, []);

  return (
    <View
      style={[
        styles.container,
        { borderColor: colors.border, backgroundColor: colors.card },
      ]}
    >
      {/* ▶️ Play / Pause Button */}
      <TouchableOpacity
        onPress={handlePlayPause}
        style={[styles.playButton, { borderColor: colors.primary }]}
      >
        <Ionicons
          name={isPlaying ? 'pause-circle-outline' : 'play-circle-outline'}
          size={40}
          color={colors.primary}
        />
      </TouchableOpacity>

      {/* 🎵 Animated Waveform */}
      <View style={styles.waveform}>
        {bars.map((barIndex, i) => {
          const animatedStyle = useAnimatedStyle(() => {
            const height = interpolate(
              animatedValues[i].value,
              [0, 1],
              [10, 50],
            );
            return {
              height,
              backgroundColor: isPlaying ? colors.primary : '#BCC1C6',
              opacity: interpolate(animatedValues[i].value, [0, 1], [0.6, 1]),
            };
          });
          return (
            <Animated.View key={barIndex} style={[styles.bar, animatedStyle]} />
          );
        })}
      </View>

      {/* ⏱ Remaining Time */}
      <AppText variant="body" style={{ color: colors.text, marginLeft: 8 }}>
        {formatTime(remainingTime - 30)}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  playButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
    flex: 1,
    height: 60,
  },
  bar: {
    width: 4,
    borderRadius: 2,
    marginHorizontal: 1,
  },
});

export default AudioPreview;
