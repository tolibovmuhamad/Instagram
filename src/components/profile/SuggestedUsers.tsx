"use client";

import { useState } from "react";
import Link from "next/link";

import { FollowButton } from "@/components/profile/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscriptions } from "@/features/follows/hooks";
import type { FollowUser } from "@/features/follows/types";
import { useMyProfile, useSuggestedUsersPool } from "@/features/users/hooks";
import type { UserProfile, UserSearchResult } from "@/features/users/types";
import { resolveAvatarUrl } from "@/lib/utils/image";

const SUGGESTIONS_COUNT = 5;

/**
 * Правая колонка главной: карточка своего аккаунта + «Рекомендации для вас».
 * Эндпоинта рекомендаций у бэкенда нет, поэтому берём пул пользователей и убираем
 * себя и тех, на кого уже подписаны.
 */
export function SuggestedUsers() {
  const myProfileQuery = useMyProfile();
  const poolQuery = useSuggestedUsersPool();
  const me = myProfileQuery.data;
  const subscriptionsQuery = useSubscriptions(me?.userId ?? "");

  if (myProfileQuery.isPending || poolQuery.isPending || subscriptionsQuery.isPending) {
    return <SuggestionsSkeleton />;
  }

  // Панель вспомогательная: не на что смотреть или запрос упал — просто молчим.
  if (!me || !poolQuery.data) {
    return null;
  }

  return (
    <SuggestionsList
      me={me}
      pool={poolQuery.data.items}
      // Если список подписок не отдался, показываем всех: кнопка сама поправится после клика.
      loadedSubscriptions={subscriptionsQuery.data ?? []}
    />
  );
}

interface SuggestionsListProps {
  me: UserProfile;
  pool: UserSearchResult[];
  loadedSubscriptions: FollowUser[];
}

function SuggestionsList({ me, pool, loadedSubscriptions }: SuggestionsListProps) {
  // Состав панели фиксируем по подпискам на момент загрузки. Иначе после «Подписаться» список
  // подписок обновляется, пользователь отфильтровывается и строка исчезает прямо под курсором;
  // в Instagram она остаётся на месте, просто меняется кнопка.
  const [baseline] = useState(() => new Set(loadedSubscriptions.map((user) => user.id)));
  const subscriptionsQuery = useSubscriptions(me.userId);
  const following = new Set((subscriptionsQuery.data ?? []).map((user) => user.id));

  const suggestions = pool
    .filter((user) => user.id !== me.userId && !baseline.has(user.id))
    .slice(0, SUGGESTIONS_COUNT);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/profile" className="flex items-center gap-3">
        <Avatar className="size-11">
          <AvatarImage src={resolveAvatarUrl(me.image)} alt={me.userName} />
          <AvatarFallback>{me.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{me.userName}</p>
          <p className="truncate text-xs text-muted-foreground">{me.fullName}</p>
        </div>
      </Link>

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">Рекомендации для вас</span>
        <Link href="/search" className="text-xs font-semibold hover:text-muted-foreground">
          Все
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {suggestions.map((user) => (
          <li key={user.id} className="flex items-center gap-3 py-1">
            <Link href={`/profile/${user.id}`} className="shrink-0">
              <Avatar className="size-11">
                <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.userName} />
                <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${user.id}`} className="block truncate text-sm font-semibold">
                {user.userName}
              </Link>
              <p className="truncate text-xs text-muted-foreground">
                {user.fullName || "Рекомендуем вам"}
              </p>
            </div>
            <FollowButton
              targetUserId={user.id}
              isFollowing={following.has(user.id)}
              appearance="link"
              className="shrink-0"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SuggestionsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      {Array.from({ length: SUGGESTIONS_COUNT }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 py-1">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-3 w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}
