import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Cursor,
  RenderCellOptions,
} from 'react-native-confirmation-code-field';
import { useTheme } from '../../hooks/useTheme';

const CellCard = ({ index, isFocused, symbol }: RenderCellOptions) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      width: 50,
      height: 50,
      borderRadius: 7,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.card,
      marginHorizontal: 6,
      borderColor: colors.primary,
      borderWidth: 1,
      ...(isFocused && {
        backgroundColor: `${colors.primary}20`,
      }),
    },
    text: {
      bottom: 2,
      fontSize: symbol || isFocused ? 25 : 30,
      color: symbol ? colors.text : colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{symbol || (isFocused ? <Cursor /> : '')}</Text>
    </View>
  );
};

export default CellCard;
