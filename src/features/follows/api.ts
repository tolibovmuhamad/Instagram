import { apiClient } from "@/lib/api/client";

import type { FollowRelation } from "./types";

// Эндпоинт не пагинирован — всегда отдаёт полный список.
export async function getSubscribers(userId: string) {
  const { data } = await apiClient.get<FollowRelation[]>(
    "/FollowingRelationShip/get-subscribers",
    { params: { UserId: userId } },
  );
  return data;
}

export async function getSubscriptions(userId: string) {
  const { data } = await apiClient.get<FollowRelation[]>(
    "/FollowingRelationShip/get-subscriptions",
    { params: { UserId: userId } },
  );
  return data;
}

// data ответа ненадёжен (и на подписку, и на отписку возвращает false) — ориентируемся
// на то, какой из двух эндпоинтов вызвали, а не на тело ответа.
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
