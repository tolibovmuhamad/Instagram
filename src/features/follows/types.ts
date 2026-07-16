import type { UserSearchResult } from "@/features/users/types";

// Списки подписчиков/подписок отдают ту же краткую карточку пользователя, что и поиск
// (поле id — GUID пользователя).
export type FollowUser = UserSearchResult;

// ВАЖНО: get-follow-requests отдаёт ДРУГУЮ форму — идентификатор лежит в поле `userId`
// (не `id`), есть `createdAt`, нет `email`. Проверено запросами к API. Если перепутать с
// FollowUser, accept/decline уходит с пустым id и бэкенд отвечает «ID не найден».
export interface FollowRequestUser {
  userId: string;
  userName: string;
  fullName: string;
  avatar: string | null;
  isVerified: boolean;
  createdAt: string;
}
