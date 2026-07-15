import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addSearchHistory,
  addUserSearchHistory,
  deleteSearchHistories,
  deleteSearchHistory,
  deleteUserImageProfile,
  deleteUserSearchHistories,
  deleteUserSearchHistory,
  getMyProfile,
  getPostFavorites,
  getUserProfileById,
  getSearchHistories,
  getUserSearchHistories,
  searchUsers,
  updateUserImageProfile,
  updateUserProfile,
} from "./api";

export const userKeys = {
  myProfile: ["users", "me"] as const,
  profile: (id: string) => ["users", "profile", id] as const,
  favorites: ["users", "me", "favorites"] as const,
};

export function useMyProfile() {
  return useQuery({ queryKey: userKeys.myProfile, queryFn: getMyProfile });
}

export function useUserProfile(id: string) {
  return useQuery({
    queryKey: userKeys.profile(id),
    queryFn: () => getUserProfileById(id),
    enabled: !!id,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
    },
  });
}

export function useUpdateAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserImageProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserImageProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
    },
  });
}

const FAVORITES_PAGE_SIZE = 12;

export function useFavoritePostsInfinite(enabled = true) {
  return useInfiniteQuery({
    queryKey: userKeys.favorites,
    queryFn: ({ pageParam }) =>
      getPostFavorites({ pageNumber: pageParam, pageSize: FAVORITES_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pageNumber < lastPage.totalPages ? lastPage.pageNumber + 1 : undefined,
    enabled,
  });
}

const SEARCH_PAGE_SIZE = 20;

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => searchUsers({ userName: query, pageNumber: 1, pageSize: SEARCH_PAGE_SIZE }),
    enabled: query.trim().length > 0,
  });
}

// Эндпоинта «кого читать» на бэкенде нет, поэтому рекомендации собираем сами: берём пул
// пользователей и уже на клиенте выкидываем себя и тех, на кого подписаны (см. SuggestedUsers).
const SUGGESTIONS_POOL_SIZE = 30;

export function useSuggestedUsersPool() {
  return useQuery({
    queryKey: ["users", "suggestionsPool"],
    queryFn: () => searchUsers({ pageNumber: 1, pageSize: SUGGESTIONS_POOL_SIZE }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchHistories() {
  return useQuery({ queryKey: ["users", "searchHistory"], queryFn: getSearchHistories });
}

export function useAddSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "searchHistory"] }),
  });
}

export function useDeleteSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "searchHistory"] }),
  });
}

export function useDeleteSearchHistories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSearchHistories,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "searchHistory"] }),
  });
}

export function useUserSearchHistories() {
  return useQuery({
    queryKey: ["users", "userSearchHistory"],
    queryFn: getUserSearchHistories,
  });
}

export function useAddUserSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addUserSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "userSearchHistory"] }),
  });
}

export function useDeleteUserSearchHistory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserSearchHistory,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "userSearchHistory"] }),
  });
}

export function useDeleteUserSearchHistories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserSearchHistories,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users", "userSearchHistory"] }),
  });
}
