import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  ImageStyle,
  StyleProp,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import { getDropdownStyle } from './styles';

interface DropdownOption {
  label: string;
  value: string | number;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  placeholder?: string;
  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
  dropdownIconSize?: number;
  leftIcon?: ImageSourcePropType; // 👈 new prop
  leftIconStyle?: StyleProp<ImageStyle>;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = 'Select an option',
  containerStyle,
  buttonStyle,
  textStyle,
  iconColor = '#1C6971',
  dropdownIconSize = 15,
  leftIcon, // 👈 destructure new prop
  leftIconStyle,
}) => {
  const styles = getDropdownStyle();
  const [showPicker, setShowPicker] = useState(false);

  const selectedLabel =
    options.find(opt => opt.value === selectedValue)?.label || placeholder;

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[styles.dropdownButton, buttonStyle]}
        onPress={() => setShowPicker(prev => !prev)}
        activeOpacity={0.7}
      >
        {leftIcon && (
          <Image style={[styles.leftIcon, leftIconStyle]} source={leftIcon} />
        )}
        <Text
          style={[
            styles.selectedText,
            !selectedValue && styles.placeholderText,
            textStyle,
          ]}
          numberOfLines={1}
        >
          {selectedLabel}
        </Text>
        <Icon
          name={showPicker ? 'up' : 'down'}
          size={dropdownIconSize}
          color={iconColor}
        />
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedValue}
            onValueChange={itemValue => {
              onValueChange(itemValue);
              setShowPicker(false);
            }}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label={placeholder} value="" color="#999" />
            {options.map(item => (
              <Picker.Item
                key={item.value.toString()}
                label={item.label}
                value={item.value}
              />
            ))}
          </Picker>
        </View>
      )}
    </View>
  );
};

export default CustomDropdown;
