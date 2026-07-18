"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  Eye,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useInView } from "react-intersection-observer";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useFollowUser } from "@/features/follows/hooks";
import { useLikePost, useToggleFavorite, useViewPost } from "@/features/posts/hooks";
import { useReelsInfinite } from "@/features/reels/hooks";
import type { Reel } from "@/features/reels/types";
import { useUserProfile } from "@/features/users/hooks";
import { useBrokenImage } from "@/lib/hooks/use-broken-image";
import { cn } from "@/lib/utils";
import { dedupeById } from "@/lib/utils/dedupe";
import { resolveAvatarUrl, resolveImageUrl } from "@/lib/utils/image";
import { isVideoFile } from "@/lib/utils/media";
import { plural, VIEW_FORMS } from "@/lib/utils/plural";

const numberFormat = new Intl.NumberFormat("ru-RU");
const formatCount = (value: number) => numberFormat.format(value);

// Высота одного «экрана» Reels. На мобильном layout резервирует под нижний таб-бар
// pb-16, а h-dvh про этот отступ не знает — из-за чего низ кадра (автор и подпись)
// уезжал под таб-бар. Поэтому на мобильном вычитаем те же 4rem, на десктопе (таб-бара
// нет) — полная высота вьюпорта.
const REEL_VIEWPORT = "h-[calc(100dvh-4rem)] md:h-dvh";

// tone="dark" — тёмные иконки в светлых полях по бокам видео (десктопный веб-Reels).
// tone="light" — белые иконки поверх видео (мобильный полноэкранный режим).
type Tone = "dark" | "light";

// Вертикальный рейл действий справа от видео: лайк, комментарии, поделиться,
// сохранить, ещё и мини-обложка — как в вебе Instagram 2026.
function ReelActions({ reel, tone }: { reel: Reel; tone: Tone }) {
  const likePost = useLikePost();
  const toggleFavorite = useToggleFavorite();

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${reel.id}`);
    toast.success("Ссылка скопирована");
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", tone === "light" ? "text-white" : "text-foreground")}>
      <motion.button
        type="button"
        aria-label={reel.isLiked ? "Убрать лайк" : "Поставить лайк"}
        whileTap={{ scale: 1.25 }}
        onClick={() => likePost.mutate(reel.id)}
        className="flex flex-col items-center gap-1"
      >
        <Heart
          strokeWidth={1.8}
          className={cn("size-6", reel.isLiked && "fill-red-500 text-red-500")}
        />
        {reel.likeCount > 0 && (
          <span className="text-xs font-semibold">{formatCount(reel.likeCount)}</span>
        )}
      </motion.button>

      <Link
        href={`/post/${reel.id}`}
        aria-label="Комментарии"
        className="flex flex-col items-center gap-1"
      >
        <MessageCircle strokeWidth={1.8} className="size-6 -scale-x-100" />
        {reel.commentCount > 0 && (
          <span className="text-xs font-semibold">{formatCount(reel.commentCount)}</span>
        )}
      </Link>

      <button type="button" aria-label="Поделиться" onClick={handleShare}>
        <Send strokeWidth={1.8} className="size-6" />
      </button>

      <button
        type="button"
        aria-label={reel.isFavorite ? "Убрать из сохранённого" : "Сохранить"}
        onClick={() => toggleFavorite.mutate(reel.id)}
      >
        <Bookmark strokeWidth={1.8} className={cn("size-6", reel.isFavorite && "fill-current")} />
      </button>

      <button type="button" aria-label="Ещё" onClick={handleShare}>
        <MoreHorizontal strokeWidth={1.8} className="size-6" />
      </button>

      {/* Просмотры: единственная метрика reel, которую бэкенд отдаёт готовым числом
          (viewCount) — засчитываются в ReelItem, когда reel попадает в кадр. */}
      <div className="flex flex-col items-center gap-1" title="Просмотры">
        <Eye strokeWidth={1.8} className="size-6" aria-hidden />
        <span className="text-xs font-semibold" aria-hidden>
          {formatCount(reel.viewCount)}
        </span>
        <span className="sr-only">
          {formatCount(reel.viewCount)} {plural(reel.viewCount, VIEW_FORMS)}
        </span>
      </div>

      <Link
        href={`/profile/${reel.userId}`}
        aria-label="Автор Reels"
        className={cn(
          "mt-1 size-7 overflow-hidden rounded-lg ring-1",
          tone === "light" ? "ring-white/30" : "ring-border",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolveAvatarUrl(reel.userImage)}
          alt=""
          className="size-full object-cover"
        />
      </Link>
    </div>
  );
}

// Автор + кнопка «Подписаться» (синяя, как в оригинале) под видео слева.
// Статуса подписки в DTO поста нет, поэтому подтягиваем его из профиля автора —
// React Query кэширует ответ по userId, так что на повторные reels того же автора
// лишнего запроса не будет.
function ReelAuthor({ reel, tone }: { reel: Reel; tone: Tone }) {
  const follow = useFollowUser(reel.userId);
  const authorProfile = useUserProfile(reel.userId);
  const isFollowing = authorProfile.data?.isFollowing ?? true;

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        tone === "light" ? "text-white" : "text-foreground",
      )}
    >
      <Link href={`/profile/${reel.userId}`} className="flex items-center gap-2.5">
        <Avatar className={cn("size-8 ring-1", tone === "light" ? "ring-white/40" : "ring-border")}>
          <AvatarImage src={resolveAvatarUrl(reel.userImage)} alt={reel.userName ?? ""} />
          <AvatarFallback className="text-xs">
            {(reel.userName ?? "?").slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-semibold">{reel.userName ?? "Пользователь"}</span>
      </Link>

      {!isFollowing && (
        <>
          <span className={cn("text-sm", tone === "light" ? "text-white/70" : "text-muted-foreground")}>
            •
          </span>
          <button
            type="button"
            onClick={() => follow.mutate()}
            disabled={follow.isPending}
            className="text-sm font-semibold text-[#0095f6] transition-opacity hover:opacity-70 disabled:opacity-50"
          >
            Подписаться
          </button>
        </>
      )}
    </div>
  );
}

function ReelItem({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.6 });
  const [muted, setMuted] = useState(true);
  const { mutate: registerView } = useViewPost();
  const viewedRef = useRef(false);
  // Файл мог пропасть с сервера — тогда вместо битой картинки показываем ту же
  // заглушку, что и у reel вообще без медиа (см. useBrokenImage).
  const { isBroken, imageProps } = useBrokenImage();

  // Бэкенд принимает у поста только картинки (.jpg/.png/.gif/.webp/.bmp — проверено
  // запросом: mp4 отклоняется с «Недопустимое расширение файла»), поэтому reel сейчас
  // всегда изображение. Ветку с <video> оставляем: тип определяется по расширению,
  // так что реальное видео заработает само, как только бэкенд начнёт его принимать.
  const filename = reel.images[0];
  const mediaUrl = resolveImageUrl(filename);
  const isVideo = !!filename && isVideoFile(filename);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView]);

  // Просмотр засчитывается один раз за монтирование, когда reel реально попал в кадр.
  useEffect(() => {
    if (!inView || viewedRef.current) return;
    viewedRef.current = true;
    registerView(reel.id);
  }, [inView, reel.id, registerView]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  return (
    <section
      ref={inViewRef}
      className={cn(
        "relative flex w-full snap-start items-center justify-center md:py-4",
        REEL_VIEWPORT,
      )}
    >
      {/* Карточка 9:16: на десктопе — по центру со скруглением, на мобильном — на весь экран.
          Фон и скругление на самом медиа, чтобы углы были чистыми, а рейл/автор снаружи не обрезались. */}
      <div className="relative h-full w-screen bg-black md:aspect-9/16 md:h-full md:w-auto md:rounded-md">
        {!mediaUrl || isBroken(filename) ? (
          <div className="grid size-full place-items-center text-sm text-white/60">Нет медиа</div>
        ) : isVideo ? (
          <video
            ref={videoRef}
            src={mediaUrl}
            className="size-full object-cover md:rounded-md"
            loop
            muted
            playsInline
          />
        ) : (
          <Image
            src={mediaUrl}
            alt={reel.title ?? "Reels"}
            fill
            sizes="(max-width: 768px) 100vw, 500px"
            className="object-cover md:rounded-md"
            {...imageProps(filename)}
          />
        )}

        {isVideo && (
          <button
            type="button"
            aria-label={muted ? "Включить звук" : "Выключить звук"}
            onClick={toggleMute}
            className="absolute right-3 bottom-3 grid size-8 place-items-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>
        )}

        {/* Мобильные оверлеи поверх медиа. */}
        <div className="absolute inset-x-0 bottom-0 space-y-2 bg-linear-to-t from-black/70 to-transparent p-4 md:hidden">
          <ReelAuthor reel={reel} tone="light" />
          {reel.content && (
            <p className="line-clamp-2 pr-16 text-sm text-white/90">{reel.content}</p>
          )}
        </div>
        <div className="absolute right-2 bottom-20 md:hidden">
          <ReelActions reel={reel} tone="light" />
        </div>

        {/* Десктоп: автор слева от медиа, рейл действий справа — оба вне карточки. */}
        <div className="absolute right-full bottom-2 mr-6 hidden w-56 md:block">
          <ReelAuthor reel={reel} tone="dark" />
          {reel.content && (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{reel.content}</p>
          )}
        </div>
        <div className="absolute bottom-0 left-full ml-4 hidden md:block">
          <ReelActions reel={reel} tone="dark" />
        </div>
      </div>
    </section>
  );
}

export function ReelsFeed() {
  const reelsQuery = useReelsInfinite();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { ref: sentinelRef, inView } = useInView();

  const reels = dedupeById(reelsQuery.data?.pages.flatMap((page) => page.items) ?? []);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = reelsQuery;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const scrollByViewport = (direction: 1 | -1) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollBy({ top: direction * container.clientHeight, behavior: "smooth" });
  };

  if (reelsQuery.isPending) {
    return (
      <div className={cn("flex items-center justify-center", REEL_VIEWPORT)}>
        <Skeleton className="h-[min(88vh,900px)] w-auto max-w-full rounded-md md:aspect-9/16" />
      </div>
    );
  }

  if (reelsQuery.isError) {
    return (
      <div className={cn("flex items-center justify-center text-destructive", REEL_VIEWPORT)}>
        Не удалось загрузить Reels
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-muted-foreground", REEL_VIEWPORT)}>
        Пока нет Reels
      </div>
    );
  }

  return (
    <>
      <div
        ref={scrollRef}
        className={cn(
          "scrollbar-none w-full snap-y snap-mandatory overflow-y-scroll [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          REEL_VIEWPORT,
        )}
      >
        {reels.map((reel) => (
          <ReelItem key={reel.id} reel={reel} />
        ))}
        <div ref={sentinelRef} className="h-px" />
      </div>

      {/* Круглые стрелки навигации у правого края, как в вебе Instagram. */}
      <div className="fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex">
        <button
          type="button"
          aria-label="Предыдущий Reels"
          onClick={() => scrollByViewport(-1)}
          className="grid size-11 place-items-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronUp className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Следующий Reels"
          onClick={() => scrollByViewport(1)}
          className="grid size-11 place-items-center rounded-full border bg-background text-foreground shadow-sm transition-colors hover:bg-accent"
        >
          <ChevronDown className="size-5" />
        </button>
      </div>
    </>
  );
}
