import type { UserSearchResult } from "@/features/users/types";

/**
 * Числовые enum'ы уведомлений в Swagger не описаны (у модуля вообще нет схем ответов).
 * Значения выяснены запросами к API: подписка/лайк/комментарий от тестового аккаунта.
 */
export const NOTIFICATION_TYPE = {
  Like: 0,
  Follow: 1,
  Comment: 2,
  // Значения 6/7 выяснены запросами к API (закрытый аккаунт + запрос на подписку):
  // 6 — кто-то запросил подписку на закрытый аккаунт, 7 — ваш запрос приняли.
  FollowRequest: 6,
  FollowRequestAccepted: 7,
} as const;

export const NOTIFICATION_ENTITY = {
  Post: 0,
  User: 3,
} as const;

/** Автор действия. Бэкенд отдаёт ту же краткую карточку, что и поиск. */
export type NotificationActor = UserSearchResult;

export interface AppNotification {
  id: number;
  /** См. NOTIFICATION_TYPE. Незнакомые значения показываем нейтральным текстом. */
  type: number;
  /** См. NOTIFICATION_ENTITY. */
  entityType: number;
  /** Для лайка/комментария — id поста; у подписки null. */
  entityId: number | null;
  /** Уведомления схлопываются: несколько человек — один пункт. */
  actors: NotificationActor[];
  actorsCount: number;
  isRead: boolean;
  createdAt: string;
}
