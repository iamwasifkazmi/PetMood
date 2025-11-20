import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import React from 'react';
import { useTheme } from '../../hooks/useTheme';
import { Theme } from '../../common/theme';

interface CardViewProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardView = ({ children, style }: CardViewProps) => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container(colors, spacing), style]}>{children}</View>
  );
};

export default CardView;

const styles = {
  container: (colors: Theme['colors'], spacing: Theme['spacing']) =>
    StyleSheet.create({
      container: {
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.padding,
        borderRadius: 24,
        backgroundColor: colors.card,
      },
    }).container,
};
