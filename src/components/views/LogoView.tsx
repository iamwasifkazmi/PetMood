import React from 'react';
import { Image, StyleSheet } from 'react-native';
import images from '../../assets/images';

/** Icon-only mark — name lives in Info.plist / strings as AIPetMood, not in the image. */
const LogoView = () => {
  return (
    <Image
      source={images.aipetmood_icon}
      style={styles.logo}
      resizeMode="contain"
    />
  );
};

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 20,
  },
});

export default LogoView;
