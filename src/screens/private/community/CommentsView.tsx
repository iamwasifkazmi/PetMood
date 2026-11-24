import React, { useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { Theme } from '../../../common/theme';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import AppText from '../../../components/Text/AppText';
import moment from 'moment';
import { RootState } from '../../../features/store';
import Entypo from 'react-native-vector-icons/Entypo';
import { useBlockUserMutation, useReportCommentMutation } from '../../../features/cummunity/cummunityApiSlice';
import { showSuccessMsg } from '../../../utils/flashMessage';

interface Props {
  onClose: () => void;
  onComment: (comment: string) => void | Promise<void>;
  loading?: boolean;
  comments: getCommentRes[];
  isCommenting?: boolean;
  postId?: string;
  commentErrorText?: string;
}

type MenuAction =
  | { type: 'report'; reason: string }
  | { type: 'block' };

const CommentsView = ({
  onClose,
  onComment,
  loading,
  comments,
  isCommenting,
  postId,
  commentErrorText,
}: Props) => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, spacing, fonts);
  const { user } = useSelector((state: RootState) => state.user);

  const [comment, setComment] = useState('');
  const [menuComment, setMenuComment] = useState<getCommentRes | null>(null);
  const [menuBusy, setMenuBusy] = useState(false);
  const [reportComment] = useReportCommentMutation();
  const [blockUser] = useBlockUserMutation();

  const closeMenu = () => {
    if (menuBusy) return;
    setMenuComment(null);
  };

  const runMenuAction = async (action: MenuAction) => {
    if (!postId || !menuComment) return;
    setMenuBusy(true);
    try {
      if (action.type === 'report') {
        await reportComment({
          postId,
          commentId: menuComment.id,
          reason: action.reason,
        }).unwrap();
        showSuccessMsg("Thanks, we’ll review this.");
      } else {
        await blockUser({
          targetUid: menuComment.authorId,
          reason: 'Harassment',
          postIdForCommentsPatch: postId,
        }).unwrap();
        showSuccessMsg('User blocked.');
      }
      setMenuComment(null);
    } catch {
      // axiosBaseQuery already toasts API errors
    } finally {
      setMenuBusy(false);
    }
  };

  const onMenuPress = (commentItem: getCommentRes) => {
    if (!postId) return;
    if (commentItem.authorId === user?.uid) {
      return;
    }
    setMenuComment(commentItem);
  };

  const handleSendComment = async () => {
    const text = comment.trim();
    if (!text || isCommenting) return;
    try {
      await onComment(text);
      setComment('');
    } catch {
      // parent sets inline error; keep draft text for retry
    }
  };

  const renderComment = ({ item }: { item: getCommentRes }) => (
    <View style={styles.commentRow}>
      <Image
        source={
          item?.authorPhotoUrl
            ? { uri: item.authorPhotoUrl }
            : images.gallery_rounded
        }
        style={styles.avatar}
        defaultSource={images.gallery_rounded}
        resizeMode="cover"
      />
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <AppText fontWeight="semiBold" size={13}>
            {item?.authorName}
          </AppText>
          <AppText size={10} color={colors.caption}>
            {moment(item.createdAt).fromNow()}
          </AppText>
        </View>
        <AppText size={12}>{item?.content}</AppText>
      </View>
      {item.authorId !== user?.uid && !!postId && (
        <TouchableOpacity
          onPress={() => onMenuPress(item)}
          style={{ paddingHorizontal: 6, paddingVertical: 6 }}
        >
          <Entypo name="dots-three-vertical" size={16} color={colors.caption} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          flex: 1,
          paddingTop: 33,
        }}
      >
        <View style={styles.handle} />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Image
              source={icons.arrow_left}
              style={{ width: 20, height: 20, resizeMode: 'contain' }}
            />
          </TouchableOpacity>
          <AppText fontWeight="bold" size={16}>
            {comments?.length} Comments
          </AppText>
        </View>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          />
        ) : (
          <FlatList
            data={comments}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={renderComment}
            contentContainerStyle={{
              padding: spacing.md,
            }}
            style={styles.commentsList}
          />
        )}
      </View>
      <View style={styles.inputRow}>
        <Image
          source={
            user?.photoUrl
              ? { uri: user.photoUrl }
              : require('../../../assets/images/gallery_rounded.png')
          }
          style={styles.inputAvatar}
          defaultSource={require('../../../assets/images/gallery_rounded.png')}
          resizeMode="cover"
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Leave a comment"
            placeholderTextColor={colors.placeholder}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() => {
              void handleSendComment();
            }}
            disabled={isCommenting || !comment.trim()}
          >
            {isCommenting ? (
              <ActivityIndicator color={colors.card} size="small" />
            ) : (
              <Image
                source={icons.arrow_up}
                style={{ width: 15, height: 15, resizeMode: 'contain' }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
      {!!commentErrorText && (
        <AppText
          size={12}
          color={colors.danger}
          style={{ marginHorizontal: 50, marginTop: -24, marginBottom: 10 }}
        >
          {commentErrorText}
        </AppText>
      )}

      <Modal
        visible={!!menuComment}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuBackdrop} onPress={closeMenu}>
          <Pressable
            style={[styles.menuSheet, { backgroundColor: colors.card }]}
            onPress={e => e.stopPropagation()}
          >
            <AppText
              fontWeight="semiBold"
              size={16}
              style={{ textAlign: 'center', marginBottom: 12 }}
            >
              Comment actions
            </AppText>
            {(
              [
                { label: 'Report: Harassment', action: { type: 'report', reason: 'Harassment' } as MenuAction },
                { label: 'Report: Spam', action: { type: 'report', reason: 'Spam' } as MenuAction },
                { label: 'Report: Other', action: { type: 'report', reason: 'Other' } as MenuAction },
                { label: 'Block User', action: { type: 'block' } as MenuAction },
              ] as const
            ).map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                disabled={menuBusy}
                onPress={() => void runMenuAction(item.action)}
              >
                <AppText
                  size={15}
                  color={item.action.type === 'block' ? colors.danger : colors.text}
                >
                  {item.label}
                </AppText>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.menuItem, styles.menuCancel]}
              disabled={menuBusy}
              onPress={closeMenu}
            >
              <AppText fontWeight="semiBold" size={15} color={colors.primary}>
                Cancel
              </AppText>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default CommentsView;

const useStyles = (
  colors: Theme['colors'],
  spacing: Theme['spacing'],
  fonts: Theme['fonts'],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      margin: 24,
      marginTop: 30,
      paddingTop: 50,
      marginBottom: 20,
    },
    handle: {
      width: 52,
      height: 3,
      backgroundColor: colors.text,
      position: 'absolute',
      alignSelf: 'center',
      top: 14,
    },
    header: {
      paddingHorizontal: 16,
      borderBottomColor: colors.border,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 0,
    },
    commentsList: {
      flex: 1,
    },
    commentRow: {
      flexDirection: 'row',
      marginBottom: 10,
      gap: 10,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      resizeMode: 'cover',
    },
    inputAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 39,
      paddingTop: 24,
      borderTopColor: colors.border,
    },
    inputContainer: {
      flex: 1,
      borderRadius: 20,
      marginHorizontal: 7,
      paddingHorizontal: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    input: {
      height: 40,
      color: colors.text,
      ...fonts.semiBold,
      flex: 1,
    },
    sendBtn: {
      width: 25,
      height: 25,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
      justifyContent: 'flex-end',
    },
    menuSheet: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      paddingTop: 16,
      paddingBottom: Platform.OS === 'ios' ? 28 : 16,
      paddingHorizontal: 16,
    },
    menuItem: {
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    menuCancel: {
      borderBottomWidth: 0,
      marginTop: 4,
      alignItems: 'center',
    },
  });
