"use client";

import { useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart, X } from "lucide-react";
import { useInView } from "react-intersection-observer";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsInfinite,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks";
import { NOTIFICATION_TYPE, type AppNotification } from "@/features/notifications/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";

import { FollowRequestsSection } from "./FollowRequestsSection";

// Уведомления схлопнуты по объекту: «alice и ещё 3» — как в оригинале.
function describe(notification: AppNotification) {
  const [actor] = notification.actors;
  const others = notification.actorsCount - 1;
  const who = actor?.userName ?? "Кто-то";
  const suffix = others > 0 ? ` и ещё ${others}` : "";

  switch (notification.type) {
    case NOTIFICATION_TYPE.Like:
      return `${who}${suffix} оценил(а) вашу публикацию`;
    case NOTIFICATION_TYPE.Comment:
      return `${who}${suffix} прокомментировал(а) вашу публикацию`;
    case NOTIFICATION_TYPE.Follow:
      return `${who}${suffix} подписался(ась) на вас`;
    case NOTIFICATION_TYPE.FollowRequest:
      return `${who}${suffix} запросил(а) подписку на вас`;
    case NOTIFICATION_TYPE.FollowRequestAccepted:
      return `${who}${suffix} принял(а) ваш запрос на подписку`;
    default:
      // Бэкенд может завести новый тип — лучше нейтральный текст, чем пустая строка.
      return `${who}${suffix} отреагировал(а) на ваш контент`;
  }
}

// Лайк и комментарий относятся к посту; подписка и запросы на подписку — к человеку.
const USER_NOTIFICATION_TYPES: number[] = [
  NOTIFICATION_TYPE.Follow,
  NOTIFICATION_TYPE.FollowRequest,
  NOTIFICATION_TYPE.FollowRequestAccepted,
];

function targetHref(notification: AppNotification) {
  if (USER_NOTIFICATION_TYPES.includes(notification.type)) {
    const [actor] = notification.actors;
    return actor ? `/profile/${actor.id}` : null;
  }
  return notification.entityId ? `/post/${notification.entityId}` : null;
}

export function NotificationsView() {
  const query = useNotificationsInfinite();
  const unreadCount = useUnreadNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const removeNotification = useDeleteNotification();

  const notifications = query.data?.pages.flatMap((page) => page.items) ?? [];
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage) {
      query.fetchNextPage();
    }
  }, [inView, query]);

  const hasUnread = (unreadCount.data ?? 0) > 0;

  return (
    <main className="mx-auto w-full max-w-[500px] px-3 py-4 md:py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Уведомления</h1>
        {hasUnread && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-xs font-semibold"
            disabled={markAllRead.isPending}
            onClick={() => markAllRead.mutate()}
          >
            Отметить все прочитанными
          </Button>
        )}
      </div>

      <FollowRequestsSection />

      {query.isPending && (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-11 shrink-0 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      )}

      {query.isError && (
        <p className="py-16 text-center text-sm text-destructive">
          Не удалось загрузить уведомления
        </p>
      )}

      {query.isSuccess && notifications.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-24 text-center">
          <Heart className="size-10 text-muted-foreground" />
          <p className="text-lg font-semibold">Активности пока нет</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Здесь появятся лайки, комментарии и новые подписчики.
          </p>
        </div>
      )}

      <ul className="flex flex-col">
        {notifications.map((notification) => {
          const [actor] = notification.actors;
          const href = targetHref(notification);
          const text = describe(notification);

          return (
            <li
              key={notification.id}
              className={cn(
                "flex items-center gap-3 rounded-lg p-2",
                // Непрочитанные подсвечены, как в приложении.
                !notification.isRead && "bg-muted/50",
              )}
            >
              <Link
                href={href ?? "#"}
                onClick={() => {
                  if (!notification.isRead) markRead.mutate(notification.id);
                }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <Avatar className="size-11 shrink-0">
                  <AvatarImage
                    src={resolveAvatarUrl(actor?.avatar)}
                    alt={actor?.userName ?? ""}
                  />
                  <AvatarFallback>
                    {(actor?.userName ?? "?").slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <p className="min-w-0 flex-1 text-sm">
                  {text}{" "}
                  <span className="text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(notification.createdAt), { locale: ru })}
                  </span>
                </p>
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                aria-label="Удалить уведомление"
                onClick={() => removeNotification.mutate(notification.id)}
              >
                <X className="size-3.5" />
              </Button>
            </li>
          );
        })}
      </ul>

      {query.hasNextPage && <div ref={ref} className="h-px" />}
    </main>
  );
}
