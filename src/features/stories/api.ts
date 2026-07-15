import { apiClient } from "@/lib/api/client";

import type { Story, StoryAudience } from "./types";

// Лента сторис = сторис тех, на кого подписан текущий пользователь. Плоский список,
// группировку по авторам делает groupStoriesByUser.
export async function getStories() {
  const { data } = await apiClient.get<Story[]>("/Story/get-stories");
  return data;
}

export async function getMyStories() {
  const { data } = await apiClient.get<Story[]>("/Story/get-my-stories");
  return data;
}

export async function getUserStories(userId: string) {
  const { data } = await apiClient.get<Story[]>(`/Story/get-user-stories/${userId}`);
  return data;
}

export interface AddStoryPayload {
  image: File;
  postId?: number;
  audience?: StoryAudience;
}

export async function addStory(payload: AddStoryPayload) {
  const formData = new FormData();
  formData.append("Image", payload.image);
  formData.append("Audience", String(payload.audience ?? 0));
  const { data } = await apiClient.post<Story>("/Story/AddStories", formData, {
    params: payload.postId ? { postId: payload.postId } : undefined,
  });
  return data;
}

export async function deleteStory(id: number) {
  const { data } = await apiClient.delete<boolean>("/Story/DeleteStory", { params: { id } });
  return data;
}

// Toggle-эндпоинт: возвращает не булево значение, а готовую фразу («Лайк добавлен.» /
// «Лайк удалён.»). Отдельного флага «я уже лайкнул» в DTO сторис нет — см. useLikeStory.
export async function likeStory(storyId: number) {
  const { data } = await apiClient.post<string>("/Story/LikeStory", null, {
    params: { storyId },
  });
  return data;
}

// Дедуплицируется на бэкенде — повторный вызов для того же пользователя не создаёт новую запись.
export async function addStoryView(storyId: number) {
  const { data } = await apiClient.post("/Story/add-story-view", null, {
    params: { storyId },
  });
  return data;
}

export async function replyToStory(storyId: number, text: string) {
  const { data } = await apiClient.post<boolean>(
    "/Story/reply",
    { text },
    { params: { storyId } },
  );
  return data;
}
