import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type {
  LiveAccess,
  LiveAudience,
  LiveComment,
  LiveGuestRequest,
  LiveStats,
  LiveStream,
  LiveUser,
  LiveViewer,
} from "./types";

// /Live/webhook сюда намеренно не вынесен: его вызывает LiveKit в наш бэкенд
// (проверка подписи по сырому телу), фронтенд к нему не обращается.

// --- Эфир: жизненный цикл -------------------------------------------------------

export async function startLive(payload: { title: string; audience: LiveAudience }) {
  const { data } = await apiClient.post<LiveAccess>("/Live/start", payload);
  return data;
}

/** Завершает эфир и возвращает итоговую статистику (только хост). */
export async function endLive(streamId: number) {
  const { data } = await apiClient.post<LiveStats>("/Live/end", null, { params: { streamId } });
  return data;
}

/** Отдаёт не boolean, а фразу («Заголовок эфира обновлён.») — значение не используем. */
export async function updateLiveTitle(streamId: number, title: string) {
  await apiClient.put("/Live/update-title", { title }, { params: { streamId } });
}

// --- Просмотр -------------------------------------------------------------------

/** Активные эфиры тех, на кого подписан (сервер сам учитывает приватность и блокировки). */
export async function getActiveLives(params: { pageNumber: number; pageSize: number }) {
  const { data } = await apiClient.get<Paginated<LiveStream>>("/Live/get-active", { params });
  return data;
}

export async function getLiveById(streamId: number) {
  const { data } = await apiClient.get<LiveStream>("/Live/get-stream-by-id", {
    params: { streamId },
  });
  return data;
}

/** Вход зрителем. Токен даёт только подписку: публиковать зритель не может. */
export async function joinLive(streamId: number) {
  const { data } = await apiClient.post<LiveAccess>("/Live/join", null, { params: { streamId } });
  return data;
}

export async function leaveLive(streamId: number) {
  await apiClient.post("/Live/leave", null, { params: { streamId } });
}

// --- Гости ----------------------------------------------------------------------

export async function requestGuest(streamId: number) {
  const { data } = await apiClient.post<LiveGuestRequest>("/Live/request-guest", null, {
    params: { streamId },
  });
  return data;
}

export async function cancelGuestRequest(streamId: number) {
  await apiClient.delete("/Live/cancel-guest-request", { params: { streamId } });
}

export async function getGuestRequests(streamId: number) {
  const { data } = await apiClient.get<LiveGuestRequest[]>("/Live/get-guest-requests", {
    params: { streamId },
  });
  return data;
}

/** Принимает requestId (поле requestId заявки), а не userId. */
export async function approveGuest(requestId: number) {
  await apiClient.post("/Live/approve-guest", null, { params: { requestId } });
}

export async function declineGuest(requestId: number) {
  await apiClient.post("/Live/decline-guest", null, { params: { requestId } });
}

export async function removeGuest(streamId: number, userId: string) {
  await apiClient.post("/Live/remove-guest", null, { params: { streamId, userId } });
}

export async function getActiveGuests(streamId: number) {
  const { data } = await apiClient.get<LiveUser[]>("/Live/get-active-guests", {
    params: { streamId },
  });
  return data;
}

// --- Комментарии и лайки --------------------------------------------------------

export async function addLiveComment(streamId: number, text: string) {
  const { data } = await apiClient.post<LiveComment>("/Live/add-comment", { text }, {
    params: { streamId },
  });
  return data;
}

export async function deleteLiveComment(commentId: number) {
  await apiClient.delete("/Live/delete-comment", { params: { commentId } });
}

/** Закреплён может быть только один комментарий — сервер сам снимает предыдущий. */
export async function pinLiveComment(commentId: number) {
  await apiClient.post("/Live/pin-comment", null, { params: { commentId } });
}

export async function getLiveComments(params: {
  streamId: number;
  pageNumber: number;
  pageSize: number;
}) {
  const { data } = await apiClient.get<Paginated<LiveComment>>("/Live/get-comments", { params });
  return data;
}

/** Сердечко; можно слать многократно, на сервере троттлинг. */
export async function sendLiveLike(streamId: number) {
  await apiClient.post("/Live/send-like", null, { params: { streamId } });
}

// --- Модерация, статистика, запись -----------------------------------------------

export async function banViewer(streamId: number, userId: string) {
  await apiClient.post("/Live/ban-viewer", null, { params: { streamId, userId } });
}

export async function unbanViewer(streamId: number, userId: string) {
  await apiClient.delete("/Live/unban-viewer", { params: { streamId, userId } });
}

export async function getLiveViewers(params: {
  streamId: number;
  pageNumber: number;
  pageSize: number;
}) {
  const { data } = await apiClient.get<Paginated<LiveViewer>>("/Live/get-viewers", { params });
  return data;
}

export async function getLiveStats(streamId: number) {
  const { data } = await apiClient.get<LiveStats>("/Live/get-stats", { params: { streamId } });
  return data;
}

export async function getMyStreams(params: { pageNumber: number; pageSize: number }) {
  const { data } = await apiClient.get<Paginated<LiveStream>>("/Live/get-my-streams", { params });
  return data;
}

/**
 * Работает только при наличии записи эфира. Сейчас записи не ведутся (recordingUrl всегда
 * null) и сервер отвечает 400 «Нет записи эфира для сохранения в сторис.» — проверено.
 */
export async function saveLiveToStory(streamId: number) {
  await apiClient.post("/Live/save-to-story", null, { params: { streamId } });
}
