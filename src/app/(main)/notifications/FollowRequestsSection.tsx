"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollowRequests, useRespondToFollowRequest } from "@/features/follows/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

// Запросы на подписку к закрытому аккаунту (§6). Данные — из get-follow-requests, ответ —
// accept/decline-request. После принятия запросившему приходит уведомление type 7,
// а он получает доступ к историям/публикациям (закрытый аккаунт открывается подписчику).
export function FollowRequestsSection() {
  const { data, isPending } = useFollowRequests();
  const respond = useRespondToFollowRequest();

  const requests = data?.items ?? [];

  if (isPending || requests.length === 0) return null;

  return (
    <section className="mb-4">
      <div className="mb-2 flex items-center justify-between px-2">
        <h2 className="text-sm font-semibold">Запросы на подписку</h2>
        <span className="rounded-full bg-[#FF3040] px-2 py-0.5 text-xs font-semibold text-white">
          {data?.totalRecords ?? requests.length}
        </span>
      </div>

      <ul className="flex flex-col">
        {requests.map((user) => (
          <li key={user.userId} className="flex items-center gap-3 rounded-lg p-2">
            <Link
              href={`/profile/${user.userId}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <Avatar className="size-11 shrink-0">
                <AvatarImage src={resolveAvatarUrl(user.avatar)} alt={user.userName} />
                <AvatarFallback>{user.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">{user.userName}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.fullName} · запросил(а) подписку
                </span>
              </span>
            </Link>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ userId: user.userId, accept: true })}
              >
                Подтвердить
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={respond.isPending}
                onClick={() => respond.mutate({ userId: user.userId, accept: false })}
              >
                Удалить
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <div className="my-3 border-t" />
    </section>
  );
}
