import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Linking,
  Modal,
  Pressable,
  ScrollView,
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
import { CommunityProps, RouteName } from '../../../navigation/types';
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
  useReportPostMutation,
  useBlockUserMutation,
} from '../../../features/cummunity/cummunityApiSlice';
import { CreatePostArg, CummunityRes } from '../../../features/cummunity/types';
import LikesListView from './LikesListView';
import { showErrMsg, showSuccessMsg } from '../../../utils/flashMessage';
import { useSelector } from 'react-redux';
import { RootState } from '../../../features/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  PRIVACY_POLICY_WEB_URL,
  TERMS_AND_CONDITIONS_URL,
  TERMS_OF_USE_EULA_URL,
} from '../../../common/legalUrls';

const UGC_TERMS_STORAGE_KEY = 'petmood_ugc_terms_accepted_v1';

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
  const [menuPost, setMenuPost] = useState<CummunityRes | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hiddenPostIds, setHiddenPostIds] = useState<Record<string, true>>({});
  const [createPostInlineError, setCreatePostInlineError] = useState('');
  const [createCommentInlineError, setCreateCommentInlineError] = useState('');
  /** null = loading from storage; false = show gate; true = feed allowed */
  const [ugcTermsAccepted, setUgcTermsAccepted] = useState<boolean | null>(null);
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
  } = useGetCummunityPostsQuery(
    {
      limit: 20,
      offset: 0,
    },
    { skip: ugcTermsAccepted !== true },
  );
  const {
    data: myPost,
    isLoading: myPostsLoading,
    refetch: myPostsRefetch, // ✅ <-- get refetch function
    isFetching: myPostsIsFetching, // ✅ <-- used to control refresh spinner
  } = useGetMyCommunityPostsQuery(
    {
      limit: 20,
      offset: 0,
    },
    { skip: ugcTermsAccepted !== true },
  );
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
        skip: !showComments || ugcTermsAccepted !== true,
      },
    );

  const { data: likesData, isLoading: likesLoading } = useGetPostLikesQuery(
    {
      postId: likesPostId,
      limit: 50,
      offset: 0,
    },
    {
      skip: !showLikes || !likesPostId || ugcTermsAccepted !== true,
    },
  );
  const [deletePost, { isLoading: isDeleting }] =
    useDeleteCommunityPostMutation();
  const [reportPost] = useReportPostMutation();
  const [blockUser] = useBlockUserMutation();

  const { user } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('community_hidden_posts_v1');
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setHiddenPostIds(parsed);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(UGC_TERMS_STORAGE_KEY).then(v => {
      setUgcTermsAccepted(v === 'true');
    });
  }, []);

  const persistHidden = async (next: Record<string, true>) => {
    setHiddenPostIds(next);
    try {
      await AsyncStorage.setItem('community_hidden_posts_v1', JSON.stringify(next));
    } catch {
      // ignore
    }
  };

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
    const post =
      (data || []).find(p => p.id === id) || (myPost || []).find(p => p.id === id) || null;
    setMenuPost(post as any);
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
      setCreateCommentInlineError('');
      const res = await createComment({ postId, content: text }).unwrap();
    } catch (err: any) {
      const detail =
        err?.data?.detail || err?.data?.message || 'Unable to add comment.';
      if (String(detail).toLowerCase().includes('violates community guidelines')) {
        setCreateCommentInlineError('Your message contains prohibited content.');
      } else {
        setCreateCommentInlineError(String(detail));
      }
    }
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

  const promptReportPost = () => {
    if (!menuPost?.id) return;
    if (menuPost.authorId === user?.uid) {
      showErrMsg("You can’t report your own post.");
      return;
    }
    Alert.alert('Report Post', 'Select a reason', [
      {
        text: 'Harassment',
        onPress: async () => {
          await reportPost({ postId: menuPost.id, reason: 'Harassment' }).unwrap();
          showSuccessMsg("Thanks, we’ll review this.");
          bottomSheetRef?.current?.close();
        },
      },
      {
        text: 'Spam',
        onPress: async () => {
          await reportPost({ postId: menuPost.id, reason: 'Spam' }).unwrap();
          showSuccessMsg("Thanks, we’ll review this.");
          bottomSheetRef?.current?.close();
        },
      },
      {
        text: 'Other',
        onPress: async () => {
          await reportPost({ postId: menuPost.id, reason: 'Other' }).unwrap();
          showSuccessMsg("Thanks, we’ll review this.");
          bottomSheetRef?.current?.close();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const promptBlockUser = () => {
    if (!menuPost?.authorId) return;
    if (menuPost.authorId === user?.uid) {
      showErrMsg("You can’t block yourself.");
      return;
    }
    Alert.alert('Block User', `Block ${menuPost.authorName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Block',
        style: 'destructive',
        onPress: async () => {
          await blockUser({ targetUid: menuPost.authorId, reason: 'Harassment' }).unwrap();
          showSuccessMsg('User blocked.');
          bottomSheetRef?.current?.close();
          setMenuId('');
          setMenuPost(null);
        },
      },
    ]);
  };

  const hidePost = async () => {
    if (!menuPost?.id) return;
    const next = { ...hiddenPostIds, [menuPost.id]: true as const };
    await persistHidden(next);
    showSuccessMsg('Post hidden.');
    setMenuId('');
    setMenuPost(null);
    bottomSheetRef?.current?.close();
  };
  const handleCreatePost = async () => {
    try {
      setCreatePostInlineError('');
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
    } catch (err: any) {
      const detail =
        err?.data?.detail || err?.data?.message || 'Unable to create post.';
      if (String(detail).toLowerCase().includes('violates community guidelines')) {
        setCreatePostInlineError('Your message contains prohibited content.');
      } else {
        setCreatePostInlineError(String(detail));
      }
    }
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

  const acceptUgcTerms = async () => {
    try {
      await AsyncStorage.setItem(UGC_TERMS_STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
    setUgcTermsAccepted(true);
  };

  const openPrivacyPolicy = () => {
    const web = PRIVACY_POLICY_WEB_URL?.trim();
    if (web) {
      Linking.openURL(web);
      return;
    }
    const drawerNav = navigation.getParent?.()?.getParent?.();
    if (drawerNav) {
      (drawerNav as any).navigate('PrivacyPolicy');
    } else {
      (navigation as any).navigate('PrivacyPolicy');
    }
  };

  const openTermsOfUse = () => {
    Linking.openURL(TERMS_OF_USE_EULA_URL);
  };

  const openTermsAndConditions = () => {
    Linking.openURL(TERMS_AND_CONDITIONS_URL);
  };

  const handleDeclineUgcTerms = () => {
    navigation.navigate(RouteName.Home as never);
  };

  if (ugcTermsAccepted === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (ugcTermsAccepted === false) {
    return (
      <Modal visible animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
          edges={['top', 'bottom']}
        >
          <ScrollView
            contentContainerStyle={{ padding: 24, paddingBottom: 48 }}
            keyboardShouldPersistTaps="handled"
          >
            <AppText variant="subheading" fontWeight="bold" style={{ marginBottom: 12 }}>
              Community guidelines & terms
            </AppText>
            <AppText color={colors.caption} style={{ marginBottom: 16, lineHeight: 22 }}>
              PetMood Community includes user-generated content. Before you continue, please
              review our Privacy Policy and Terms of Use (EULA). By tapping &quot;I agree and
              continue&quot;, you agree to these terms and our community rules.
            </AppText>
            <TouchableOpacity onPress={openPrivacyPolicy} style={{ marginBottom: 12 }}>
              <AppText color={colors.primary} fontWeight="medium">
                Privacy Policy
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={openTermsOfUse} style={{ marginBottom: 12 }}>
              <AppText color={colors.primary} fontWeight="medium">
                Terms of Use (EULA)
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity onPress={openTermsAndConditions} style={{ marginBottom: 24 }}>
              <AppText color={colors.primary} fontWeight="medium">
                Terms &amp; Conditions
              </AppText>
            </TouchableOpacity>
            <PrimaryButton title="I agree and continue" onPress={acceptUgcTerms} />
            <PrimaryButton
              title="Not now"
              type="outlined"
              style={{ marginTop: 12 }}
              onPress={handleDeclineUgcTerms}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

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
            postId={postId}
            commentErrorText={createCommentInlineError}
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
          {createPost ? 'Emotion Result' : 'Community'}
        </AppText>
      </View>
      {createPost ? (
        <>
          <CreatePostView
            formData={createPostData}
            setFormData={setCreatePostData}
            errorText={createPostInlineError}
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
                data={(isMyPostTab ? myPost : data)?.filter(p => !hiddenPostIds[p.id])}
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

        {isPostUpload ? (
          <PrimaryButton
            title="Okay"
            loading={false}
            onPress={() => {
              setIsPostUpload(false);
              setMenuId('');
              setMenuPost(null);
              bottomSheetRef?.current?.close();
            }}
          />
        ) : (
          <>
            {/* Delete only if it's the user's post */}
            {menuPost?.authorId === user?.uid ? (
              <PrimaryButton
                title="Delete Post"
                loading={isDeleting}
                onPress={() => {
                  handleAction('confirm');
                  bottomSheetRef?.current?.close();
                }}
              />
            ) : null}

            {menuPost?.authorId !== user?.uid ? (
              <PrimaryButton
                style={{ marginTop: 12 }}
                type="outlined"
                title="Report Post"
                onPress={promptReportPost}
              />
            ) : null}

            <PrimaryButton
              style={{ marginTop: 12 }}
              type="outlined"
              title="Hide Post"
              onPress={hidePost}
            />

            {menuPost?.authorId && menuPost.authorId !== user?.uid ? (
              <PrimaryButton
                style={{ marginTop: 12 }}
                type="outlined"
                title="Block User"
                onPress={promptBlockUser}
              />
            ) : null}

            <PrimaryButton
              style={{ marginTop: 12 }}
              type="outlined"
              title="Close"
              onPress={() => {
                setMenuId('');
                setMenuPost(null);
                bottomSheetRef?.current?.close();
              }}
            />
          </>
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
