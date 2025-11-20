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
} from 'react-native';
import { useTheme } from '../../../hooks/useTheme';
import icons from '../../../assets/icons/icons';
import { Theme } from '../../../common/theme';
import EmojiSelector from 'react-native-emoji-selector';
import ImagePicker, { ImageOrVideo } from 'react-native-image-crop-picker';

interface CreatePostViewProps {
  formData: CreatePostArg;
  setFormData: React.Dispatch<React.SetStateAction<CreatePostArg>>;
}

const CreatePostView: React.FC<CreatePostViewProps> = ({
  formData,
  setFormData,
}) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);

  const [inputHeight, setInputHeight] = useState(120);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // 📸 Pick and crop images
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.openPicker({
        multiple: true,
        mediaType: 'photo',
        cropping: true,
        compressImageQuality: 0.8,
      });

      const selectedImages = Array.isArray(result)
        ? result.map((img: ImageOrVideo) => ({ uri: img.path }))
        : [{ uri: (result as ImageOrVideo).path }];

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...selectedImages],
      }));
    } catch (err) {}
  };

  // 😄 Toggle emoji picker
  const handleToggleEmoji = () => {
    setShowEmojiPicker(prev => !prev);
  };

  // 😀 Add emoji to content
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
          onContentSizeChange={e =>
            setInputHeight(Math.max(120, e.nativeEvent.contentSize.height))
          }
        />

        {/* Image preview */}
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
                >
                  <Image
                    source={icons.close}
                    style={{ width: 14, height: 14, tintColor: '#fff' }}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        )}

        {/* Icon row */}
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

      {/* Emoji Selector */}
      {showEmojiPicker && (
        <EmojiSelector
          onEmojiSelected={handleSelectEmoji}
          showSearchBar={false}
          showTabs={true}
          showHistory={true}
          showSectionTitles={false}
          columns={8}
          style={{ height: 250 }}
          theme={{
            background: colors.background,
            header: colors.card,
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
};

export default CreatePostView;

// --- Styles
const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
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
      overflow: 'hidden',
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
      padding: 2,
    },
  });
