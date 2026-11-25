import { ActionSheetIOS, Alert, Platform } from 'react-native';
import ImagePicker, { ImageOrVideo } from 'react-native-image-crop-picker';
import { requestCameraPermission } from '../services/permission';
import { showErrMsg } from './flashMessage';

export type PickedImage = {
  path: string;
  mime?: string;
  filename?: string;
};

type PickOptions = {
  width?: number;
  height?: number;
  cropping?: boolean;
  multiple?: boolean;
};

function normalizePath(image: ImageOrVideo): PickedImage {
  const path = image.path?.startsWith('file://')
    ? image.path
    : image.path?.startsWith('/')
      ? `file://${image.path}`
      : image.path;
  return {
    path,
    mime: image.mime,
    filename: image.filename || undefined,
  };
}

async function openCamera(options: PickOptions): Promise<PickedImage | null> {
  const allowed = await requestCameraPermission();
  if (!allowed) {
    showErrMsg('Camera permission is required to take a photo.');
    return null;
  }
  try {
    const image = await ImagePicker.openCamera({
      width: options.width ?? 300,
      height: options.height ?? 300,
      cropping: options.cropping ?? true,
      mediaType: 'photo',
      compressImageQuality: 0.85,
    });
    return normalizePath(image);
  } catch (e: any) {
    if (e?.code !== 'E_PICKER_CANCELLED') {
      showErrMsg('Could not open the camera. Please try again.');
    }
    return null;
  }
}

async function openGallery(
  options: PickOptions,
): Promise<PickedImage | PickedImage[] | null> {
  try {
    const result = await ImagePicker.openPicker({
      width: options.width ?? 300,
      height: options.height ?? 300,
      cropping: options.multiple ? false : (options.cropping ?? true),
      mediaType: 'photo',
      multiple: options.multiple ?? false,
      compressImageQuality: 0.85,
      // iOS: present picker even with Limited Photos access
      forceJpg: Platform.OS === 'ios',
    });

    if (Array.isArray(result)) {
      return result.map(normalizePath);
    }
    return normalizePath(result);
  } catch (e: any) {
    if (e?.code !== 'E_PICKER_CANCELLED') {
      showErrMsg(
        Platform.OS === 'ios'
          ? 'Could not open Photos. Check Settings → AIPetMood → Photos, then try again.'
          : 'Could not open the photo gallery. Please try again.',
      );
    }
    return null;
  }
}

/**
 * Shows Camera / Gallery / Cancel. Returns one local image path (file://…).
 * Clear options fix the iOS “no gallery option” confusion (camera-only icon).
 */
export function pickProfileImage(
  options: PickOptions = {},
): Promise<PickedImage | null> {
  return new Promise(resolve => {
    const finish = (value: PickedImage | null) => resolve(value);

    const run = async (source: 'camera' | 'gallery') => {
      if (source === 'camera') {
        finish(await openCamera(options));
        return;
      }
      const picked = await openGallery({ ...options, multiple: false });
      finish(Array.isArray(picked) ? picked[0] ?? null : picked);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) void run('camera');
          else if (buttonIndex === 2) void run('gallery');
          else finish(null);
        },
      );
      return;
    }

    Alert.alert('Add photo', 'Choose a source', [
      { text: 'Cancel', style: 'cancel', onPress: () => finish(null) },
      { text: 'Take Photo', onPress: () => void run('camera') },
      { text: 'Choose from Gallery', onPress: () => void run('gallery') },
    ]);
  });
}
