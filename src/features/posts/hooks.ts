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
  getCommentReplies,
  getExploreFeed,
  getFollowingPosts,
  getPopularPosts,
  getPostById,
  getPostComments,
  getPosts,
  likeComment,
  likePost,
  toggleFavorite,
  viewPost,
} from "./api";
import type { Post } from "./types";

export const postKeys = {
  detail: (id: number) => ["posts", "detail", id] as const,
  comments: (id: number) => ["posts", "comments", id] as const,
  replies: (commentId: number) => ["posts", "replies", commentId] as const,
  feed: ["posts", "feed"] as const,
  following: ["posts", "following"] as const,
  explore: ["posts", "explore"] as const,
  popular: ["posts", "popular"] as const,
  byUser: (userId: string) => ["posts", "byUser", userId] as const,
};

const FEED_PAGE_SIZE = 12;
const EXPLORE_PAGE_SIZE = 24;
const USER_POSTS_PAGE_SIZE = 12;
const COMMENTS_PAGE_SIZE = 20;

export function useFeedInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.feed,
    queryFn: ({ pageParam }) => getPosts({ pageNumber: pageParam, pageSize: FEED_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}

export function useExploreFeedInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.explore,
    queryFn: ({ pageParam }) =>
      getExploreFeed({ pageNumber: pageParam, pageSize: EXPLORE_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}

// Запасная лента для аккаунтов без истории: у бэкенда рекомендации могут быть пустыми,
// тогда показываем просто популярное, а не «здесь пока пусто».
export function usePopularPostsInfinite(enabled: boolean) {
  return useInfiniteQuery({
    queryKey: postKeys.popular,
    queryFn: ({ pageParam }) =>
      getPopularPosts({ pageNumber: pageParam, pageSize: EXPLORE_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
    enabled,
  });
}

export function useFollowingFeedInfinite() {
  return useInfiniteQuery({
    queryKey: postKeys.following,
    queryFn: ({ pageParam }) =>
      getFollowingPosts({ pageNumber: pageParam, pageSize: FEED_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
  });
}

export function useUserPostsInfinite(userId: string) {
  return useInfiniteQuery({
    queryKey: postKeys.byUser(userId),
    queryFn: ({ pageParam }) =>
      getPosts({ userId, pageNumber: pageParam, pageSize: USER_POSTS_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
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
// отфильтрованный по флагу isReel) — патчим карточку во всех кэшах, где она встречается,
// вместо того чтобы ждать перезапроса каждого списка. Обобщено по id, чтобы работать
// одинаково и для Post, и для Reel (оба бьют в один и тот же /Post/like-post и т.п.).
function patchPostInCache<T extends { id: number }>(
  queryClient: QueryClient,
  postId: number,
  updater: (post: T) => Partial<T>,
) {
  const applyToPost = (post: T) => (post.id === postId ? { ...post, ...updater(post) } : post);

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
        isLiked: !post.isLiked,
        likeCount: post.isLiked ? post.likeCount - 1 : post.likeCount + 1,
      }));
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFavorite,
    onMutate: async (postId) => {
      patchPostInCache<Post>(queryClient, postId, (post) => ({ isFavorite: !post.isFavorite }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.favorites });
    },
  });
}

export function useViewPost() {
  return useMutation({ mutationFn: viewPost });
}

// Корневые комментарии поста; ответы под ними догружает useCommentReplies.
export function usePostComments(postId: number) {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () =>
      getPostComments({ postId, pageNumber: 1, pageSize: COMMENTS_PAGE_SIZE }),
    enabled: !!postId,
  });
}

// Ответы на конкретный комментарий подгружаются отдельно (get-comment-replies) и
// раскрываются под родителем. Пагинация есть, но UI пока грузит первую страницу.
export function useCommentReplies(commentId: number, enabled: boolean) {
  return useQuery({
    queryKey: postKeys.replies(commentId),
    queryFn: () => getCommentReplies({ commentId, pageNumber: 1, pageSize: COMMENTS_PAGE_SIZE }),
    enabled: enabled && !!commentId,
  });
}

function invalidateComments(queryClient: QueryClient, postId: number) {
  queryClient.invalidateQueries({ queryKey: postKeys.comments(postId) });
  // commentCount живёт в самом посте, а не в списке комментариев.
  queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) });
  // Раскрытые ветки ответов могли измениться (добавили/удалили/лайкнули ответ).
  // Обновятся только активные (раскрытые) запросы — свёрнутые с enabled:false не трогаются.
  queryClient.invalidateQueries({ queryKey: ["posts", "replies"] });
}

export interface AddCommentInput {
  comment: string;
  // Задан — это ответ: комментарий уходит в ветку родителя, а не в корневой список.
  parentCommentId?: number;
}

export function useAddComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ comment, parentCommentId }: AddCommentInput) =>
      addComment({ postId, comment, parentCommentId }),
    onSuccess: () => invalidateComments(queryClient, postId),
  });
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteComment,
    onSuccess: () => invalidateComments(queryClient, postId),
  });
}

export function useLikeComment(postId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: likeComment,
    onSuccess: () => invalidateComments(queryClient, postId),
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
