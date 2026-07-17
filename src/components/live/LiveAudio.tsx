"use client";

import { useEffect, useRef } from "react";
import type { Track } from "livekit-client";

// Аудиотрек LiveKit не звучит сам по себе — его, как и видео, нужно императивно прикрепить
// к элементу (attach/detach). Без этого зрители не слышат голос ведущего: трек подписан,
// но никуда не подключён. Элемент скрыт — он нужен только для воспроизведения звука.
export function LiveAudio({ track }: { track: Track }) {
  const ref = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    track.attach(element);
    return () => {
      track.detach(element);
    };
  }, [track]);

  return <audio ref={ref} autoPlay className="hidden" />;
}
