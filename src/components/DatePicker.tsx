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
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Feather from 'react-native-vector-icons/Feather';
import { useTheme } from '../hooks/useTheme';
import { useSafeBottomPadding } from '../hooks/useSafeBottomPadding';
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
  const bottomPad = useSafeBottomPadding(12);
  const [isOpen, setIsOpen] = useState(false);
  const [tempDate, setTempDate] = useState<Date>(value || new Date());
  const opacity = useSharedValue(0);

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleOpen = () => {
    setTempDate(value || new Date());
    setIsOpen(true);
    opacity.value = 1;
  };

  const handleClose = () => {
    setIsOpen(false);
    opacity.value = 0;
  };

  const handleConfirm = () => {
    onDateChange(tempDate);
    handleClose();
  };

  const handleAndroidChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    // Android system dialog — close our flag so we don't keep a second UI open
    setIsOpen(false);
    if (event.type === 'dismissed') {
      return;
    }
    if (selectedDate) {
      onDateChange(selectedDate);
    }
  };

  const handleIosChange = (
    _event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
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
      paddingBottom: bottomPad,
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
      flexDirection: 'row',
      gap: 12,
    },
    cancelButton: {
      flex: 1,
    },
    confirmButton: {
      flex: 1,
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

      {/* Android: native dialog only — avoids double calendar + custom sheet */}
      {Platform.OS === 'android' && isOpen ? (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          onChange={handleAndroidChange}
        />
      ) : null}

      {/* iOS: custom bottom sheet with spinner + Cancel/Confirm */}
      {Platform.OS === 'ios' ? (
        <Modal
          visible={isOpen}
          transparent
          animationType="fade"
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
                  display="spinner"
                  maximumDate={maximumDate}
                  minimumDate={minimumDate}
                  onChange={handleIosChange}
                  style={styles.iosPicker}
                  themeVariant="light"
                  textColor={colors.text}
                />
              </View>

              <View style={styles.buttonContainer}>
                <PrimaryButton
                  type="outlined"
                  title="Cancel"
                  onPress={handleClose}
                  style={styles.cancelButton}
                />
                <PrimaryButton
                  title="Confirm"
                  onPress={handleConfirm}
                  style={styles.confirmButton}
                />
              </View>
            </View>
          </Animated.View>
        </Modal>
      ) : null}
    </View>
  );
};

export default DatePicker;
