import { apiClient } from "@/lib/api/client";
import type { Paginated } from "@/lib/api/types";

import type { FollowRequestUser, FollowUser } from "./types";

// Эндпоинт не пагинирован — всегда отдаёт полный список.
export async function getSubscribers(userId: string) {
  const { data } = await apiClient.get<FollowUser[]>("/FollowingRelationShip/get-subscribers", {
    params: { userId },
  });
  return data;
}

export async function getSubscriptions(userId: string) {
  const { data } = await apiClient.get<FollowUser[]>("/FollowingRelationShip/get-subscriptions", {
    params: { userId },
  });
  return data;
}

// У закрытого аккаунта подписка не создаётся сразу, а уходит в заявки: сервер отвечает true
// в обоих случаях, поэтому фактическое состояние (подписан / заявка отправлена) берём из
// профиля — там есть isFollowing и isRequested.
export async function followUser(followingUserId: string) {
  await apiClient.post("/FollowingRelationShip/add-following-relation-ship", null, {
    params: { followingUserId },
  });
}

export async function unfollowUser(followingUserId: string) {
  await apiClient.delete("/FollowingRelationShip/delete-following-relation-ship", {
    params: { followingUserId },
  });
}

export async function cancelFollowRequest(followingUserId: string) {
  await apiClient.delete("/FollowingRelationShip/cancel-request", {
    params: { followingUserId },
  });
}

export interface GetFollowRequestsParams {
  pageNumber: number;
  pageSize: number;
}

export async function getFollowRequests(params: GetFollowRequestsParams) {
  const { data } = await apiClient.get<Paginated<FollowRequestUser>>(
    "/FollowingRelationShip/get-follow-requests",
    { params },
  );
  return data;
}

export async function acceptFollowRequest(requesterUserId: string) {
  await apiClient.post("/FollowingRelationShip/accept-request", null, {
    params: { requesterUserId },
  });
}

export async function declineFollowRequest(requesterUserId: string) {
  await apiClient.post("/FollowingRelationShip/decline-request", null, {
    params: { requesterUserId },
  });
}
