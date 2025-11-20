import { StyleSheet, View } from 'react-native';
import React from 'react';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import icons from '../../../assets/icons/icons';
import Dropdown from '../../../components/Dropdown';
import { useTheme } from '../../../hooks/useTheme';
import { Theme } from '../../../common/theme';
import { LOCATION_OPTIONS } from '../../../constants/petOptions';

interface PersonalDetailsProps {
  email: string;
  setEmail: (value: string) => void;

  name: string;
  setName: (value: string) => void;

  phone?: string;
  setPhone: (value: string) => void;

  selectedLocation?: string | number;
  setSelectedLocation: (value: string | number) => void;
}

const PersonalDetailsTab = ({
  email,
  setEmail,
  name,
  setName,
  phone,
  setPhone,
  selectedLocation,
  setSelectedLocation,
}: PersonalDetailsProps) => {
  const { colors, spacing } = useTheme();
  const styles = useStyles(colors, spacing);

  return (
    <View>
      <PrimaryInput
        placeholder="john@gmail.com"
        leftImageSource={icons.email}
        containerStyle={{ marginBottom: 15 }}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <PrimaryInput
        placeholder="John Doe"
        leftImageSource={icons.profile}
        containerStyle={{ marginBottom: 15 }}
        value={name}
        onChangeText={setName}
      />

      {/* <PrimaryInput
        placeholder="+1 (415) 555-2671"
        leftImageSource={icons.phone}
        containerStyle={{ marginBottom: 15 }}
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      /> */}

      <Dropdown
        options={LOCATION_OPTIONS}
        selectedValue={selectedLocation ?? ''}
        onValueChange={setSelectedLocation}
        placeholder="Select location"
        containerStyle={styles.dropdownContainer}
        leftIcon={icons.location}
        leftIconStyle={{ tintColor: colors.primary }}
      />
    </View>
  );
};

export default PersonalDetailsTab;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    dropdownContainer: {
      marginBottom: 20,
    },
  });
