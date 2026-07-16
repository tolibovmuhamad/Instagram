import type { UserSearchResult } from "@/features/users/types";
import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

// У модуля Block в Swagger нет схемы ответа. Список заблокированных типизируем той же
// краткой карточкой пользователя, что отдают поиск и подписки (единый формат на бэкенде).

export async function blockUser(userId: string) {
  await apiClient.post("/Block/block-user", null, { params: { userId } });
}

export async function unblockUser(userId: string) {
  await apiClient.delete("/Block/unblock-user", { params: { userId } });
}

export interface GetBlockedParams {
  pageNumber: number;
  pageSize: number;
}

export async function getBlockedUsers(params: GetBlockedParams) {
  const { data } = await apiClient.get<Paginated<UserSearchResult>>(
    "/Block/get-blocked-users",
    { params },
  );
  return data;
}
