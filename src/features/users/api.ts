import type { Post } from "@/features/posts/types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { UpdateProfileFormValues } from "./schemas";
import { GENDER_TO_CODE } from "./types";
import type {
  SearchHistoryItem,
  UserProfile,
  UserSearchHistoryItem,
  UserSearchResult,
} from "./types";

export async function getMyProfile() {
  const { data } = await apiClient.get<UserProfile>("/UserProfile/get-my-profile");
  return data;
}

// Профиль сам по себе несёт isFollowing/isRequested относительно текущего пользователя,
// так что отдельный запрос статуса подписки больше не нужен.
export async function getUserProfileById(id: string) {
  const { data } = await apiClient.get<UserProfile>("/UserProfile/get-user-profile-by-id", {
    params: { id },
  });
  return data;
}

export async function updateUserProfile(values: UpdateProfileFormValues) {
  const { data } = await apiClient.put<null>("/UserProfile/update-user-profile", {
    about: values.about,
    gender: GENDER_TO_CODE[values.gender],
  });
  return data;
}

export async function updateUserImageProfile(file: File | Blob) {
  const formData = new FormData();
  formData.append("imageFile", file);
  const { data } = await apiClient.put<null>("/UserProfile/update-user-image-profile", formData);
  return data;
}

export async function deleteUserImageProfile() {
  const { data } = await apiClient.delete<null>("/UserProfile/delete-user-image-profile");
  return data;
}

export interface GetPostFavoritesParams {
  pageNumber: number;
  pageSize: number;
}

export async function getPostFavorites(params: GetPostFavoritesParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/UserProfile/get-post-favorites", {
    params: { pageNumber: params.pageNumber, pageSize: params.pageSize },
  });
  return data;
}

export interface SearchUsersParams {
  userName?: string;
  pageNumber: number;
  pageSize: number;
}

export async function searchUsers(params: SearchUsersParams) {
  const { data } = await apiClient.get<Paginated<UserSearchResult>>("/User/get-users", {
    params: {
      userName: params.userName,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
    },
  });
  return data;
}

export async function getSearchHistories() {
  const { data } = await apiClient.get<SearchHistoryItem[]>("/User/get-search-histories");
  return data;
}

export async function addSearchHistory(text: string) {
  await apiClient.post("/User/add-search-history", null, { params: { text } });
}

export async function deleteSearchHistory(id: number) {
  await apiClient.delete("/User/delete-search-history", { params: { id } });
}

export async function deleteSearchHistories() {
  await apiClient.delete("/User/delete-search-histories");
}

export async function getUserSearchHistories() {
  const { data } = await apiClient.get<UserSearchHistoryItem[]>(
    "/User/get-user-search-histories",
  );
  return data;
}

export async function addUserSearchHistory(userSearchId: string) {
  await apiClient.post("/User/add-user-search-history", null, {
    params: { userSearchId },
  });
}

export async function deleteUserSearchHistory(id: number) {
  await apiClient.delete("/User/delete-user-search-history", { params: { id } });
}

export async function deleteUserSearchHistories() {
  await apiClient.delete("/User/delete-user-search-histories");
}
