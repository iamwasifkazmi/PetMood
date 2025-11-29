import { StyleSheet, View } from 'react-native';
import React from 'react';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import icons from '../../../assets/icons/icons';
import { useTheme } from '../../../hooks/useTheme';
import { Theme } from '../../../common/theme';

interface PersonalDetailsProps {
  email: string;
  setEmail: (value: string) => void;

  name: string;
  setName: (value: string) => void;

  phone?: string;
  setPhone: (value: string) => void;

  selectedLocation?: string;
  setSelectedLocation: (value: string) => void;
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
        containerStyle={[
          { marginBottom: 15 },
          styles.disabledInput,
        ]}
        value={email}
        onChangeText={text => setEmail(text.toLowerCase())}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={false}
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

      <PrimaryInput
        placeholder="Enter location"
        leftImageSource={icons.location}
        containerStyle={{ marginBottom: 15 }}
        value={selectedLocation ?? ''}
        onChangeText={setSelectedLocation}
      />
    </View>
  );
};

export default PersonalDetailsTab;

const useStyles = (colors: Theme['colors'], spacing: Theme['spacing']) =>
  StyleSheet.create({
    disabledInput: {
      backgroundColor: colors.background,
      opacity: 0.6,
    },
  });
