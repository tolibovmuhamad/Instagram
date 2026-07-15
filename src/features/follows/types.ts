import type { UserSearchResult } from "@/features/users/types";

// Списки подписчиков/подписок отдают ту же краткую карточку пользователя, что и поиск.
export type FollowUser = UserSearchResult;
