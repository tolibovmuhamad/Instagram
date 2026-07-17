import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addStory,
  addStoryView,
  deleteStory,
  getMyStories,
  getStories,
  getUserStories,
  likeStory,
  replyToStory,
} from "./api";
import { getActiveStories, groupStoriesByUser, type Story } from "./types";

export const storyKeys = {
  rail: ["stories", "rail"] as const,
  my: ["stories", "my"] as const,
  byUser: (userId: string) => ["stories", "byUser", userId] as const,
};

// Лента кружков: только живые истории (24 часа). Фильтр здесь, а не в компоненте, — правило
// одно на всех потребителей ленты. Свои истории приходят мимо (get-my-stories), их
// фильтрует StoryAvatarRail.
export function useStories() {
  return useQuery({
    queryKey: storyKeys.rail,
    queryFn: getStories,
    select: (stories: Story[]) => groupStoriesByUser(getActiveStories(stories)),
  });
}

export function useMyStories() {
  return useQuery({ queryKey: storyKeys.my, queryFn: getMyStories });
}

export function useUserStories(userId: string) {
  return useQuery({
    queryKey: storyKeys.byUser(userId),
    queryFn: () => getUserStories(userId),
    enabled: !!userId,
  });
}

export function useAddStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useDeleteStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

// В DTO сторис нет флага «текущий пользователь уже лайкнул» — только счётчик лайков
// (viewerDto.viewLike). Поэтому оптимистично подсветить сердечко по данным с сервера
// невозможно: состояние кнопки вьюер держит у себя, а сюда мы лишь перезапрашиваем
// счётчик после ответа.
export function useLikeStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likeStory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });
}

export function useViewStory() {
  return useMutation({ mutationFn: addStoryView });
}

export function useReplyToStory() {
  return useMutation({
    mutationFn: ({ storyId, text }: { storyId: number; text: string }) =>
      replyToStory(storyId, text),
  });
}
