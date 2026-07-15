"use client";

import { Button } from "@/components/ui/button";
import {
  useCancelFollowRequest,
  useFollowUser,
  useUnfollowUser,
} from "@/features/follows/hooks";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  /** Заявка на подписку отправлена и ждёт решения владельца закрытого аккаунта. */
  isRequested?: boolean;
  isPrivate?: boolean;
  /**
   * `button` — обычная кнопка (профиль, списки).
   * `link` — синяя текстовая ссылка без фона, как в колонке рекомендаций на главной.
   */
  appearance?: "button" | "link";
  className?: string;
}

export function FollowButton({
  targetUserId,
  isFollowing,
  isRequested = false,
  isPrivate = false,
  appearance = "button",
  className,
}: FollowButtonProps) {
  const followUser = useFollowUser(targetUserId);
  const unfollowUser = useUnfollowUser(targetUserId);
  const cancelRequest = useCancelFollowRequest(targetUserId);
  const isPending = followUser.isPending || unfollowUser.isPending || cancelRequest.isPending;

  const handleClick = () => {
    if (isFollowing) {
      unfollowUser.mutate();
    } else if (isRequested) {
      cancelRequest.mutate();
    } else {
      followUser.mutate();
    }
  };

  // На закрытый аккаунт подписка уходит заявкой, поэтому кнопка ведёт себя иначе.
  const label = isFollowing
    ? "Отписаться"
    : isRequested
      ? "Запрос отправлен"
      : isPrivate
        ? "Отправить запрос"
        : "Подписаться";

  // В рекомендациях «Подписаться» — синий текст, а уже подписанный/запрошенный становится
  // нейтральным, чтобы не перетягивать внимание.
  if (appearance === "link") {
    return (
      <Button
        type="button"
        size="xs"
        variant="link"
        disabled={isPending}
        onClick={handleClick}
        className={cn(
          "h-auto px-0 text-xs font-semibold",
          (isFollowing || isRequested) && "text-foreground",
          className,
        )}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isFollowing || isRequested ? "outline" : "default"}
      disabled={isPending}
      onClick={handleClick}
      className={className}
    >
      {label}
    </Button>
  );
}
