import React, { useMemo } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import AppText from './Text/AppText';

const EMOJIS = [
  '😀',
  '😃',
  '😄',
  '😁',
  '😆',
  '😅',
  '😂',
  '🤣',
  '😊',
  '😇',
  '🙂',
  '😉',
  '😍',
  '🥰',
  '😘',
  '😗',
  '😚',
  '😋',
  '😜',
  '🤪',
  '😝',
  '🤑',
  '🤗',
  '🤭',
  '🤫',
  '🤔',
  '🤐',
  '🤨',
  '😐',
  '😑',
  '😶',
  '🙄',
  '😏',
  '😣',
  '😥',
  '😮',
  '😯',
  '😪',
  '😫',
  '🥱',
  '😴',
  '😌',
  '😛',
  '😓',
  '😕',
  '🙃',
  '🫠',
  '😲',
  '☹️',
  '🙁',
  '😖',
  '😞',
  '😟',
  '😤',
  '😢',
  '😭',
  '😦',
  '😧',
  '😨',
  '😩',
  '🤯',
  '😬',
  '😰',
  '😱',
  '🥵',
  '🥶',
  '😳',
  '🤪',
  '😵',
  '🥴',
  '😠',
  '😡',
  '🤬',
  '😷',
  '🤒',
  '🤕',
  '🤢',
  '🤮',
  '🤧',
  '🥳',
  '🥺',
  '🤠',
  '🥸',
  '😎',
  '🤓',
  '🧐',
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🙈',
  '🙉',
  '🙊',
  '🐔',
  '🐧',
  '🐦',
  '🐤',
  '🦄',
  '🐝',
  '❤️',
  '🧡',
  '💛',
  '💚',
  '💙',
  '💜',
  '🖤',
  '🤍',
  '💔',
  '❣️',
  '💕',
  '💞',
  '💓',
  '💗',
  '💖',
  '💘',
  '💝',
  '👍',
  '👎',
  '👏',
  '🙌',
  '👐',
  '🤝',
  '🙏',
  '✌️',
  '🤞',
  '🤟',
  '🤘',
  '👌',
  '🤌',
  '👈',
  '👉',
  '👆',
  '👇',
  '☝️',
  '👋',
  '💪',
  '✨',
  '⭐',
  '🌟',
  '💫',
  '🔥',
  '💯',
  '🎉',
  '🎊',
  '🎈',
  '🎁',
  '🏆',
  '🥇',
  '☀️',
  '🌈',
  '🌸',
  '🌺',
  '🌻',
  '🍀',
  '☕',
  '🍕',
  '🍔',
  '🍟',
  '🍦',
  '🎂',
  '🍪',
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

const EmojiPicker = ({ visible, onClose, onSelect }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const data = useMemo(() => EMOJIS, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.header}>
            <AppText fontWeight="semiBold" size={16}>
              Emoji
            </AppText>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <AppText size={15} color={colors.primary} fontWeight="semiBold">
                Done
              </AppText>
            </TouchableOpacity>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item, index) => `${item}-${index}`}
            numColumns={8}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.cell}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.emoji}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default EmojiPicker;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '55%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  grid: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  cell: {
    flex: 1 / 8,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '12.5%',
    maxWidth: '12.5%',
  },
  emoji: {
    fontSize: 28,
    color: '#000',
  },
});
