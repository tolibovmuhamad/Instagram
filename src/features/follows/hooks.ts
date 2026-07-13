import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userKeys } from "@/features/users/hooks";
import type { UserProfile, UserProfileWithFollowStatus } from "@/features/users/types";

import { followUser, getSubscribers, getSubscriptions, unfollowUser } from "./api";

export const followKeys = {
  subscribers: (userId: string) => ["follows", "subscribers", userId] as const,
  subscriptions: (userId: string) => ["follows", "subscriptions", userId] as const,
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

export function useFollowUser(targetUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => followUser(targetUserId),
    onMutate: () => {
      queryClient.setQueryData<UserProfileWithFollowStatus>(
        userKeys.profile(targetUserId),
        (old) =>
          old ? { ...old, isSubscriber: true, subscribersCount: old.subscribersCount + 1 } : old,
      );
      queryClient.setQueryData<UserProfile>(userKeys.myProfile, (old) =>
        old ? { ...old, subscriptionsCount: old.subscriptionsCount + 1 } : old,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
    },
  });
}

export function useUnfollowUser(targetUserId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unfollowUser(targetUserId),
    onMutate: () => {
      queryClient.setQueryData<UserProfileWithFollowStatus>(
        userKeys.profile(targetUserId),
        (old) =>
          old
            ? {
                ...old,
                isSubscriber: false,
                subscribersCount: Math.max(0, old.subscribersCount - 1),
              }
            : old,
      );
      queryClient.setQueryData<UserProfile>(userKeys.myProfile, (old) =>
        old ? { ...old, subscriptionsCount: Math.max(0, old.subscriptionsCount - 1) } : old,
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["follows"] });
    },
  });
}
