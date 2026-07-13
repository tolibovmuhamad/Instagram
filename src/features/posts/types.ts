export interface PostUserRef {
  userId: string;
  userName: string;
  userPhoto: string | null;
  fullname: string;
}

export interface PostComment {
  postCommentId: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  dateCommented: string;
  comment: string;
}

export interface Post {
  postId: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  datePublished: string;
  images: string[];
  title: string | null;
  content: string | null;
  postLike: boolean;
  postLikeCount: number;
  userLikes: PostUserRef[] | null;
  commentCount: number;
  comments: PostComment[];
  postView: number;
  userViews: PostUserRef[] | null;
  postFavorite: boolean;
  userFavorite: PostUserRef[] | null;
}
