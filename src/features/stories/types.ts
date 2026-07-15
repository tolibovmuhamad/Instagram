import type { Post } from "@/features/posts/types";

// 0 — видно всем, 1 — только близким друзьям (/CloseFriend).
export type StoryAudience = 0 | 1;

// Несмотря на название, viewerDto описывает АВТОРА сторис и агрегаты по ней,
// а не текущего зрителя: viewCount — сколько раз посмотрели, viewLike — сколько лайков.
export interface StoryViewer {
  userName: string;
  name: string;
  viewCount: number;
  viewLike: number;
}

export interface Story {
  id: number;
  fileName: string;
  postId: number | null;
  createAt: string;
  userId: string;
  userAvatar: string | null;
  isVerified: boolean;
  viewerDto: StoryViewer;
  audience: StoryAudience;
  sharedPostId: number | null;
  sharedPost: Post | null;
}

export interface StoryGroup {
  userId: string;
  userName: string;
  userImage: string | null;
  isVerified: boolean;
  stories: Story[];
}

// Бэкенд отдаёт сторис плоским списком, без группировки по авторам, а лента-«кружочки»
// показывает по одному кружку на автора — поэтому группируем на клиенте. Порядок авторов
// определяется первым вхождением, порядок сторис внутри автора — от старых к новым
// (в таком порядке их листает вьюер).
export function groupStoriesByUser(stories: Story[]): StoryGroup[] {
  const groups = new Map<string, StoryGroup>();

  for (const story of stories) {
    const existing = groups.get(story.userId);
    if (existing) {
      existing.stories.push(story);
      continue;
    }
    groups.set(story.userId, {
      userId: story.userId,
      userName: story.viewerDto.userName,
      userImage: story.userAvatar,
      isVerified: story.isVerified,
      stories: [story],
    });
  }

  for (const group of groups.values()) {
    group.stories.sort((a, b) => a.createAt.localeCompare(b.createAt));
  }

  return [...groups.values()];
}
