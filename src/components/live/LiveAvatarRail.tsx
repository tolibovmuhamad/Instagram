"use client";

import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveLives } from "@/features/live/hooks";
import { resolveAvatarUrl } from "@/lib/utils/image";

// Активные эфиры живут в той же полосе кружков, что и сторис — как в оригинале.
// Отдельный компонент, а не часть StoryAvatarRail: у эфиров свой источник данных
// (/Live/get-active) и своё кольцо, а рельс сторис и без того нагружен.
// Показываем только когда эфиры есть — пустое место в ленте не занимаем.
export function LiveAvatarRail() {
  const { data } = useActiveLives();
  const lives = data?.items ?? [];

  if (lives.length === 0) return null;

  return (
    <>
      {lives.map((live) => (
        <Link
          key={live.streamId}
          href={`/live/${live.streamId}`}
          className="flex shrink-0 flex-col items-center gap-1"
          aria-label={`Эфир: ${live.host.userName}`}
        >
          <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-tr from-fuchsia-600 to-red-500 p-0.5">
            <Avatar className="size-full border-2 border-background">
              <AvatarImage src={resolveAvatarUrl(live.host.avatar)} alt={live.host.userName} />
              <AvatarFallback>{live.host.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase ring-2 ring-background">
              Эфир
            </span>
          </div>
          <span className="max-w-20 truncate text-xs">{live.host.userName}</span>
        </Link>
      ))}
    </>
  );
}
