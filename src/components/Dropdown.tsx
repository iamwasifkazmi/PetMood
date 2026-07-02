import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageSourcePropType,
  ImageStyle,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
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

export interface DropdownOption {
  label: string;
  value: string | number;
}

interface DropdownProps {
  options: DropdownOption[];
  selectedValue?: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  dropdownIconSize?: number;
  leftIcon?: ImageSourcePropType;
  leftIconStyle?: StyleProp<ImageStyle>;
  itemTextStyle?: StyleProp<TextStyle>;
  maxHeight?: number;
  /** Show a search field to filter options by label (useful for long lists). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  containerStyle,
  buttonStyle,
  textStyle,
  iconColor,
  dropdownIconSize = 20,
  leftIcon,
  leftIconStyle,
  itemTextStyle,
  maxHeight = 300,
  searchable = false,
  searchPlaceholder = 'Search...',
}) => {
  const { colors, fonts } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  const selectedLabel =
    options.find(opt => opt.value === selectedValue)?.label || placeholder;
  const isPlaceholder = !selectedValue || !options.find(opt => opt.value === selectedValue);

  const animatedChevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleOpen = () => {
    setSearchQuery('');
    setIsOpen(true);
    rotation.value = withTiming(180, { duration: 200 });
    scale.value = withTiming(1.1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 200 });
  };

  const handleClose = () => {
    setSearchQuery('');
    rotation.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(setIsOpen)(false);
    });
  };

  const handleSelect = (value: string | number) => {
    onValueChange(value);
    handleClose();
  };

  const filteredOptions = useMemo(() => {
    if (!searchable || !searchQuery.trim()) {
      return options;
    }
    const q = searchQuery.trim().toLowerCase();
    return options.filter(opt => opt.label.toLowerCase().includes(q));
  }, [options, searchable, searchQuery]);

  const styles = StyleSheet.create({
    container: {
      marginVertical: 8,
    },
    dropdownButton: {
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
      maxHeight: maxHeight,
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 20,
      marginTop: 12,
      marginBottom: 4,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 8,
      backgroundColor: colors.background,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: colors.text,
      padding: 0,
      ...fonts.regular,
    },
    optionsList: {
      flexGrow: 0,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionText: {
      fontSize: 16,
      color: colors.text,
      ...fonts.regular,
      flex: 1,
    },
    selectedOptionText: {
      ...fonts.medium,
      color: colors.primary,
    },
    checkIcon: {
      marginLeft: 12,
    },
    emptyOptions: {
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 14,
      color: colors.placeholder,
      ...fonts.regular,
    },
  });

  const resolvedIconColor = iconColor || colors.primary;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[styles.dropdownButton, buttonStyle]}
        onPress={handleOpen}
        activeOpacity={0.7}
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
            numberOfLines={1}
          >
            {selectedLabel}
          </AppText>
        </View>
        <Animated.View style={[styles.chevronContainer, animatedChevronStyle]}>
          <Feather
            name="chevron-down"
            size={dropdownIconSize}
            color={resolvedIconColor}
          />
        </Animated.View>
      </TouchableOpacity>

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

            {searchable && (
              <View style={styles.searchContainer}>
                <Feather name="search" size={18} color={colors.placeholder} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.placeholder}
                  style={styles.searchInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            )}

            <FlatList
              data={filteredOptions}
              keyExtractor={item => item.value.toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const isSelected = item.value === selectedValue;
                return (
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={() => handleSelect(item.value)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.selectedOptionText,
                        itemTextStyle,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && (
                      <Feather
                        name="check"
                        size={20}
                        color={colors.primary}
                        style={styles.checkIcon}
                      />
                    )}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionsList}
              contentContainerStyle={{ paddingBottom: 20 }}
              ListEmptyComponent={
                <View style={styles.emptyOptions}>
                  <Text style={styles.emptyText}>
                    {searchQuery.trim()
                      ? 'No matching breeds'
                      : 'No options available'}
                  </Text>
                </View>
              }
            />
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
};

export default Dropdown;

