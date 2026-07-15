"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

function formatSeconds(total: number): string {
  if (!Number.isFinite(total) || total < 0) total = 0;
  const mm = Math.floor(total / 60);
  const ss = Math.floor(total % 60);
  return `${mm}:${String(ss).padStart(2, "0")}`;
}

// Если бэкенд не прислал форму волны — рисуем ровный «плейсхолдер» из псевдослучайных
// столбиков, чтобы плеер выглядел как голосовое в Instagram, а не как пустая полоска.
function fallbackWaveform(seed: number): number[] {
  return Array.from({ length: 32 }, (_, index) => {
    const value = Math.sin(seed + index * 1.7) * 0.5 + 0.5;
    return 0.25 + value * 0.75;
  });
}

interface VoiceMessageProps {
  src: string;
  duration: number | null;
  waveform: number[] | null;
  isOwn: boolean;
}

export function VoiceMessage({ src, duration, waveform, isOwn }: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(duration ?? 0);

  const bars = waveform && waveform.length > 0 ? waveform : fallbackWaveform(src.length);
  const progress = total > 0 ? current / total : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => {
      if (Number.isFinite(audio.duration)) setTotal(audio.duration);
    };
    const onEnded = () => {
      setIsPlaying(false);
      setCurrent(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const remaining = total > 0 ? total - current : total;

  return (
    <div className="flex w-52 items-center gap-2">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Пауза" : "Воспроизвести"}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isOwn ? "bg-primary-foreground/20" : "bg-foreground/10",
        )}
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
      <div className="flex flex-1 items-center gap-[2px]" aria-hidden>
        {bars.map((height, index) => {
          const played = index / bars.length <= progress;
          return (
            <span
              key={index}
              className={cn(
                "w-full rounded-full transition-colors",
                played ? "opacity-100" : "opacity-40",
                isOwn ? "bg-primary-foreground" : "bg-foreground",
              )}
              style={{ height: `${Math.round(height * 20)}px` }}
            />
          );
        })}
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums opacity-70">
        {formatSeconds(isPlaying || current > 0 ? remaining : total)}
      </span>
    </div>
  );
}
