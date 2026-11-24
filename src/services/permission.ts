import { PermissionsAndroid, Platform } from 'react-native';

export const requestCameraPermission = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'App needs access to your camera',
          buttonPositive: 'OK',
        },
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  }
  return true;
};

/**
 * Gallery picks use the Android system Photo Picker / GET_CONTENT — no
 * READ_MEDIA_IMAGES (Play policy). Always allow the picker UI to open.
 */
export const requestGalleryPermission = async () => {
  return true;
};
