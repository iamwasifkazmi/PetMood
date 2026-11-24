import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  TouchableOpacity,
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import ImagePicker, { ImageOrVideo } from 'react-native-image-crop-picker';
import AppText from '../../../components/Text/AppText';
import AntDesign from 'react-native-vector-icons/AntDesign';
import EmojiPicker from '../../../components/EmojiPicker';

interface CreatePostViewProps {
  formData: CreatePostArg;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostArg>>;
  errorText?: string;
}

const CreatePostView: React.FC<CreatePostViewProps> = ({
  formData,
  setFormData,
  errorText,
}) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [inputHeight, setInputHeight] = useState(120);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handlePickImage = async () => {
    try {
      setShowEmojiPicker(false);
      const result = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        cropping: true,
        compressImageQuality: 0.8,
      });

      const timestamp = Date.now();
      const selectedImages = Array.isArray(result)
        ? result.map((img: ImageOrVideo, index: number) => ({
            uri: img.path.startsWith('file://') ? img.path : `file://${img.path}`,
            type: img.mime || 'image/jpeg',
            fileName: img.filename || `image_${timestamp}_${index}.jpg`,
          }))
        : [
            {
              uri: (result as ImageOrVideo).path.startsWith('file://')
                ? (result as ImageOrVideo).path
                : `file://${(result as ImageOrVideo).path}`,
              type: (result as ImageOrVideo).mime || 'image/jpeg',
              fileName:
                (result as ImageOrVideo).filename || `image_${timestamp}.jpg`,
            },
          ];

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...selectedImages],
      }));
    } catch {
      // user cancelled
    }
  };

  const handleToggleEmoji = () => {
    Keyboard.dismiss();
    setShowEmojiPicker(prev => !prev);
  };

  const handleSelectEmoji = (emoji: string) => {
    setFormData(prev => ({ ...prev, content: prev.content + emoji }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
    >
      <View
        style={[
          styles.container,
          { borderColor: colors.border, minHeight: inputHeight + 40 },
        ]}
      >
        <TextInput
          style={[styles.input, { height: inputHeight }]}
          placeholder="What’s on your mind..."
          placeholderTextColor={colors.placeholder}
          multiline
          value={formData.content}
          onChangeText={text =>
            setFormData(prev => ({ ...prev, content: text }))
          }
          onFocus={() => setShowEmojiPicker(false)}
          onContentSizeChange={e =>
            setInputHeight(Math.max(120, e.nativeEvent.contentSize.height))
          }
        />
        {!!errorText && (
          <AppText size={12} color={colors.danger} style={{ marginBottom: 10 }}>
            {errorText}
          </AppText>
        )}

        {formData?.images?.length > 0 && (
          <FlatList
            horizontal
            data={formData.images}
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 12 }}
            renderItem={({ item, index }) => (
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() =>
                    setFormData(prev => ({
                      ...prev,
                      images: prev.images.filter((_, i) => i !== index),
                    }))
                  }
                  hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
                >
                  {icons.cross ? (
                    <Image
                      source={icons.cross}
                      style={{ width: 14, height: 14, tintColor: '#fff' }}
                    />
                  ) : (
                    <AntDesign name="close" size={14} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        <View style={styles.iconRow}>
          <TouchableOpacity onPress={handleToggleEmoji}>
            <Image
              source={icons.happy}
              style={[styles.icon, { tintColor: colors.caption }]}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickImage}>
            <Image
              source={icons.gallery}
              style={[styles.icon, { tintColor: colors.caption }]}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleSelectEmoji}
      />
    </KeyboardAvoidingView>
  );
};

export default CreatePostView;

const useStyles = (
  colors: Theme['colors'],
  _fonts: Theme['fonts'],
  _spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    container: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 12,
      justifyContent: 'flex-start',
      marginHorizontal: 24,
      marginTop: 10,
    },
    input: {
      fontSize: 16,
      color: colors.text,
      textAlignVertical: 'top',
      marginBottom: 10,
    },
    iconRow: {
      flexDirection: 'row',
      position: 'absolute',
      bottom: 10,
      right: 10,
      gap: 12,
    },
    icon: {
      width: 24,
      height: 24,
    },
    imageWrapper: {
      borderRadius: 8,
      marginRight: 8,
      position: 'relative',
    },
    selectedImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    removeImageBtn: {
      position: 'absolute',
      top: 4,
      right: 4,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 12,
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
  });
