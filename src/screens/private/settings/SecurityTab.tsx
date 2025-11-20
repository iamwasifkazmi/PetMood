import { StyleSheet, View } from 'react-native';
import React from 'react';
import PrimaryInput from '../../../components/inputs/PrimaryInput';
import icons from '../../../assets/icons/icons';

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
}

const SecurityTab = ({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
}: SecurityTabProps) => {
  return (
    <View style={{}}>
      <PrimaryInput
        placeholder="Current Password"
        rightImageSource={icons.eye}
        containerStyle={{ marginBottom: 15 }}
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        leftImageSource={icons.lock}
      />
      <PrimaryInput
        placeholder="New Password"
        rightImageSource={icons.eye}
        containerStyle={{ marginBottom: 15 }}
        value={newPassword}
        onChangeText={setNewPassword}
        leftImageSource={icons.lock}
        secureTextEntry
      />
      <PrimaryInput
        placeholder="Confirm New Password"
        rightImageSource={icons.eye}
        containerStyle={{ marginBottom: 15 }}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        leftImageSource={icons.lock}
        style={{ marginBottom: 10 }}
      />
    </View>
  );
};

export default SecurityTab;

const styles = StyleSheet.create({});
