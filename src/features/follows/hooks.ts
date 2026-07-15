import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userKeys } from "@/features/users/hooks";
import type { UserProfile } from "@/features/users/types";

import {
  acceptFollowRequest,
  cancelFollowRequest,
  declineFollowRequest,
  followUser,
  getFollowRequests,
  getSubscribers,
  getSubscriptions,
  unfollowUser,
} from "./api";

export const followKeys = {
  subscribers: (userId: string) => ["follows", "subscribers", userId] as const,
  subscriptions: (userId: string) => ["follows", "subscriptions", userId] as const,
  requests: ["follows", "requests"] as const,
};

export function useSubscribers(userId: string) {
  return useQuery({
    queryKey: followKeys.subscribers(userId),
    queryFn: () => getSubscribers(userId),
    enabled: !!userId,
  });
}

export function useSubscriptions(userId: string) {
  return useQuery({
    queryKey: followKeys.subscriptions(userId),
    queryFn: () => getSubscriptions(userId),
    enabled: !!userId,
  });
}

function patchProfiles(
  queryClient: ReturnType<typeof useQueryClient>,
  targetUserId: string,
  target: Partial<UserProfile>,
  myFollowingDelta: number,
) {
  queryClient.setQueryData<UserProfile>(userKeys.profile(targetUserId), (old) =>
    old ? { ...old, ...target } : old,
  );
  queryClient.setQueryData<UserProfile>(userKeys.myProfile, (old) =>
    old
      ? { ...old, followingCount: Math.max(0, old.followingCount + myFollowingDelta) }
      : old,
  );
}

export function useFollowUser(targetUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(targetUserId),
    onMutate: () => {
      const profile = queryClient.getQueryData<UserProfile>(userKeys.profile(targetUserId));

      // На закрытый аккаунт подписка не происходит сразу — уходит заявка, счётчики не растут.
      if (profile?.isPrivate) {
        patchProfiles(queryClient, targetUserId, { isRequested: true }, 0);
        return;
      }

      patchProfiles(
        queryClient,
        targetUserId,
        { isFollowing: true, followersCount: (profile?.followersCount ?? 0) + 1 },
        1,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(targetUserId) });
    },
  });
}

export function useUnfollowUser(targetUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(targetUserId),
    onMutate: () => {
      const profile = queryClient.getQueryData<UserProfile>(userKeys.profile(targetUserId));
      patchProfiles(
        queryClient,
        targetUserId,
        {
          isFollowing: false,
          followersCount: Math.max(0, (profile?.followersCount ?? 0) - 1),
        },
        -1,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
      queryClient.invalidateQueries({ queryKey: userKeys.profile(targetUserId) });
    },
  });
}

export function useCancelFollowRequest(targetUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelFollowRequest(targetUserId),
    onMutate: () => {
      patchProfiles(queryClient, targetUserId, { isRequested: false }, 0);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile(targetUserId) });
    },
  });
}

const REQUESTS_PAGE_SIZE = 20;

export function useFollowRequests() {
  return useQuery({
    queryKey: followKeys.requests,
    queryFn: () => getFollowRequests({ pageNumber: 1, pageSize: REQUESTS_PAGE_SIZE }),
  });
}

export function useRespondToFollowRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, accept }: { userId: string; accept: boolean }) =>
      accept ? acceptFollowRequest(userId) : declineFollowRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: followKeys.requests });
      queryClient.invalidateQueries({ queryKey: userKeys.myProfile });
    },
  });
}
