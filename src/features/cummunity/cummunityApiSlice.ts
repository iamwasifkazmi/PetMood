import { createApi } from '@reduxjs/toolkit/query/react';
import config from '../../common/config';
import axiosBaseQuery from '../axiosBaseQuery';

export const cummunityApiSlice = createApi({
  baseQuery: axiosBaseQuery({ baseUrl: config.api_base_url }),
  reducerPath: 'cummunityApi',
  tagTypes: ['CommunityPosts'],
  endpoints: build => ({
    // ✅ All community posts - GET /community/posts
    getCummunityPosts: build.query<CummunityRes[], CommunityArg>({
      query: ({ limit = 20, offset = 0 }) => ({
        url: `community/posts?limit=${limit}&offset=${offset}`,
        method: 'get',
      }),
      providesTags: ['CommunityPosts'],
    }),

    // ✅ My posts - GET /community/posts/my
    getMyCommunityPosts: build.query<CummunityRes[], CommunityArg>({
      query: ({ limit = 20, offset = 0 }) => ({
        url: `community/posts/my?limit=${limit}&offset=${offset}`,
        method: 'get',
      }),
      providesTags: ['CommunityPosts'],
    }),

    likeCommunityPost: build.mutation<CummunityRes, LikePostArg>({
      query: ({ postId }) => ({
        url: `community/posts/${postId}/like`,
        method: 'post',
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          cummunityApiSlice.util.updateQueryData(
            'getCummunityPosts',
            { limit: 20, offset: 0 },
            draft => {
              const post = draft.find(p => p.id === postId);
              if (post) {
                post.isLikedByUser = !post.isLikedByUser;
                post.likesCount += post.isLikedByUser ? 1 : -1;
                if (post.likesCount < 0) post.likesCount = 0;
              }
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch (err) {
          patchResult.undo();
          console.error('❌ Failed to update like status:', err);
        }
      },
    }),

    getCommunityComments: build.query<getCommentRes[], GetCommentsArg>({
      query: ({ postId, limit = 20, offset = 0 }) => ({
        url: `community/posts/${postId}/comments?limit=${limit}&offset=${offset}`,
        method: 'get',
      }),
    }),

    getPostLikes: build.query<GetPostLikesRes, GetPostLikesArg>({
      query: ({ postId, limit = 50, offset = 0 }) => ({
        url: `community/posts/${postId}/like?limit=${limit}&offset=${offset}`,
        method: 'get',
      }),
    }),

    createCommunityComment: build.mutation<getCommentRes, CreateCommentArg>({
      query: ({ postId, content }) => ({
        url: `community/comments/create`,
        method: 'post',
        data: { postId, content },
      }),
      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        try {
          const { data: newComment } = await queryFulfilled;

          dispatch(
            cummunityApiSlice.util.updateQueryData(
              'getCommunityComments',
              { postId, limit: 20, offset: 0 },
              draft => {
                draft.unshift(newComment);
              },
            ),
          );

          dispatch(
            cummunityApiSlice.util.updateQueryData(
              'getCummunityPosts',
              { limit: 20, offset: 0 },
              draft => {
                const post = draft.find(p => p.id === postId);
                if (post) {
                  post.commentsCount = (post.commentsCount || 0) + 1;
                }
              },
            ),
          );
        } catch (err) {
          console.log('❌ Failed to update comments cache:', err);
        }
      },
    }),

    createCommunityPost: build.mutation<CummunityRes, CreatePostArg>({
      query: ({ content, tags, isPublic, images }) => {
        const formData = new FormData();

        if (content) formData.append('content', content);
        if (tags) formData.append('tags', JSON.stringify(tags));
        if (typeof isPublic === 'boolean')
          formData.append('isPublic', String(isPublic));

        if (images && images.length > 0) {
          images.forEach((img: any, index: number) => {
            formData.append('images', {
              uri: img.uri?.startsWith('file://') ? img.uri : `file://${img.uri}`,
              type: img.type || 'image/jpeg',
              name: img.fileName || `image_${index}.jpg`,
            } as any);
          });
        }

        return {
          url: `community/posts/create`,
          method: 'post',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },

      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: newPost } = await queryFulfilled;

          // 1️⃣ Update community feed
          dispatch(
            cummunityApiSlice.util.updateQueryData(
              'getCummunityPosts',
              { limit: 20, offset: 0 },
              draft => {
                draft.unshift(newPost);
              },
            ),
          );

          // 2️⃣ Update my posts feed
          dispatch(
            cummunityApiSlice.util.updateQueryData(
              'getMyCommunityPosts',
              { limit: 20, offset: 0 },
              draft => {
                draft.unshift(newPost);
              },
            ),
          );
        } catch (err) {
          console.error('❌ Failed to update posts cache after create:', err);
        }
      },
    }),

    deleteCommunityPost: build.mutation<
      { success: boolean },
      { postId: string }
    >({
      query: ({ postId }) => ({
        url: `community/posts/${postId}/delete`,
        method: 'delete',
      }),

      async onQueryStarted({ postId }, { dispatch, queryFulfilled }) {
        // 1️⃣ Update community feed
        const patchCommunity = dispatch(
          cummunityApiSlice.util.updateQueryData(
            'getCummunityPosts',
            { limit: 20, offset: 0 },
            draft => {
              const index = draft.findIndex(p => p.id === postId);
              if (index !== -1) draft.splice(index, 1);
            },
          ),
        );

        const patchMyPosts = dispatch(
          cummunityApiSlice.util.updateQueryData(
            'getMyCommunityPosts',
            { limit: 20, offset: 0 },
            draft => {
              const index = draft.findIndex(p => p.id === postId);
              if (index !== -1) draft.splice(index, 1);
            },
          ),
        );

        try {
          await queryFulfilled;
        } catch (err) {
          // Undo both changes if API fails
          patchCommunity.undo();
          patchMyPosts.undo();
        }
      },
    }),
  }),
});

// --- Export Hooks
export const {
  useGetCummunityPostsQuery,
  useLazyGetCummunityPostsQuery,
  useGetMyCommunityPostsQuery, // ✅ new hook
  useLikeCommunityPostMutation,
  useGetCommunityCommentsQuery,
  useCreateCommunityCommentMutation,
  useCreateCommunityPostMutation,
  useDeleteCommunityPostMutation,
  useGetPostLikesQuery,
} = cummunityApiSlice;
