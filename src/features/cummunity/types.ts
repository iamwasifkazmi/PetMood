export interface CommunityArg {
  limit?: number;
  offset?: number;
}

export interface CummunityRes {
  createdAt: string;
  isPublic: boolean;
  authorName: string;
  authorPhotoUrl?: string;
  authorLocation?: string;
  updatedAt: string;
  authorId: string;
  content: string;
  tags: string[];
  images: string[];
  id: string;
  isLikedByUser: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}
export interface LikePostArg {
  postId: string;
}

export interface getCommentRes {
  createdAt: string;
  isPublic: boolean;
  authorName: string;
  authorPhotoUrl?: string;
  authorLocation?: string;
  updatedAt: string;
  authorId: string;
  content: string;
  tags: string[];
  images: string[];
  id: string;
  isLikedByUser: boolean;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}
export interface GetCommentsArg extends CommunityArg {
  postId: string;
}

export interface GetPostLikesArg extends CommunityArg {
  postId: string;
}

export interface PostLikeUser {
  userId: string;
  userName: string;
  userPhotoUrl?: string;
  userLocation?: string;
  likedAt: string;
}

export interface GetPostLikesRes {
  likes: PostLikeUser[];
  totalCount: number;
}

export interface CreateCommentArg {
  postId: string;
  content: string;
}

export interface CreatePostArg {
  content: string;
  tags?: string[];
  isPublic?: boolean;
  images?: Array<{
    uri: string;
    type?: string;
    fileName?: string;
  }>;
}
