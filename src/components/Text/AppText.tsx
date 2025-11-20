import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface AppTextProps extends TextProps {
  variant?: 'heading' | 'subheading' | 'body' | 'caption';
  color?: string;
  size?: number;
  fontWeight?: 'regular' | 'medium' | 'semiBold' | 'bold' | 'ssRegular';
}

const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  style,
  color,
  size,
  fontWeight,
  children,
  ...rest
}) => {
  const { colors, fonts } = useTheme();

  const variantStyles = {
    heading: {
      fontSize: 24,
      ...fonts.bold,
    },
    subheading: {
      fontSize: 20,
      ...fonts.semiBold,
    },

    body: {
      fontSize: 14,
      ...fonts.regular,
    },
    caption: {
      fontSize: 12,
      ...fonts.ssRegular,
    },
  };

  const fontStyle = fontWeight ? fonts[fontWeight] : {};

  return (
    <Text
      style={[
        styles.base,
        { color: color || colors.text },
        variantStyles[variant],
        fontStyle,
        size ? { fontSize: size } : {},
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

export default AppText;
