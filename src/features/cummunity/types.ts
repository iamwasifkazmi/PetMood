interface CommunityArg {
  limit?: number;
  offset?: number;
}

interface CummunityRes {
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
interface LikePostArg {
  postId: string;
}

interface getCommentRes {
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
interface GetCommentsArg extends CommunityArg {
  postId: string;
}

interface CreateCommentArg {
  postId: string;
  content: string;
}

interface CreatePostArg {
  content: string;
  tags?: string[];
  isPublic?: boolean;
  images?: Array<{
    uri: string;
    type?: string;
    fileName?: string;
  }>;
}
