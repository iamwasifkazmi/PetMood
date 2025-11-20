import { Image, StyleSheet, View } from 'react-native';
import React from 'react';
import icons from '../../assets/icons/icons';

const styles = StyleSheet.create({
  image: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 24,
  },
});

export const SuccessImage = () => {
  return <Image source={icons.success} style={styles.image} />;
};

export const WarningImage = () => {
  return <Image source={icons.warning} style={styles.image} />;
};
