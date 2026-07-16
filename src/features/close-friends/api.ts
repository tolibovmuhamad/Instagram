import type { UserSearchResult } from "@/features/users/types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

// У модуля CloseFriend в Swagger нет схемы ответа. Список близких друзей типизируем той
// же краткой карточкой пользователя, что и остальные списки на бэкенде.

export async function addCloseFriend(userId: string) {
  await apiClient.post("/CloseFriend/add", null, { params: { userId } });
}

export async function removeCloseFriend(userId: string) {
  await apiClient.delete("/CloseFriend/remove", { params: { userId } });
}

export interface GetCloseFriendsParams {
  pageNumber: number;
  pageSize: number;
}

export async function getCloseFriends(params: GetCloseFriendsParams) {
  const { data } = await apiClient.get<Paginated<UserSearchResult>>(
    "/CloseFriend/get-list",
    { params },
  );
  return data;
}
