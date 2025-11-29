import React, { useState } from 'react';
import { ImageSourcePropType, StyleSheet, View } from 'react-native';
import Swiper from 'react-native-swiper';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../common/theme';
import AppText from '../Text/AppText';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import config from '../../common/config';

interface Props {
  postImages: string[];
  onIndexChange?: (index: number) => void; // 👈 add callback
}

const CommunitySwiper: React.FC<Props> = ({ postImages, onIndexChange }) => {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const handleIndexChanged = (index: number) => {
    setActiveIndex(index);
    onIndexChange?.(index);
  };
  return (
    <View style={styles.container}>
      <Swiper
        loop={false}
        showsPagination={false}
        onIndexChanged={handleIndexChanged}
      >
        {postImages?.filter(Boolean).map((img, idx) => {
          // Handle both full URLs and relative paths from API
          let imageUrl = img.trim();
          
          if (!imageUrl) {
            return null;
          }
          
          // If already a full URL (http/https), use as-is
          if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // Do nothing, use as-is
          } else if (imageUrl.startsWith('/')) {
            // Relative path starting with / - remove /api/ from base URL and append image path
            imageUrl = config.api_base_url.replace('/api/', '').replace(/\/$/, '') + imageUrl;
          } else {
            // Relative path without leading / - construct full URL
            const baseUrl = config.api_base_url.replace('/api/', '').replace(/\/$/, '');
            imageUrl = baseUrl + '/' + imageUrl;
          }
          
          return (
            <FastImage
              key={idx}
              source={{
                uri: imageUrl,
              }}
              style={styles.image}
              resizeMode="cover"
            />
          );
        })}
      </Swiper>

      <View style={styles.imageCountView}>
        <AppText size={12} fontWeight="medium" style={{ color: colors.card }}>
          {activeIndex + 1}/{postImages?.length}
        </AppText>
      </View>
    </View>
  );
};

export default CommunitySwiper;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    container: {
      height: 300,
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    image: {
      width: '100%',
      height: 300,
    },
    dot: {
      backgroundColor: colors.border,
      width: 6,
      height: 6,
      borderRadius: 3,
      marginHorizontal: 3,
      marginBottom: -20,
      zIndex: 999,
    },
    imageCountView: {
      position: 'absolute',
      right: spacing.sm,
      top: spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: 16,
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: 3,
    },
  });
