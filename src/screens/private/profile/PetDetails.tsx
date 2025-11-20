import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import React from 'react';
import images from '../../../assets/images';
import EmotionResultCard from '../../../components/cards/EmotionResultCard';
import icons from '../../../assets/icons/icons';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import { useTheme } from '../../../hooks/useTheme';
import moment from 'moment';

interface Props {
  containerStyle?: ViewStyle;
  onDelete?: () => void;
  onEdit?: () => void;
  petDetails: createPetRes;
}
const PetDetails = ({
  containerStyle,
  onDelete,
  onEdit,
  petDetails,
}: Props) => {
  const { colors } = useTheme();
  return (
    <View style={[containerStyle, { gap: 24 }]}>
      <Image
        source={images.pet_detail}
        style={{
          width: '100%',
          height: 160,
          borderRadius: 16,
          overflow: 'hidden',
        }}
      />
      <EmotionResultCard
        Data={[
          {
            label: 'Name',
            categoryValue: petDetails?.name,
            icon: icons.dog_icon,
          },
          {
            label: 'Pet Gender',
            categoryValue: petDetails?.gender,
            icon: icons.pin_up,
          },
          {
            label: 'Pet Specie',
            categoryValue: petDetails?.species,
            icon: icons.paw,
          },
          {
            label: 'Pet Breed',
            categoryValue: petDetails?.breed,
            icon: icons.paw,
          },
          {
            label: 'Date of Birth',
            categoryValue:
              petDetails?.dateOfBirth &&
              moment(petDetails?.dateOfBirth).format('DD MMM, YYYY'),
            icon: icons.calendar,
          },
        ]}
      />

      {onDelete && onEdit && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <PrimaryButton
            onPress={onDelete}
            title="Delete"
            style={{ width: '47%', backgroundColor: colors.danger }}
          />
          <PrimaryButton
            onPress={onEdit}
            title="Edit"
            style={{ width: '47%' }}
          />
        </View>
      )}
    </View>
  );
};

export default PetDetails;

const styles = StyleSheet.create({});
