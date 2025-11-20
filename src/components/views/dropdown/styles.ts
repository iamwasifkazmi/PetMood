import { Platform, StyleSheet } from 'react-native';
import { Theme } from '../../../common/theme';
import { useTheme } from '../../../hooks/useTheme';

export const getDropdownStyle = () => {
  const { colors, fonts } = useTheme();
  return StyleSheet.create({
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
    },
    selectedText: {
      flex: 1,
      fontSize: 15,
      color: '#333',
      ...fonts.medium,
    },
    placeholderText: {
      color: '#999',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      maxHeight: '50%',
    },
    header: {
      padding: 12,
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    doneButton: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    pickerContainer: {
      paddingHorizontal: Platform.OS === 'android' ? 0 : 12,
    },
    picker: {
      backgroundColor: colors.card,
    },
    pickerItem: {
      fontSize: 16,
    },
    leftIcon: {
      marginRight: 12,
      width: 20,
      height: 20,
      resizeMode: 'contain',
    },
  });
};
