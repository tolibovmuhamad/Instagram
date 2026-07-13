export interface StoryListItem {
  id: number;
  fileName: string;
  postId: number | null;
  createAt: string;
  liked: boolean;
  likedCount: number;
}

export interface StoryGroup {
  userId: string;
  userName: string;
  userImage: string | null;
  stories: StoryListItem[];
}
