import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import images from '../../assets/images';
import { Theme } from '../../common/theme';
import AppText from '../Text/AppText';
import icons from '../../assets/icons/icons';
import moment from 'moment';

interface AnimalDataProps {
  ANIMAL_DATA: createPetRes[];
  showEmotions?: boolean;
  onPressItem?: () => void;
  setPetDetails?: (pet: createPetRes) => void;
  refetch?: () => void;
  isFetching?: boolean;
  selectable?: boolean; // ✅ optional feature
  selectedPetId?: string | null; // ✅ track selected pet
  onSelectPet?: (pet: createPetRes) => void; // ✅ callback on selection
}

const AnimalList = ({
  item,
  index,
  showEmotions,
  onPressItem,
  selectable,
  selectedPetId,
  onSelectPet,
}: {
  item: createPetRes;
  index: number;
  showEmotions?: boolean;
  onPressItem?: () => void;
  selectable?: boolean;
  selectedPetId?: string | null;
  onSelectPet?: (pet: createPetRes) => void;
}) => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const evenElement = index % 2 === 0;

  const isSelected = selectable && selectedPetId === item?.id;
  return (
    <Pressable
      style={[
        styles.container,
        isSelected && { borderColor: colors.primary, borderWidth: 1 },
      ]}
      onPress={() => {
        if (selectable) {
          onSelectPet?.(item);
        } else {
          onPressItem?.();
        }
      }}
    >
      <View style={styles.topInnerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image
            source={
              item?.image || item?.photoUrl
                ? { uri: item.image || item.photoUrl }
                : images.dog_rounded
            }
            style={styles.image}
            resizeMode="cover"
          />
          <View style={{ marginLeft: 16 }}>
            <AppText variant="heading" size={14}>
              {item?.name || item?.pet?.name}
            </AppText>
            <AppText variant="body" size={14} color={colors.caption}>
              {item?.species || item?.pet?.species}{' '}
              <AppText size={12} variant="subheading" color={colors.greyLight}>
                |
              </AppText>{' '}
              {item?.breed || item?.pet?.breed}
            </AppText>
          </View>
        </View>

        {!showEmotions && (
          <View
            style={{
              ...styles.indicatorContainer,
              backgroundColor: evenElement
                ? colors.blueIndicator
                : colors.pinkIndicator,
            }}
          >
            <Image
              style={styles.indicatorImage}
              source={evenElement ? icons.pin_up : icons.pin_down}
            />
          </View>
        )}
      </View>

      {showEmotions && (
        <View>
          <View style={styles.dateTimeRow}>
            <View style={styles.innerRow}>
              <Image
                source={icons.calendar}
                style={{ width: 16, height: 16, resizeMode: 'contain' }}
              />
              <AppText>{'Date & Time'}</AppText>
            </View>
            <AppText>{moment(item?.timestamp).format('lll')}</AppText>
          </View>

          <View style={styles.separator} />

          <View style={{ ...styles.dateTimeRow, marginTop: 0 }}>
            <View style={styles.innerRow}>
              <Image
                source={icons.dog_icon}
                style={{ width: 16, height: 16, resizeMode: 'contain' }}
              />
              <AppText>{'Detected Emotion'}</AppText>
            </View>
            <View style={styles.moodView}>
              <Image
                source={icons.happy}
                style={{ width: 16, height: 16, resizeMode: 'contain' }}
              />
              <AppText color={colors.green} fontWeight="medium">
                {item?.emotion}
              </AppText>
            </View>
          </View>
        </View>
      )}
    </Pressable>
  );
};

const PetListCard = ({
  ANIMAL_DATA,
  showEmotions,
  onPressItem,
  setPetDetails,
  refetch,
  isFetching,
  selectable = false,
  selectedPetId,
  onSelectPet,
}: AnimalDataProps) => {
  const { colors } = useTheme();

  if (isFetching && (!ANIMAL_DATA || ANIMAL_DATA.length === 0)) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 40,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText style={{ marginTop: 10 }} color={colors.caption}>
          Loading pets...
        </AppText>
      </View>
    );
  }

  return (
    <FlatList
      data={ANIMAL_DATA}
      keyExtractor={item => item?.id?.toString()}
      showsVerticalScrollIndicator={false}
      renderItem={({ item, index }) => (
        <AnimalList
          item={item}
          index={index}
          showEmotions={showEmotions}
          onPressItem={() => {
            onPressItem?.();
            setPetDetails?.(item);
          }}
          selectable={selectable}
          selectedPetId={selectedPetId}
          onSelectPet={onSelectPet}
        />
      )}
      ListEmptyComponent={() => (
        <AppText style={{ alignSelf: 'center', marginTop: 40 }}>
          No Pets Found
        </AppText>
      )}
      contentContainerStyle={{ paddingBottom: 80 }}
      ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      refreshing={isFetching || false}
      onRefresh={refetch}
    />
  );
};

export default PetListCard;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: spacing.lg,
      padding: 15,
      backgroundColor: colors.card,
    },
    image: { width: 50, height: 50, borderRadius: 50 },
    indicatorContainer: {
      backgroundColor: '#D1E6FF80',
      width: 40,
      height: 40,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topInnerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    indicatorImage: { width: 20, height: 20, resizeMode: 'contain' },
    separator: {
      width: '100%',
      borderWidth: 0.5,
      borderColor: colors.border,
      marginTop: 12,
      marginBottom: 16,
    },
    dateTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
    },
    innerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moodView: {
      backgroundColor: colors.lightGreen,
      alignItems: 'center',
      flexDirection: 'row',
      padding: 8,
      borderRadius: 50,
      paddingVertical: 4,
      gap: 6,
    },
  });
