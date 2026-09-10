import React from 'react';
import { StyleSheet } from 'react-native';
import AppText from '../Text/AppText';
import { useTheme } from '../../hooks/useTheme';

interface FieldErrorProps {
  message?: string | null;
}

const FieldError = ({ message }: FieldErrorProps) => {
  const { colors } = useTheme();
  if (!message) {
    return null;
  }
  return (
    <AppText size={12} color={colors.danger} style={styles.error}>
      {message}
    </AppText>
  );
};

export default FieldError;

const styles = StyleSheet.create({
  error: {
    marginTop: 4,
    marginLeft: 4,
  },
});
