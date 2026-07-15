export interface MentionedUser {
  userId: string;
  userName: string;
}

export interface PostComment {
  id: number;
  postId: number;
  comment: string;
  createdAt: string;
  userId: string;
  userName: string | null;
  userImage: string | null;
  isVerified: boolean;
  parentCommentId: number | null;
  repliesCount: number;
  likesCount: number;
  isLiked: boolean;
  mentionedUsers: MentionedUser[];
}

export interface Post {
  id: number;
  title: string | null;
  content: string | null;
  createdAt: string;
  isReel: boolean;
  userId: string;
  userName: string | null;
  userImage: string | null;
  isVerified: boolean;
  images: string[];
  likeCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isFavorite: boolean;
  mentionedUsers: MentionedUser[];
}
