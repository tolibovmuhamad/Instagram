import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { Post, PostComment } from "./types";

export interface GetPostsParams {
  userId?: string;
  pageNumber: number;
  pageSize: number;
}

export async function getPosts(params: GetPostsParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/Post/get-posts", {
    params: {
      userId: params.userId,
      pageNumber: params.pageNumber,
      pageSize: params.pageSize,
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
    params: { pageNumber: params.pageNumber, pageSize: params.pageSize },
  });
  return data;
}

export interface GetExploreParams {
  pageNumber: number;
  pageSize: number;
}

// Персональные рекомендации: подбираются по интересам (авторы/хэштеги) + свежесть.
export async function getExploreFeed(params: GetExploreParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/Explore/get-feed", { params });
  return data;
}

// Cold start: чистая популярность. Нужен, пока у аккаунта нет истории для рекомендаций.
export async function getPopularPosts(params: GetExploreParams) {
  const { data } = await apiClient.get<Paginated<Post>>("/Explore/get-popular", { params });
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
  isReel?: boolean;
}

export async function addPost(payload: AddPostPayload) {
  const formData = new FormData();
  formData.append("Title", payload.title);
  formData.append("Content", payload.content);
  formData.append("IsReel", String(payload.isReel ?? false));
  payload.images.forEach((image) => formData.append("Images", image));
  const { data } = await apiClient.post<Post>("/Post/add-post", formData);
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

export interface AddCommentPayload {
  postId: number;
  comment: string;
  parentCommentId?: number;
}

export async function addComment(payload: AddCommentPayload) {
  const { data } = await apiClient.post<PostComment>("/Post/add-comment", payload);
  return data;
}

export async function deleteComment(commentId: number) {
  const { data } = await apiClient.delete<boolean>("/Post/delete-comment", {
    params: { commentId },
  });
  return data;
}

export async function likeComment(commentId: number) {
  const { data } = await apiClient.post<boolean>("/Post/like-comment", null, {
    params: { commentId },
  });
  return data;
}

export interface GetCommentsParams {
  postId: number;
  pageNumber: number;
  pageSize: number;
}

// Корневые комментарии поста (без ответов — те отдельно, через get-comment-replies).
// Эндпоинта долго не существовало, поэтому здесь жил фолбэк на 404; он появился 15.07.2026,
// фолбэк убран 17.07.2026. Схемы ответа в Swagger нет, форма проверена запросом: обычный
// пагинированный конверт, DTO совпадает с PostComment.
export async function getPostComments(params: GetCommentsParams) {
  const { data } = await apiClient.get<Paginated<PostComment>>("/Post/get-comments", { params });
  return data;
}

export interface GetRepliesParams {
  commentId: number;
  pageNumber: number;
  pageSize: number;
}

export async function getCommentReplies(params: GetRepliesParams) {
  const { data } = await apiClient.get<Paginated<PostComment>>("/Post/get-comment-replies", {
    params,
  });
  return data;
}
