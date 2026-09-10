import React, { useState, forwardRef } from 'react';
import {
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import { useTheme } from '../../hooks/useTheme';
import Feather from 'react-native-vector-icons/Feather';
import type { IconProps } from 'react-native-vector-icons/Icon';
import FieldError from './FieldError';

type PrimaryInputProps = TextInputProps & {
  containerStyle?: ViewStyle;
  wrapperStyle?: ViewStyle;
  rightImageSource?: FastImageProps['source'];
  leftImageSource?: FastImageProps['source'];
  error?: string | null;
  required?: boolean;

  leftIcon?: string;
  rightIcon?: string;
  LeftIconComponent?: React.ComponentType<IconProps>;
  RightIconComponent?: React.ComponentType<IconProps>;
  onLeftIconPress?: () => void;
  onRightIconPress?: () => void;

  iconSize?: number;
  iconColor?: string;
};

const PrimaryInput = forwardRef<TextInput, PrimaryInputProps>(function PrimaryInput(
  {
    containerStyle,
    wrapperStyle,
    rightImageSource,
    leftImageSource,
    error,
    required,
    leftIcon,
    rightIcon,
    LeftIconComponent,
    RightIconComponent,
    onLeftIconPress,
    onRightIconPress,
    iconSize = 20,
    iconColor = '#1C6971',
    placeholder,
    ...props
  },
  ref,
) {
  const { colors, fonts } = useTheme();

  const [isFocused, setIsFocused] = useState(false);
  const [isSecure, setIsSecure] = useState(props.secureTextEntry ?? false);

  const hasError = Boolean(error);

  const styles = StyleSheet.create({
    wrapper: {
      marginTop: 10,
    },
    container: {
      borderWidth: 1,
      borderColor: hasError
        ? colors.danger
        : isFocused
          ? '#7C7C7C'
          : colors.inputBorder,
      minHeight: 46,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderRadius: 6,
      paddingHorizontal: 15,
      alignItems: 'center',
      backgroundColor: colors.card,
      gap: 12,
    },
    input: {
      flex: 1,
      minHeight: 40,
      paddingVertical: 8,
      fontSize: 15,
      ...fonts.medium,
      color: colors.text,
    },
    rightImage: {
      marginLeft: 10,
      width: 20,
      height: 20,
    },
  });

  const resolvedColor = iconColor || colors.text;
  const resolvedPlaceholder =
    required && placeholder ? `${placeholder} *` : placeholder;

  const handleRightPress = () => {
    if (props.secureTextEntry) {
      setIsSecure(prev => !prev);
    } else {
      onRightIconPress?.();
    }
  };

  return (
    <View style={[styles.wrapper, wrapperStyle]}>
      <View style={[styles.container, containerStyle]}>
      {/* Left Image or Icon */}
      {leftImageSource ? (
        <FastImage
          source={leftImageSource}
          style={{ ...styles.rightImage, marginLeft: 0 }}
          resizeMode="contain"
        />
      ) : LeftIconComponent && leftIcon ? (
        <TouchableOpacity onPress={onLeftIconPress}>
          <LeftIconComponent
            name={leftIcon}
            size={iconSize}
            color={resolvedColor}
          />
        </TouchableOpacity>
      ) : null}

      {/* TextInput */}
      <TextInput
        ref={ref}
        placeholder={resolvedPlaceholder}
        placeholderTextColor={colors.placeholder}
        {...props}
        onFocus={e => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        secureTextEntry={isSecure}
        style={[styles.input, props.style]}
      />

      {/* Right Image / Icon / Eye toggle */}
      {props.secureTextEntry ? (
        <TouchableOpacity onPress={handleRightPress}>
          <Feather
            name={isSecure ? 'eye-off' : 'eye'}
            size={iconSize}
            color={resolvedColor}
          />
        </TouchableOpacity>
      ) : rightImageSource ? (
        <TouchableOpacity onPress={onRightIconPress}>
          <FastImage
            source={rightImageSource}
            style={styles.rightImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : RightIconComponent && rightIcon ? (
        <TouchableOpacity onPress={onRightIconPress}>
          <RightIconComponent
            name={rightIcon}
            size={iconSize}
            color={resolvedColor}
          />
        </TouchableOpacity>
      ) : null}
      </View>
      <FieldError message={error} />
    </View>
  );
});

export default PrimaryInput;
