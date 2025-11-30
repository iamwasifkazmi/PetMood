// CummunityCard.tsx
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import icons from '../../assets/icons/icons';
import images from '../../assets/images';
import { Theme } from '../../common/theme';
import { useTheme } from '../../hooks/useTheme';
import AppText from '../Text/AppText';
import CommunitySwiper from './CummunitySwiper';
import moment from 'moment';
import { CummunityRes } from '../../features/cummunity/types';
interface Props {
  post: CummunityRes;
  onMenu: (id: string) => void;
  onLikePost: (id: string) => void;
  onCommentPost: (id: string) => void;
  onSharePost: (id: string) => void;
  onLikesPress?: (id: string) => void;
  isLikedPost: boolean;
}

const CummunityCard: React.FC<Props> = ({
  post,
  onMenu,
  onLikePost,
  onCommentPost,
  onSharePost,
  onLikesPress,
  isLikedPost,
}) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <View style={styles.container}>
      <View style={styles.profileRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View>
            <Image
              source={
                post?.authorPhotoUrl
                  ? { uri: post.authorPhotoUrl }
                  : images.gallery_rounded
              }
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                resizeMode: 'cover',
              }}
              defaultSource={images.gallery_rounded}
            />
          </View>
          <View>
            <AppText fontWeight="medium">{post?.authorName}</AppText>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              {post?.authorLocation && (
                <>
                  <AppText size={12}>{post.authorLocation}</AppText>
                  <View style={styles.singleDot} />
                </>
              )}
              <AppText size={12}>{moment(post.createdAt).fromNow()}</AppText>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={() => onMenu(post?.id)}>
          <Entypo name="dots-three-vertical" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      <AppText style={{ marginHorizontal: 20, marginBottom: 5 }}>
        {post?.content}
      </AppText>
      {post?.images && Array.isArray(post.images) && post.images.length > 0 && (
        <CommunitySwiper
          postImages={post.images}
          onIndexChange={setActiveIndex}
        />
      )}

      <View style={styles.actionsRow}>
        <View style={{ flexDirection: 'row', gap: 26, alignItems: 'center' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            onPress={() => onLikePost(post?.id)}
          >
            <FontAwesome
              name={post?.isLikedByUser ? 'heart' : 'heart-o'}
              size={20}
              color={colors.primary}
            />
            <AppText size={12} variant="heading">
              {post?.likesCount > 0 ? post?.likesCount : ''}
            </AppText>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            onPress={() => onCommentPost(post?.id)}
          >
            <Image
              source={icons.comment}
              style={{ width: 24, height: 24, resizeMode: 'contain' }}
            />
            <AppText size={12} variant="heading">
              {post?.commentsCount > 0 ? post?.commentsCount : ''}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.dotsContainer}>
          {post?.images?.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    idx === activeIndex ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View> */}

        {/* <TouchableOpacity onPress={() => onSharePost(post.id)}>
          <Image
            source={icons.share}
            style={{ width: 24, height: 24, resizeMode: 'contain' }}
          />
        </TouchableOpacity> */}
      </View>

      {/* Likes */}
      {post?.likesCount > 0 && (
        <TouchableOpacity
          style={styles.likesContainer}
          onPress={() => onLikesPress?.(post.id)}
          activeOpacity={0.7}
        >
          <Image
            source={
              post?.authorPhotoUrl
                ? { uri: post.authorPhotoUrl }
                : images.gallery_rounded
            }
            style={styles.likeUser}
            defaultSource={images.gallery_rounded}
            resizeMode="cover"
          />
          <AppText size={12}>
            Liked by{' '}
            <AppText size={12} fontWeight="bold">
              {post?.authorName}
            </AppText>
            {post?.likesCount > 1 && (
              <>
                {' '}
                <AppText size={12} fontWeight="bold">
                  and {post.likesCount - 1} others
                </AppText>
              </>
            )}
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CummunityCard;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    container: {
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    profileRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.text,
    },
    singleDot: {
      width: 3,
      height: 3,
      borderRadius: 3,
      backgroundColor: colors.text,
    },
    actionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
    },
    dotsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginRight: 38,
    },
    likesContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingLeft: 24,
      marginTop: 12,
    },
    likeUser: {
      width: 18,
      height: 18,
      borderRadius: 9,
      resizeMode: 'cover',
    },
  });
