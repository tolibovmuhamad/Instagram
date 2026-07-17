"use client";

import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";

import { cn } from "@/lib/utils";

// Мост между треком LiveKit и обычным <video>: трек не «отдаётся» как src, его нужно
// прикрепить императивно (attach/detach). Отцепление в cleanup обязательно — иначе
// элемент держит трек и камера не гаснет.
export function LiveVideo({
  track,
  muted = false,
  className,
}: {
  track: Track | null;
  muted?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!track || !element) return;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={muted}
      className={cn("size-full bg-black object-cover", className)}
    />
  );
}
