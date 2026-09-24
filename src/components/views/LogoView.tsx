import React from 'react';
import { Image } from 'react-native';
import images from '../../assets/images';

const LogoView = () => {
  return (
    <Image
      source={images.logo}
      style={{ width: 180, height: 120, alignSelf: 'center' }}
      resizeMode="contain"
    />
  );
};

export default LogoView;
