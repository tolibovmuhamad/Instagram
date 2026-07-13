"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useInView } from "react-intersection-observer";

import { PostActionsBar } from "@/components/post/PostActionsBar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useReelsInfinite } from "@/features/reels/hooks";
import type { Reel } from "@/features/reels/types";
import { resolveImageUrl } from "@/lib/utils/image";

function ReelItem({ reel }: { reel: Reel }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { ref: inViewRef, inView } = useInView({ threshold: 0.6 });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (inView) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [inView]);

  const videoUrl = resolveImageUrl(reel.images);

  return (
    <div
      ref={inViewRef}
      className="relative flex h-dvh w-full snap-start items-center justify-center bg-black"
    >
      {videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="h-full w-full object-contain"
          loop
          muted
          playsInline
        />
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/70 to-transparent p-4">
        <div className="max-w-[75%] space-y-2 text-white">
          <Link href={`/profile/${reel.userId}`} className="flex items-center gap-2">
            <Avatar className="size-8">
              <AvatarImage src={resolveImageUrl(reel.userImage)} alt={reel.userName ?? ""} />
              <AvatarFallback>{(reel.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{reel.userName ?? "Пользователь"}</span>
          </Link>
          {reel.content && <p className="text-sm">{reel.content}</p>}
        </div>

        <PostActionsBar post={reel} variant="vertical" />
      </div>
    </div>
  );
}

export function ReelsFeed() {
  const reelsQuery = useReelsInfinite();
  const { ref: sentinelRef, inView } = useInView();

  const reels = reelsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = reelsQuery;

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (reelsQuery.isPending) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Skeleton className="h-full w-full max-w-md" />
      </div>
    );
  }

  if (reelsQuery.isError) {
    return (
      <div className="flex h-dvh items-center justify-center text-destructive">
        Не удалось загрузить Reels
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex h-dvh items-center justify-center text-muted-foreground">
        Пока нет Reels
      </div>
    );
  }

  return (
    <div className="h-dvh w-full snap-y snap-mandatory overflow-y-scroll">
      {reels.map((reel) => (
        <ReelItem key={reel.postId} reel={reel} />
      ))}
      <div ref={sentinelRef} className="h-px" />
    </div>
  );
}
