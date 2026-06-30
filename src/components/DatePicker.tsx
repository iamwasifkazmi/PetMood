import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import AppText from './Text/AppText';
import PrimaryButton from './buttons/PrimaryButton';

interface DatePickerProps {
  value?: Date | null;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: ImageSourcePropType;
  leftIconStyle?: StyleProp<ImageStyle>;
  maximumDate?: Date;
  minimumDate?: Date;
  formatDate?: (date: Date | null) => string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onDateChange,
  placeholder = 'Select Date',
  containerStyle,
  buttonStyle,
  textStyle,
  leftIcon,
  leftIconStyle,
  maximumDate = new Date(),
  minimumDate,
  formatDate,
}) => {
  const { colors, fonts } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const opacity = useSharedValue(0);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleOpen = () => {
    setTempDate(value || new Date());
    setIsOpen(true);
    opacity.value = withTiming(1, { duration: 200 });
  };

  const handleClose = () => {
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setIsOpen)(false);
    });
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    handleClose();
  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  const defaultFormatDate = (date: Date | null) => {
    if (!date) return placeholder;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const displayText = formatDate
    ? formatDate(value)
    : defaultFormatDate(value);
  const isPlaceholder = !value;
  const resolvedIconColor = colors.primary;

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    datePickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      backgroundColor: colors.card,
      minHeight: 50,
    },
    buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: 12,
    },
    selectedText: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      ...fonts.medium,
    },
    placeholderText: {
      color: colors.placeholder,
    },
    leftIcon: {
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
    chevronContainer: {
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 18,
      ...fonts.semiBold,
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    pickerContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    iosPicker: {
      width: '100%',
      height: 216,
    },
    buttonContainer: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
  });

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        style={[styles.datePickerButton, buttonStyle]}
        onPress={handleOpen}
      >
        <View style={styles.buttonContent}>
          {leftIcon && (
            <Image
              source={leftIcon}
              style={[
                styles.leftIcon,
                leftIconStyle,
                leftIconStyle && { tintColor: resolvedIconColor },
              ]}
            />
          )}
          <AppText
            style={[
              styles.selectedText,
              isPlaceholder && styles.placeholderText,
              textStyle,
            ]}
          >
            {displayText}
          </AppText>
        </View>
        <View style={styles.chevronContainer}>
          <Feather name="chevron-down" size={20} color={resolvedIconColor} />
        </View>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="none"
        onRequestClose={handleClose}
      >
        <Animated.View style={[styles.modalOverlay, animatedModalStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <AppText style={styles.modalTitle} variant="subheading">
                {placeholder}
              </AppText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Feather name="x" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                onChange={handleDateChange}
                style={Platform.OS === 'ios' ? styles.iosPicker : undefined}
                {...(Platform.OS === 'ios'
                  ? {
                      // Modal sheet is light; without this, iOS Dark Mode uses white
                      // picker text on a white background (invisible on some devices).
                      themeVariant: 'light' as const,
                      textColor: colors.text,
                    }
                  : {})}
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton title="Confirm" onPress={handleConfirm} />
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default DatePicker;

