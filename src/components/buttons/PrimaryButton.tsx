import React from 'react';
import {
  ActivityIndicator,
  ActivityIndicatorProps,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type PrimaryButtonProps = TouchableOpacityProps & {
  title: string;
  titleStyle?: TextStyle;
  loading?: boolean;
  type?: 'outlined' | 'filled';
  loadingProps?: ActivityIndicatorProps;
  renderRight?: () => React.JSX.Element;
  renderLeft?: () => React.JSX.Element;
};

const PrimaryButton = ({
  type = 'filled',
  renderRight,
  renderLeft,
  title,
  titleStyle,
  loading,
  loadingProps,
  ...props
}: PrimaryButtonProps) => {
  const { colors, fonts } = useTheme();

  const isOutlined = type === 'outlined';

  const styles = StyleSheet.create({
    container: {
      height: 45,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      borderRadius: 40,
      opacity: props.disabled ? 0.7 : 1,
      backgroundColor: isOutlined ? 'transparent' : colors.primary,
      ...(isOutlined && {
        borderWidth: 1,
        borderColor: colors.primary,
      }),
    },
    title: {
      color: isOutlined ? colors.primary : colors.invertText,
      fontSize: 15,
      ...fonts.bold,
      ...titleStyle,
    },
    loader: {
      marginRight: title ? 10 : 0,
    },
  });

  return (
    <TouchableOpacity {...props} style={[styles.container, props.style]}>
      {renderLeft && renderLeft()}

      {loading && (
        <ActivityIndicator
          animating
          color={colors.invertText}
          style={styles.loader}
          {...loadingProps}
        />
      )}
      <Text style={styles.title}>{title}</Text>
      {renderRight && renderRight()}
    </TouchableOpacity>
  );
};

export default PrimaryButton;
