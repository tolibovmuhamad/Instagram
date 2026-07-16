"use client";

import { Star } from "lucide-react";

import {
  useAddCloseFriend,
  useCloseFriendIds,
  useRemoveCloseFriend,
} from "@/features/close-friends/hooks";
import { cn } from "@/lib/utils";

// Кнопка «Близкие друзья» на чужом профиле. Когда пользователь в вашем списке близких,
// кнопка зелёная со звездой — как зелёный индикатор close friends в Instagram. Членство
// проверяется по /CloseFriend/get-list, переключение — add/remove.
export function CloseFriendButton({ userId }: { userId: string }) {
  const { data: ids } = useCloseFriendIds();
  const add = useAddCloseFriend();
  const remove = useRemoveCloseFriend();

  const isCloseFriend = ids?.has(userId) ?? false;
  const pending = add.isPending || remove.isPending;

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={isCloseFriend}
      onClick={() => (isCloseFriend ? remove.mutate(userId) : add.mutate(userId))}
      className={cn(
        "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-semibold transition-colors disabled:opacity-60",
        isCloseFriend
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
      )}
    >
      <Star className={cn("size-4", isCloseFriend && "fill-current")} />
      {isCloseFriend ? "Близкий друг" : "В близкие"}
    </button>
  );
}
