import { View } from 'react-native';
import React from 'react';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import icons from '../../../assets/icons/icons';

export type SecurityFieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  errors?: SecurityFieldErrors;
}

const SecurityTab = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
}: SecurityTabProps) => {
  return (
    <View>
      <PrimaryInput
        placeholder="Current Password"
        rightImageSource={icons.eye}
        wrapperStyle={{ marginBottom: 15 }}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        leftImageSource={icons.lock}
        error={errors?.currentPassword}
        textContentType="password"
        autoComplete="password"
      />
      <PrimaryInput
        placeholder="New Password"
        rightImageSource={icons.eye}
        wrapperStyle={{ marginBottom: 15 }}
        value={newPassword}
        onChangeText={setNewPassword}
        leftImageSource={icons.lock}
        secureTextEntry
        error={errors?.newPassword}
        textContentType="newPassword"
        autoComplete="password-new"
      />
      <PrimaryInput
        placeholder="Confirm New Password"
        rightImageSource={icons.eye}
        wrapperStyle={{ marginBottom: 15 }}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        leftImageSource={icons.lock}
        error={errors?.confirmPassword}
        textContentType="newPassword"
        autoComplete="password-new"
      />
    </View>
  );
};

export default SecurityTab;
