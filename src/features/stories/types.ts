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

// Истории живут 24 часа — но ТОЛЬКО по правилам Instagram, не по правилам бэкенда:
// `get-my-stories` / `get-user-stories` отдают всё за всю жизнь аккаунта и ничего не
// удаляют (на этом же построен «Архив»). Поэтому «активные» истории — те, за которые горит
// кольцо и которые открывает вьюер, — отбираем по createAt здесь, на клиенте.
//
// `now` параметром, а не Date.now() внутри: иначе поведение не проверить тестом.
export const STORY_LIFETIME_MS = 24 * 60 * 60 * 1000;

export function isStoryActive(story: Story, now: number = Date.now()): boolean {
  return now - new Date(story.createAt).getTime() < STORY_LIFETIME_MS;
}

export function getActiveStories(stories: Story[], now: number = Date.now()): Story[] {
  if (!Array.isArray(stories)) return [];
  return stories.filter((story) => isStoryActive(story, now));
}

// Состояние кольца вокруг аватара. Считается по активным историям автора: пока осталась
// хоть одна непросмотренная — кольцо «горит» (зелёное для «близких друзей», иначе градиент),
// всё просмотрено — серое, активных историй нет — кольца нет вовсе.
export type StoryRing = "unviewed" | "closeFriends" | "viewed" | "none";

export function getStoryRing(
  activeStories: Story[],
  isViewed: (storyId: number) => boolean,
): StoryRing {
  if (activeStories.length === 0) return "none";
  const unviewed = activeStories.filter((story) => !isViewed(story.id));
  if (unviewed.length === 0) return "viewed";
  return unviewed.some((story) => story.audience === 1) ? "closeFriends" : "unviewed";
}

// Бэкенд отдаёт сторис плоским списком, без группировки по авторам, а лента-«кружочки»
// показывает по одному кружку на автора — поэтому группируем на клиенте. Порядок авторов
// определяется первым вхождением, порядок сторис внутри автора — от старых к новым
// (в таком порядке их листает вьюер).
export function groupStoriesByUser(stories: Story[]): StoryGroup[] {
  const groups = new Map<string, StoryGroup>();

  if (!Array.isArray(stories)) {
    return [];
  }

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
