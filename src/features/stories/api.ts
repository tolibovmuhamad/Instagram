import { apiClient } from "@/lib/api/client";

import type { StoryGroup } from "./types";

// Раздел «сторис» и «подписки» на этом бэкенде масштабируется по подпискам —
// пока FollowingRelationShip не подключён (Этап 6), get-stories видит только свои сторис.
export async function getStories() {
  const { data } = await apiClient.get<StoryGroup[]>("/Story/get-stories");
  return data;
}

export async function getMyStories() {
  const { data } = await apiClient.get<StoryGroup>("/Story/get-my-stories");
  return data;
}

export async function getUserStories(userId: string) {
  const { data } = await apiClient.get<StoryGroup>(`/Story/get-user-stories/${userId}`);
  return data;
}

export async function addStory(payload: { image: File; postId?: number }) {
  const formData = new FormData();
  formData.append("Image", payload.image);
  const { data } = await apiClient.post<string>("/Story/AddStories", formData, {
    params: payload.postId ? { PostId: payload.postId } : undefined,
  });
  return data;
}

export async function deleteStory(id: number) {
  const { data } = await apiClient.delete<boolean>("/Story/DeleteStory", { params: { id } });
  return data;
}

// Toggle-эндпоинт: возвращает "Liked" / "Disliked" вместо булева значения (проверено вручную).
export async function likeStory(storyId: number) {
  const { data } = await apiClient.post<"Liked" | "Disliked">("/Story/LikeStory", null, {
    params: { storyId },
  });
  return data;
}

// Дедуплицируется на бэкенде — повторный вызов для того же пользователя не создаёт новую запись.
export async function addStoryView(storyId: number) {
  const { data } = await apiClient.post("/Story/add-story-view", null, {
    params: { StoryId: storyId },
  });
  return data;
}
