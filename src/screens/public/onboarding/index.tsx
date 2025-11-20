import React, { useRef, useState } from 'react';
import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import Swiper from 'react-native-swiper';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../hooks/useTheme';
import { OnboardingProps, RouteName } from '../../../navigation/types';

const slides = [
  {
    key: '1',
    image: images.step_1,
    title: 'Understand Your \n  Pet’s Feelings',
    description:
      'Discover what your pet is feeling through \n   smart emotion detection using photos, \n   videos, and sounds.',
  },
  {
    key: '2',
    image: images.step_2,
    title: 'Scan & Decode \n  Emotions',
    description:
      'Use our AI-powered scan to identify if your \n   pet is happy, sad, anxious or excited — and \n   get real-time insights.',
  },
  {
    key: '3',
    image: images.step_3,
    title: 'Build a Happier \n  Bond',
    description:
      'View your pet’s emotion history, detect \n   patterns, and get helpful tips to keep them \n   calm and joyful.',
  },
];

const Onboarding = ({ navigation }: OnboardingProps) => {
  const { colors, fonts } = useTheme();
  const styles = useStyles(colors, fonts);
  const swiperRef = useRef<Swiper>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < slides.length - 1) {
      swiperRef.current?.scrollBy(1);
    } else {
      navigation.navigate(RouteName.CreateAccount);
    }
  };

  const handleBack = () => {
    if (activeIndex > 0) {
      swiperRef.current?.scrollBy(-1);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <Swiper
        ref={swiperRef}
        loop={false}
        onIndexChanged={setActiveIndex}
        showsPagination={false}
      >
        {slides.map(slide => (
          <ImageBackground
            key={slide.key}
            source={slide.image}
            style={{ flex: 1 }}
            resizeMode="cover"
          />
        ))}
      </Swiper>

      <View style={styles.bottomView}>
        <View>
          <Text style={styles.title}>{slides[activeIndex].title}</Text>
          <Text style={styles.description}>
            {slides[activeIndex].description}
          </Text>
        </View>

        <View style={styles.paginationWrapper}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, activeIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={{ marginBottom: 20 }}>
          <PrimaryButton
            title={activeIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            onPress={handleNext}
          />

          {activeIndex > 0 && (
            <PrimaryButton
              title="Back"
              onPress={handleBack}
              style={{
                marginTop: 10,
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.primary,
              }}
              titleStyle={{ color: colors.primary }}
            />
          )}
        </View>
      </View>
    </View>
  );
};

export default Onboarding;

const useStyles = (colors: Theme['colors'], fonts: Theme['fonts']) =>
  StyleSheet.create({
    bottomView: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.card,
      padding: 20,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
      height: 370,
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 24,
      textAlign: 'center',
      color: colors.text,
      ...fonts.semiBold,
      marginBottom: 16,
    },
    description: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.text,
      marginBottom: 24,
      ...fonts.regular,
    },
    paginationWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    dot: {
      backgroundColor: '#17223B33',
      width: 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    activeDot: {
      backgroundColor: colors.primary,
      width: 24,
      height: 8,
      borderRadius: 5,
    },
  });
