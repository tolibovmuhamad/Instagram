"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Eye, Heart, MessageCircle, Radio, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLiveStats, useMyStreamsInfinite, useSaveLiveToStory } from "@/features/live/hooks";
import type { LiveStream } from "@/features/live/types";

const numberFormat = new Intl.NumberFormat("ru-RU");

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds} с`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} мин`;
  return `${Math.floor(minutes / 60)} ч ${minutes % 60} мин`;
}

function StatChip({ icon: Icon, value, label }: { icon: typeof Eye; value: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground" title={label}>
      <Icon className="size-4" />
      {value}
    </span>
  );
}

function StreamCard({ stream }: { stream: LiveStream }) {
  const [expanded, setExpanded] = useState(false);
  // Подробная статистика — отдельный запрос, поэтому тянем только для раскрытой карточки
  // и не опрашиваем: эфир уже завершён, цифры не меняются.
  const statsQuery = useLiveStats(stream.streamId, expanded, false);
  const saveToStory = useSaveLiveToStory();
  const isLive = stream.status === "Live";

  return (
    <li className="rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-medium">
            <span className="truncate">{stream.title || "Без названия"}</span>
            {isLive && (
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase">
                Эфир
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {format(new Date(stream.startedAt), "d MMMM, HH:mm", { locale: ru })}
            {stream.endedAt && ` · ${formatDuration(
              Math.round((new Date(stream.endedAt).getTime() - new Date(stream.startedAt).getTime()) / 1000),
            )}`}
            {stream.audience === "CloseFriends" && " · близкие друзья"}
          </p>
        </div>

        {isLive && (
          // nativeButton={false} обязателен, когда кнопка рендерится ссылкой: иначе Base UI
          // ругается в консоли и теряется семантика кнопки.
          <Button size="sm" nativeButton={false} render={<Link href={`/live/${stream.streamId}`} />}>
            Вернуться
          </Button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-4">
        <StatChip icon={Eye} value={numberFormat.format(stream.viewersTotal)} label="Всего зрителей" />
        <StatChip icon={Users} value={numberFormat.format(stream.viewersPeak)} label="Пик зрителей" />
        <StatChip icon={Heart} value={numberFormat.format(stream.likesCount)} label="Сердечки" />
        <StatChip icon={MessageCircle} value={numberFormat.format(stream.commentsCount)} label="Комментарии" />
      </div>

      {!isLive && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            {expanded ? "Скрыть подробности" : "Подробная статистика"}
          </button>

          {/* Записи эфиров бэкенд пока не ведёт (recordingUrl всегда null), поэтому кнопка
              появляется только если запись реально есть — иначе сервер ответит 400. */}
          {stream.recordingUrl && !stream.savedToStory && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                saveToStory.mutate(stream.streamId, {
                  onSuccess: () => toast.success("Эфир сохранён в сторис"),
                })
              }
            >
              Сохранить в сторис
            </Button>
          )}
          {stream.savedToStory && <span className="text-xs text-muted-foreground">Сохранён в сторис</span>}
        </div>
      )}

      {expanded && (
        <div className="mt-3 border-t pt-3 text-sm">
          {statsQuery.isPending && <Skeleton className="h-16 w-full" />}
          {statsQuery.data && (
            <dl className="grid grid-cols-2 gap-2 text-muted-foreground sm:grid-cols-3">
              <div>
                <dt className="text-xs">Уникальных зрителей</dt>
                <dd className="text-foreground">{numberFormat.format(statsQuery.data.uniqueViewers)}</dd>
              </div>
              <div>
                <dt className="text-xs">Длительность</dt>
                <dd className="text-foreground">{formatDuration(statsQuery.data.durationSeconds)}</dd>
              </div>
              <div>
                <dt className="text-xs">Средний просмотр</dt>
                <dd className="text-foreground">{formatDuration(statsQuery.data.averageWatchSeconds)}</dd>
              </div>
              <div>
                <dt className="text-xs">Гостей в эфире</dt>
                <dd className="text-foreground">{statsQuery.data.activeGuests}</dd>
              </div>
              <div>
                <dt className="text-xs">Заявок в гости</dt>
                <dd className="text-foreground">{statsQuery.data.guestRequestsCount}</dd>
              </div>
              <div>
                <dt className="text-xs">Суммарный просмотр</dt>
                <dd className="text-foreground">{formatDuration(statsQuery.data.totalWatchSeconds)}</dd>
              </div>
            </dl>
          )}
          {statsQuery.data && statsQuery.data.topCommenters.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Активнее всех комментировали:{" "}
              <span className="text-foreground">
                {statsQuery.data.topCommenters.map((u) => u.userName).join(", ")}
              </span>
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export function MyStreamsView() {
  const query = useMyStreamsInfinite();
  const streams = query.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-4 md:py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Мои эфиры</h1>
        <Button size="sm" className="gap-2" nativeButton={false} render={<Link href="/live/start" />}>
          <Radio className="size-4" />
          Начать эфир
        </Button>
      </div>

      {query.isPending && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      )}

      {query.isError && <p className="text-sm text-muted-foreground">Не удалось загрузить эфиры.</p>}

      {!query.isPending && streams.length === 0 && (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Вы ещё не проводили эфиров.
        </p>
      )}

      <ul className="space-y-3">
        {streams.map((stream) => (
          <StreamCard key={stream.streamId} stream={stream} />
        ))}
      </ul>

      {query.hasNextPage && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? "Загружаем…" : "Показать ещё"}
        </Button>
      )}
    </div>
  );
}
