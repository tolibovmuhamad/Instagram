"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useEndLive, useMyActiveStream, useStartLive } from "@/features/live/hooks";
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
  // Бэкенд разрешает только один активный эфир и на второй отвечает 400. Показываем это
  // ДО нажатия кнопки, а не тостом с ошибкой после.
  const activeStream = useMyActiveStream();
  const endLive = useEndLive();
  const stuck = activeStream.data;

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
        // Своего onError нет намеренно: axios-перехватчик уже показывает тост с текстом
        // ОТ СЕРВЕРА («У вас уже идёт активный эфир.»). Общее «Не удалось начать эфир»
        // только прятало настоящую причину.
      },
    );
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4 md:py-8">
      <h1 className="text-xl font-semibold">Прямой эфир</h1>

      {/* Эфир мог остаться висеть после закрытия вкладки: сам он не гаснет, а начать
          второй бэкенд не даст. Предлагаем вернуться или завершить — иначе кнопка «Начать
          эфир» просто молча ругалась бы 400. */}
      {stuck && (
        <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
          <div>
            <p className="text-sm font-medium">У вас уже идёт эфир</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              «{stuck.title || "Без названия"}» — начать второй нельзя. Вернитесь в него или
              завершите, чтобы начать новый.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              nativeButton={false}
              render={<Link href={`/live/${stuck.streamId}`} />}
            >
              Вернуться в эфир
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={endLive.isPending}
              onClick={() =>
                endLive.mutate(stuck.streamId, {
                  onSuccess: () => {
                    toast.success("Эфир завершён — теперь можно начать новый");
                    void activeStream.refetch();
                  },
                })
              }
            >
              {endLive.isPending ? "Завершаем…" : "Завершить эфир"}
            </Button>
          </div>
        </div>
      )}

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
        disabled={startLive.isPending || !!cameraError || !!stuck}
        className="w-full gap-2"
      >
        <Radio className="size-4" />
        {startLive.isPending ? "Выходим в эфир…" : "Начать эфир"}
      </Button>
    </div>
  );
}
