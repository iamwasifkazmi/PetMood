import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import images from '../../../assets/images';
import { Theme } from '../../../common/theme';
import PrimaryButton from '../../../components/buttons/PrimaryButton';
import CummunityCard from '../../../components/cards/CummunityCard';
import Header from '../../../components/header/Header';
import AppText from '../../../components/Text/AppText';
import GlobalBottomSheet, {
  GlobalBottomSheetRef,
} from '../../../components/views/GlobalBottomSheet';
import {
  SuccessImage,
  WarningImage,
} from '../../../components/views/SuccessImage';
import { store, useAppDispatch } from '../../../features/store';
import { hideTabBar, showTabBar } from '../../../features/tabBar/tabBarSlice';
import { useTheme } from '../../../hooks/useTheme';
import { CommunityProps } from '../../../navigation/types';
import CommentsView from './CommentsView';
import CreatePostView from './CreatePostView';
import {
  useCreateCommunityCommentMutation,
  useCreateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useGetCommunityCommentsQuery,
  useGetCummunityPostsQuery,
  useGetMyCommunityPostsQuery,
  useGetPostLikesQuery,
  useLikeCommunityPostMutation,
} from '../../../features/cummunity/cummunityApiSlice';
import { CreatePostArg } from '../../../features/cummunity/types';
import LikesListView from './LikesListView';

const Community = ({ navigation }: CommunityProps) => {
  const { colors, fonts, spacing } = useTheme();
  const styles = useStyles(colors, fonts, spacing);
  const [activeTab, setActiveTab] = useState<'my_posts' | 'all_posts'>(
    'all_posts',
  );
  const [createPostData, setCreatePostData] = useState<CreatePostArg>({
    content: '',
    tags: [],
    isPublic: true,
    images: [],
  });
  const [createPost, setCreatePost] = useState<boolean>(false);
  const [isPostUpload, setIsPostUpload] = useState<boolean>(false);
  const [showComments, setShowComments] = useState<boolean>(false);
  const [showLikes, setShowLikes] = useState<boolean>(false);
  const [isLikedPost, setIsLikedPost] = useState<boolean>(false);
  const bottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const likesBottomSheetRef = useRef<GlobalBottomSheetRef>(null);
  const [postId, setPostId] = useState<string>('');
  const [likesPostId, setLikesPostId] = useState<string>('');
  const [menuId, setMenuId] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [createCommunityPost, { isLoading: creatingPost }] =
    useCreateCommunityPostMutation();
  const dispatch = useAppDispatch();
  const isAllPostTab = activeTab === 'all_posts';
  const isMyPostTab = activeTab === 'my_posts';
  const {
    data,
    isLoading: postsLoading,
    refetch, // ✅ <-- get refetch function
    isFetching, // ✅ <-- used to control refresh spinner
  } = useGetCummunityPostsQuery({
    limit: 20,
    offset: 0,
  });
  const {
    data: myPost,
    isLoading: myPostsLoading,
    refetch: myPostsRefetch, // ✅ <-- get refetch function
    isFetching: myPostsIsFetching, // ✅ <-- used to control refresh spinner
  } = useGetMyCommunityPostsQuery({
    limit: 20,
    offset: 0,
  });
  const [createComment, { isLoading: createCommentLoading }] =
    useCreateCommunityCommentMutation();
  const { data: comments, isLoading: commentsLoading } =
    useGetCommunityCommentsQuery(
      {
        limit: 20,
        offset: 0,
        postId: postId ?? '',
      },
      {
        skip: !showComments,
      },
    );

  const { data: likesData, isLoading: likesLoading } = useGetPostLikesQuery(
    {
      postId: likesPostId,
      limit: 50,
      offset: 0,
    },
    {
      skip: !showLikes || !likesPostId,
    },
  );
  const [deletePost, { isLoading: isDeleting }] =
    useDeleteCommunityPostMutation();

  const [likeCommunityPost, { isLoading: isLiking }] =
    useLikeCommunityPostMutation();

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await refetch(); // <-- re-fetch posts
      await myPostsRefetch(); // <-- re-fetch my posts
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setRefreshing(false);
    }
  };
  const handleBackPress = () => {
    setCreatePost(false);
  };
  const handleMenu = (id: string) => {
    setMenuId(id);
    bottomSheetRef?.current?.expand(), setIsPostUpload(false);
  };
  const handleLike = async (postId: string) => {
    try {
      const res = await likeCommunityPost({ postId }).unwrap();
    } catch (err) {}
  };
  const handleComment = (id: string) => {
    setPostId(id);
    setShowComments(true);
  };

  const handleLikesPress = (id: string) => {
    setLikesPostId(id);
    setShowLikes(true);
    likesBottomSheetRef?.current?.expand();
  };

  const handleCloseLikes = () => {
    setShowLikes(false);
    setLikesPostId('');
    likesBottomSheetRef?.current?.close();
  };

  const handleCreateComment = async (text: string) => {
    try {
      const res = await createComment({ postId, content: text }).unwrap();
    } catch (err) {}
  };
  const handleShare = (id: string) => console.log('Share post', id);
  const handleAction = (action: 'confirm' | 'cancel') => {
    if (action === 'confirm') {
      // Only delete if we're not showing post upload success message
      if (!isPostUpload && menuId) {
        deletePost({ postId: menuId });
      } else if (isPostUpload) {
        // If showing success message, just close and reset
        setIsPostUpload(false);
        setMenuId('');
      }
    } else if (action === 'cancel') {
      // Reset states on cancel
      setIsPostUpload(false);
      setMenuId('');
    }
  };
  const handleCreatePost = async () => {
    try {
      const payload = {
        content: createPostData.content,
        tags: createPostData.tags,
        isPublic: createPostData.isPublic,
        images: createPostData.images,
      };

      const res = await createCommunityPost(payload).unwrap();
      setIsPostUpload(true);
      setMenuId(''); // Clear menuId to prevent accidental delete
      setCreatePostData({
        content: '',
        tags: [],
        isPublic: true,
        images: [],
      });
      bottomSheetRef?.current?.expand();
      setCreatePost(false);
    } catch (err) {}
  };

  useEffect(() => {
    if (showComments) {
      store.dispatch(hideTabBar());
    } else {
      store.dispatch(showTabBar());
    }

    return () => {
      store.dispatch(showTabBar());
    };
  }, [showComments, dispatch]);

  return (
    <View style={{ flex: 1 }}>
      {showComments && (
        <ImageBackground
          source={images.blur_view}
          style={[StyleSheet.absoluteFill, { flex: 1, zIndex: 999 }]}
          resizeMode="cover"
        >
          <CommentsView
            comments={comments ?? []}
            loading={commentsLoading}
            isCommenting={createCommentLoading}
            onComment={handleCreateComment}
            onClose={() => setShowComments(false)}
          />
        </ImageBackground>
      )}

      <Header />
      <View style={styles.headingView}>
        {createPost && (
          <Pressable onPress={handleBackPress}>
            <AntDesign name="arrowleft" size={24} color={colors.primary} />
          </Pressable>
        )}
        <AppText variant="subheading">
          {createPost ? 'Emotion Result' : 'Cummunity'}
        </AppText>
      </View>
      {createPost ? (
        <>
          <CreatePostView
            formData={createPostData}
            setFormData={setCreatePostData}
          />
          <PrimaryButton
            loading={creatingPost}
            title="Save"
            style={{ margin: 24 }}
            onPress={() => {
              handleCreatePost();
            }}
          />
          <PrimaryButton
            title="Cancel"
            type="outlined"
            onPress={() => setCreatePost(false)}
            style={{ marginHorizontal: 24 }}
          />
        </>
      ) : (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 24,
              paddingTop: 0,
            }}
          >
            <TouchableOpacity
              style={{
                ...styles.postTab,
                backgroundColor: isAllPostTab
                  ? colors.primary
                  : colors.background,
              }}
              onPress={() => setActiveTab('all_posts')}
            >
              <AppText
                fontWeight="bold"
                color={isAllPostTab ? colors.card : colors.caption}
              >
                All Posts
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                ...styles.postTab,
                backgroundColor: isMyPostTab
                  ? colors.primary
                  : colors.background,
              }}
              onPress={() => setActiveTab('my_posts')}
            >
              <AppText
                fontWeight="bold"
                color={isMyPostTab ? colors.card : colors.caption}
              >
                My Posts
              </AppText>
            </TouchableOpacity>
          </View>
          <PrimaryButton
            onPress={() => setCreatePost(true)}
            title="Create New Post"
            style={{ marginHorizontal: 24, marginBottom: 24 }}
            renderLeft={() => (
              <AppText
                color={colors.card}
                fontWeight="medium"
                size={18}
                style={{ marginRight: 6 }}
              >
                +
              </AppText>
            )}
          />
          <View style={{ flex: 1 }}>
            {postsLoading ? (
              <ActivityIndicator
                color={colors.primary}
                size="large"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              />
            ) : (
              <FlatList
                data={isMyPostTab ? myPost : data}
                showsVerticalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <CummunityCard
                    post={item}
                    onMenu={handleMenu}
                    onLikePost={handleLike}
                    onCommentPost={handleComment}
                    onSharePost={handleShare}
                    onLikesPress={handleLikesPress}
                    isLikedPost={isLikedPost}
                  />
                )}
                refreshing={refreshing || isFetching || myPostsIsFetching} // ✅ controls loading spinner
                onRefresh={handleRefresh} // ✅ triggers manual refresh
                contentContainerStyle={{
                  paddingBottom: 80, // optional extra space
                }}
              />
            )}
          </View>
        </>
      )}

      <GlobalBottomSheet
        ref={bottomSheetRef}
        snapPoints={['10%']}
        showHandle={showComments ? true : false}
      >
        {isPostUpload ? <SuccessImage /> : <WarningImage />}
        <AppText
          variant="subheading"
          style={{ textAlign: 'center', marginBottom: 10 }}
        >
          {isPostUpload
            ? 'Post Successfully \n Created!'
            : 'Are you sure you want to  \n delete this post?'}
        </AppText>
        {!isPostUpload && (
          <AppText style={{ textAlign: 'center', marginBottom: 20 }}>
            Once deleted this cannot be reverted.
          </AppText>
        )}

        <PrimaryButton
          title={isPostUpload ? 'Okay' : 'confirm'}
          loading={isPostUpload ? false : isDeleting}
          onPress={() => {
            if (isPostUpload) {
              // For success message, just close and reset
              setIsPostUpload(false);
              setMenuId('');
              bottomSheetRef?.current?.close();
            } else {
              // For delete confirmation, call handleAction
              handleAction('confirm');
              bottomSheetRef?.current?.close();
            }
          }}
        />
        {!isPostUpload && (
          <PrimaryButton
            style={{ marginTop: 16 }}
            type="outlined"
            title={'Cancel'}
            onPress={() => {
              handleAction('cancel');
              bottomSheetRef?.current?.close();
            }}
          />
        )}
      </GlobalBottomSheet>

      {/* Likes Modal */}
      <GlobalBottomSheet
        ref={likesBottomSheetRef}
        snapPoints={['60%', '90%']}
        showHandle={true}
      >
        <AppText
          variant="subheading"
          fontWeight="bold"
          style={{ textAlign: 'center', marginBottom: spacing.md }}
        >
          Likes ({likesData?.totalCount || 0})
        </AppText>
        {likesLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <LikesListView
            likes={likesData?.likes || []}
            isLoading={likesLoading}
          />
        )}
      </GlobalBottomSheet>
    </View>
  );
};

export default Community;

const useStyles = (
  colors: Theme['colors'],
  fonts: Theme['fonts'],
  spacing: Theme['spacing'],
) =>
  StyleSheet.create({
    postTab: {
      height: 40,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      width: '46%',
    },
    headingView: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      gap: 16,
      margin: spacing.padding,
    },
  });
