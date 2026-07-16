import { apiClient } from "@/lib/api/client";

import type { ActiveSession } from "./types";

/** Активные сеансы пользователя. Отдаётся обычным массивом, без пагинации. */
export async function getActiveSessions() {
  const { data } = await apiClient.get<ActiveSession[]>("/Session/get-active-sessions");
  return data;
}

/**
 * Завершить одну сессию. Бэкенд отвечает `true`; на неизвестный id — 400
 * «Некорректный Id сессии.».
 */
export async function revokeSession(sessionId: string) {
  await apiClient.delete("/Session/revoke-session", { params: { sessionId } });
}

/** Завершить все сессии, кроме текущей. Текущая остаётся жить. */
export async function revokeAllOtherSessions() {
  await apiClient.delete("/Session/revoke-all-others");
}
