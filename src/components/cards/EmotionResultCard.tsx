import React from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { Theme } from '../../common/theme';
import { useTheme } from '../../hooks/useTheme';
import AppText from '../Text/AppText';
import icons from '../../assets/icons/icons';

interface itemProps {
  label: string;
  icon: ImageSourcePropType;
  categoryValue: string;
  suggestions?: boolean;
  isEmotionType?: boolean;
}
interface EmotionResultCardProps {
  Data: itemProps[];
}

const EmotionResultCard: React.FC<EmotionResultCardProps> = ({ Data }) => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const renderItem = ({
    item,
  }: {
    item: EmotionResultCardProps['Data'][0];
  }) => {
    return item?.suggestions ? (
      <View style={{}}>
        <View style={styles.left}>
          <Image
            source={item?.icon}
            style={[styles.icon, { tintColor: colors.primary }]}
          />
          <AppText fontWeight="medium">{item?.label}</AppText>
        </View>
        <AppText style={{ marginLeft: 3 }}>{item?.categoryValue}</AppText>
      </View>
    ) : (
      <Row
        icon={item?.icon}
        label={item?.label}
        value={item?.categoryValue}
        valueComponent={
          item?.isEmotionType ? (
            <View style={styles.happinessView}>
              <Image
                source={icons.happy}
                style={{ width: 16, height: 16, resizeMode: 'contain' }}
              />
              <AppText fontWeight="medium" style={{ color: colors.green }}>
                {item?.categoryValue}
              </AppText>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <FlatList
      data={Data}
      keyExtractor={item => item.label}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.container}
    />
  );
};
export default EmotionResultCard;

const Row = ({
  icon,
  label,
  value,
  valueComponent,
  iconTint = false,
}: {
  icon: ImageSourcePropType;
  label: string;
  value?: string;
  valueComponent?: React.ReactNode;
  iconTint?: boolean;
}) => {
  const { colors } = useTheme();
  const styles = useRowStyles(colors);

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Image
          source={icon}
          style={[styles.icon, { tintColor: colors.primary }]}
        />
        <AppText fontWeight="medium">{label}</AppText>
      </View>
      {valueComponent ? (
        valueComponent
      ) : value ? (
        <AppText>{value}</AppText>
      ) : null}
    </View>
  );
};

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
      padding: spacing.padding,
      paddingBottom: 16,
    },
    separator: {
      width: '100%',
      borderWidth: 0.5,
      borderColor: colors.border,
      marginTop: 12,
      marginBottom: 16,
    },
    moodView: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 50,
      gap: 6,
    },
    emotionIcon: {
      width: 16,
      height: 16,
      resizeMode: 'contain',
    },
    suggestionText: {
      marginLeft: 8,
      marginTop: 4,
      color: colors.text,
    },
    icon: {
      width: 16,
      height: 16,
      resizeMode: 'contain',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    happinessView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.lightGreen,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 230,
    },
  });

const useRowStyles = (colors: Theme['colors']) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    icon: {
      width: 16,
      height: 16,
      resizeMode: 'contain',
    },
  });
