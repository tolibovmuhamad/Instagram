"use client";

import { Button } from "@/components/ui/button";
import { useFollowUser, useUnfollowUser } from "@/features/follows/hooks";

interface FollowButtonProps {
  targetUserId: string;
  isSubscriber: boolean;
}

export function FollowButton({ targetUserId, isSubscriber }: FollowButtonProps) {
  const followUser = useFollowUser(targetUserId);
  const unfollowUser = useUnfollowUser(targetUserId);
  const isPending = followUser.isPending || unfollowUser.isPending;

  const handleClick = () => {
    if (isSubscriber) {
      unfollowUser.mutate();
    } else {
      followUser.mutate();
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant={isSubscriber ? "outline" : "default"}
      disabled={isPending}
      onClick={handleClick}
    >
      {isSubscriber ? "Отписаться" : "Подписаться"}
    </Button>
  );
}
