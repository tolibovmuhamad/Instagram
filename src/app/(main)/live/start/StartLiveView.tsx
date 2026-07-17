"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useStartLive } from "@/features/live/hooks";
import type { LiveAudience } from "@/features/live/types";
import { cn } from "@/lib/utils";

// Экран подготовки: показываем камеру ДО выхода в эфир, чтобы человек видел себя и успел
// разрешить доступ. Этот поток живёт отдельно от LiveKit — он только для превью и гасится
// перед переходом, иначе камера останется занятой и SDK её не получит.
export function StartLiveView() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState<LiveAudience>(0);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const startLive = useStartLive();

  useEffect(() => {
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch((e: unknown) =>
        setCameraError(e instanceof Error ? e.message : "Камера недоступна"),
      );

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const handleStart = () => {
    startLive.mutate(
      { title: title.trim() || "Прямой эфир", audience },
      {
        onSuccess: (access) => {
          // Токен публикации выдаётся ровно один раз и повторно не запрашивается —
          // передаём его экрану эфира здесь. Комната переживёт переход, sessionStorage — да.
          sessionStorage.setItem(`live-access-${access.streamId}`, JSON.stringify(access));
          streamRef.current?.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          router.push(`/live/${access.streamId}`);
        },
        onError: () => toast.error("Не удалось начать эфир"),
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4 md:py-8">
      <h1 className="text-xl font-semibold">Прямой эфир</h1>

      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-neutral-900">
        {cameraError ? (
          <div className="flex size-full items-center justify-center p-6 text-center text-sm text-white/70">
            Нет доступа к камере: {cameraError}
            <br />
            Разрешите камеру и микрофон в браузере.
          </div>
        ) : (
          <video ref={videoRef} autoPlay playsInline muted className="size-full object-cover" />
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="live-title" className="text-sm font-medium">
          Название эфира
        </label>
        <input
          id="live-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="О чём эфир?"
          maxLength={100}
          className="h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Кто увидит</span>
        <div className="flex gap-2">
          {(
            [
              { value: 0, label: "Все" },
              { value: 1, label: "Близкие друзья" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setAudience(option.value)}
              aria-pressed={audience === option.value}
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                audience === option.value
                  ? "border-foreground bg-foreground text-background"
                  : "hover:bg-accent",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        type="button"
        onClick={handleStart}
        disabled={startLive.isPending || !!cameraError}
        className="w-full gap-2"
      >
        <Radio className="size-4" />
        {startLive.isPending ? "Выходим в эфир…" : "Начать эфир"}
      </Button>
    </div>
  );
}
