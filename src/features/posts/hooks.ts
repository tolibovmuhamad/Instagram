import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import type { Paginated } from "@/lib/api/types";
import { userKeys } from "@/features/users/hooks";

import {
  addComment,
  addPost,
  deleteComment,
  deletePost,
  getFollowingPosts,
  getPostById,
  getPosts,
  likePost,
  toggleFavorite,
  viewPost,
} from "./api";
import type { Post } from "./types";

export const postKeys = {
  detail: (id: number) => ["posts", "detail", id] as const,
  feed: ["posts", "feed"] as const,
  following: ["posts", "following"] as const,
  byUser: (userId: string) => ["posts", "byUser", userId] as const,
};

const FEED_PAGE_SIZE = 12;
const USER_POSTS_PAGE_SIZE = 12;

export function useFeedInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.feed,
    queryFn: ({ pageParam }) => getPosts({ pageNumber: pageParam, pageSize: FEED_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPage ? lastPage.pageNumber + 1 : undefined,
  });
}

export function useFollowingFeedInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.following,
    queryFn: ({ pageParam }) =>
      getFollowingPosts({ pageNumber: pageParam, pageSize: FEED_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPage ? lastPage.pageNumber + 1 : undefined,
  });
}

export function useUserPostsInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: ({ pageParam }) =>
      getPosts({ userId, pageNumber: pageParam, pageSize: USER_POSTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPage ? lastPage.pageNumber + 1 : undefined,
    enabled: !!userId,
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => getPostById(id),
    enabled: !!id,
  });
}

// Лайк/сохранение рендерятся сразу в нескольких местах (лента, вкладка подписок, сетка
// профиля, страница поста, лента Reels — Reel это тот же Post под капотом, просто
// отфильтрованный по видео) — патчим карточку во всех кэшах, где она встречается, вместо
// того чтобы ждать перезапроса каждого списка. Обобщено по postId, чтобы работать
// одинаково и для Post, и для Reel (оба бьют в один и тот же /Post/like-post и т.п.).
function patchPostInCache<T extends { postId: number }>(
  queryClient: QueryClient,
  postId: number,
  updater: (post: T) => Partial<T>,
) {
  const applyToPost = (post: T) => (post.postId === postId ? { ...post, ...updater(post) } : post);

  // Кэш детальной страницы существует только для Post — для Reel это no-op (нет такого ключа).
  queryClient.setQueryData<T>(postKeys.detail(postId), (old) => (old ? applyToPost(old) : old));

  queryClient.setQueriesData<InfiniteData<Paginated<T>>>(
    {
      predicate: (query) =>
        query.queryKey[0] === "posts" ||
        query.queryKey[0] === "users" ||
        query.queryKey[0] === "reels",
    },
    (data) => {
      if (!data || !("pages" in data)) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map(applyToPost),
        })),
      };
    },
  );
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likePost,
    onMutate: async (postId) => {
      patchPostInCache<Post>(queryClient, postId, (post) => ({
        postLike: !post.postLike,
        postLikeCount: post.postLike ? post.postLikeCount - 1 : post.postLikeCount + 1,
      }));
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (postId) => {
      patchPostInCache<Post>(queryClient, postId, (post) => ({ postFavorite: !post.postFavorite }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.favorites });
    },
  });
}

export function useViewPost() {
  return useMutation({ mutationFn: viewPost });
}

export function useAddComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => addComment({ postId, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
    },
  });
}

export function useAddPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
