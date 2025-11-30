import React, { useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useTheme } from '../../../hooks/useTheme';
import { Theme } from '../../../common/theme';
import icons from '../../../assets/icons/icons';
import images from '../../../assets/images';
import AntDesign from 'react-native-vector-icons/AntDesign';
import AppText from '../../../components/Text/AppText';
import moment from 'moment';
import { RootState } from '../../../features/store';

interface Props {
  onClose: () => void;
  onComment: (comment: string) => void;
  loading?: boolean;
  comments: getCommentRes[];
  isCommenting?: boolean;
}
const CommentsView = ({
  onClose,
  onComment,
  loading,
  comments,
  isCommenting,
}: Props) => {
  const { colors, spacing, fonts } = useTheme();
  const styles = useStyles(colors, spacing, fonts);
  const { user } = useSelector((state: RootState) => state.user);

  const [comment, setComment] = useState('');

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
              onComment(comment);
              setComment('');
            }}
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
  });
