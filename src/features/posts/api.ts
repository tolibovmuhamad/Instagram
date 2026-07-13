import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { Post } from "./types";

export interface GetPostsParams {
  userId?: string;
  pageNumber: number;
  pageSize: number;
}

export async function getPosts(params: GetPostsParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/Post/get-posts", {
    params: {
      UserId: params.userId,
      PageNumber: params.pageNumber,
      PageSize: params.pageSize,
    },
  });
  return data;
}

export interface GetFollowingPostsParams {
  pageNumber: number;
  pageSize: number;
}

export async function getFollowingPosts(params: GetFollowingPostsParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/Post/get-following-post", {
    params: { PageNumber: params.pageNumber, PageSize: params.pageSize },
  });
  return data;
}

export async function getPostById(id: number) {
  const { data } = await apiClient.get<Post>("/Post/get-post-by-id", { params: { id } });
  return data;
}

export interface AddPostPayload {
  title: string;
  content: string;
  images: File[];
}

export async function addPost(payload: AddPostPayload) {
  const formData = new FormData();
  formData.append("Title", payload.title);
  formData.append("Content", payload.content);
  payload.images.forEach((image) => formData.append("Images", image));
  const { data } = await apiClient.post<number>("/Post/add-post", formData);
  return data;
}

export async function deletePost(id: number) {
  const { data } = await apiClient.delete<boolean>("/Post/delete-post", { params: { id } });
  return data;
}

// Toggle-эндпоинты: повторный вызов снимает лайк/сохранение (проверено вручную).
export async function likePost(postId: number) {
  const { data } = await apiClient.post<boolean>("/Post/like-post", null, { params: { postId } });
  return data;
}

export async function toggleFavorite(postId: number) {
  const { data } = await apiClient.post<boolean>("/Post/add-post-favorite", { postId });
  return data;
}

// Дедуплицируется на бэкенде — повторный вызов для того же пользователя не увеличивает счётчик.
export async function viewPost(postId: number) {
  const { data } = await apiClient.post<boolean>("/Post/view-post", null, { params: { postId } });
  return data;
}

export async function addComment(payload: { postId: number; comment: string }) {
  const { data } = await apiClient.post<boolean>("/Post/add-comment", payload);
  return data;
}

export async function deleteComment(commentId: number) {
  const { data } = await apiClient.delete<boolean>("/Post/delete-comment", {
    params: { commentId },
  });
  return data;
}
