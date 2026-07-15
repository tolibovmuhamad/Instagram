import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { AppNotification } from "./types";

export interface GetNotificationsParams {
  pageNumber: number;
  pageSize: number;
}

export async function getNotifications(params: GetNotificationsParams) {
  const { data } = await apiClient.get<Paginated<AppNotification>>(
    "/Notification/get-notifications",
    { params },
  );
  return data;
}

export async function getUnreadCount() {
  const { data } = await apiClient.get<number>("/Notification/get-unread-count");
  return data;
}

// Отметки прочтения — PUT, а не POST (нестандартные глаголы у бэкенда, см. CLAUDE.md).
export async function markAsRead(id: number) {
  await apiClient.put("/Notification/mark-as-read", null, { params: { id } });
}

export async function markAllAsRead() {
  await apiClient.put("/Notification/mark-all-as-read");
}

export async function deleteNotification(id: number) {
  await apiClient.delete("/Notification/delete-notification", { params: { id } });
}
