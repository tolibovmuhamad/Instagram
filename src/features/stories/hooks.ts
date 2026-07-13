import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import {
  addStory,
  addStoryView,
  deleteStory,
  getMyStories,
  getStories,
  getUserStories,
  likeStory,
} from "./api";
import type { StoryGroup } from "./types";

export const storyKeys = {
  rail: ["stories", "rail"] as const,
  my: ["stories", "my"] as const,
  byUser: (userId: string) => ["stories", "byUser", userId] as const,
};

export function useStories() {
  return useQuery({ queryKey: storyKeys.rail, queryFn: getStories });
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

function patchStoryInCache(
  queryClient: QueryClient,
  storyId: number,
  updater: (story: StoryGroup["stories"][number]) => Partial<StoryGroup["stories"][number]>,
) {
  const patchGroup = (group: StoryGroup): StoryGroup => ({
    ...group,
    stories: group.stories.map((story) =>
      story.id === storyId ? { ...story, ...updater(story) } : story,
    ),
  });

  queryClient.setQueriesData<StoryGroup[] | StoryGroup>(
    { predicate: (query) => query.queryKey[0] === "stories" },
    (data) => {
      if (!data) return data;
      return Array.isArray(data) ? data.map(patchGroup) : patchGroup(data);
    },
  );
}

export function useLikeStory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likeStory,
    onMutate: async (storyId) => {
      patchStoryInCache(queryClient, storyId, (story) => ({
        liked: !story.liked,
        likedCount: story.liked ? story.likedCount - 1 : story.likedCount + 1,
      }));
    },
  });
}

export function useViewStory() {
  return useMutation({ mutationFn: addStoryView });
}
