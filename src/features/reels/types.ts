import type { PostComment, PostUserRef } from "@/features/posts/types";

export interface Reel {
  postId: number;
  userId: string;
  userName: string | null;
  userImage: string | null;
  isSubscriber: boolean;
  images: string;
  datePublished: string;
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
