import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import AppText from '../../../components/Text/AppText';
import { useTheme } from '../../../hooks/useTheme';

const EmptyView = () => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);
  return (
    <View style={{ alignItems: 'center' }}>
      <Image source={images.pet_group} style={styles.petImage} />
      <AppText variant="subheading" style={{ marginVertical: 16 }}>
        Uh Oh!
      </AppText>
      <AppText variant="body" style={{ textAlign: 'center', marginBottom: 32 }}>
        Looks like you have no profiles set up{' \n'}at this moment, add your
        pet now.
      </AppText>
    </View>
  );
};

export default EmptyView;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    petImage: { width: 294, height: 220, resizeMode: 'contain' },
  });
