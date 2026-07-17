"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Eye, Hand, Heart, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { LiveAudio } from "@/components/live/LiveAudio";
import { LiveComments } from "@/components/live/LiveComments";
import { LiveHostPanel } from "@/components/live/LiveHostPanel";
import { LiveVideo } from "@/components/live/LiveVideo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelGuestRequest,
  useEndLive,
  useJoinLive,
  useLeaveLive,
  useLiveStream,
  useRequestGuest,
} from "@/features/live/hooks";
import { liveKeys } from "@/features/live/hooks";
import type { LiveAccess } from "@/features/live/types";
import { useLiveHub } from "@/features/live/useLiveHub";
import { useLiveRoom } from "@/features/live/useLiveRoom";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

const numberFormat = new Intl.NumberFormat("ru-RU");

/**
 * Экран эфира — один и тот же для хоста и зрителя, разница в правах:
 * хост публикует камеру и модерирует, зритель смотрит, комментирует и просится в гости.
 *
 * Доступ (`access`) хоста приходит со страницы запуска через sessionStorage: /Live/start
 * выдаёт токен ровно один раз, повторно его не получить, а join хосту не подходит — он
 * вернул бы токен без права публикации.
 */
// Токен хоста кладёт сюда страница запуска. Читаем лениво при инициализации состояния,
// а не в эффекте: setState в теле эффекта даёт каскадный ререндер. На сервере
// sessionStorage нет — отсюда проверка window.
function readStoredAccess(streamId: number): LiveAccess | null {
  if (typeof window === "undefined") return null;
  const stored = sessionStorage.getItem(`live-access-${streamId}`);
  return stored ? (JSON.parse(stored) as LiveAccess) : null;
}

export function LiveRoomView({ streamId }: { streamId: number }) {
  const router = useRouter();
  const currentUserId = useAuthStore((s) => s.user?.id);
  // Токен хоста (canPublish) кладёт страница запуска в sessionStorage — читаем его сразу,
  // синхронно. Его наличие ОДНОЗНАЧНО означает, что мы хост этого эфира: join такой токен
  // не выдаёт. На этом строим и публикацию, и подключение — не дожидаясь get-stream-by-id.
  const [hostAccess] = useState<LiveAccess | null>(() => readStoredAccess(streamId));
  // Токен зрителя приходит позже — из join.
  const [viewerAccess, setViewerAccess] = useState<LiveAccess | null>(null);
  // Publisher-токен гостя приходит пушем из LiveHub, когда хост одобрил заявку (см.
  // useGuestApproval). С ним зритель переключается в режим публикации.
  const [guestAccess, setGuestAccess] = useState<LiveAccess | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [guestRequested, setGuestRequested] = useState(false);

  const streamQuery = useLiveStream(streamId);
  const stream = streamQuery.data;
  // Хост по метаданным эфира — нужно для проверки «потерял доступ» (открыл в новой вкладке
  // без токена). Для публикации же достаточно наличия hostAccess.
  const isHostByStream = !!stream && stream.host.userId === currentUserId;
  const isHost = !!hostAccess || isHostByStream;
  const isLive = stream?.status === "Live";

  const join = useJoinLive();
  const leave = useLeaveLive();
  const endLive = useEndLive();
  const requestGuest = useRequestGuest(streamId);
  const cancelRequest = useCancelGuestRequest(streamId);

  const { mutate: doJoin } = join;

  // Зритель получает доступ через join (setState в колбэке мутации — уже после await,
  // каскада не даёт). Хосту join не нужен — у него уже есть hostAccess.
  useEffect(() => {
    if (hostAccess || viewerAccess || !stream || !isLive) return;
    doJoin(streamId, { onSuccess: setViewerAccess });
  }, [stream, hostAccess, viewerAccess, isLive, streamId, doJoin]);

  // Уходя со страницы, зритель обязан выйти из эфира — иначе он навсегда останется
  // в списке смотрящих у хоста. Хост не «выходит» — он завершает эфир кнопкой.
  useEffect(() => {
    if (hostAccess || !viewerAccess) return;
    return () => {
      leave.mutate(streamId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostAccess, viewerAccess, streamId]);

  // Одно соединение с LiveHub на обе роли:
  //  • гостю — GuestApproved: publisher-токен, переключаемся в режим публикации (камера
  //    включится, зрители нас увидят). До этого REST join отдаёт только зрительский токен;
  //  • хосту — GuestRequestReceived: новая заявка в гости прилетает сразу, без ожидания
  //    опроса (5 c) и уж тем более без перезагрузки — просто обновляем список заявок.
  const queryClient = useQueryClient();
  useLiveHub(streamId, !!stream && !!isLive, {
    onGuestApproved:
      !isHost && !guestAccess
        ? (approved) => {
            setGuestAccess(approved);
            setGuestRequested(false);
            toast.success("Ведущий пустил вас в эфир — включаем камеру");
          }
        : undefined,
    onGuestRequestReceived: isHost
      ? () => queryClient.invalidateQueries({ queryKey: liveKeys.guestRequests(streamId) })
      : undefined,
  });

  // Хост подключается и публикует камеру СРАЗУ по своему токену, не дожидаясь загрузки
  // метаданных эфира (get-stream-by-id на холодном Render ждёт до минуты). Иначе бэкенд
  // уже помечает эфир Live, зрители заходят — а видео нет, потому что хост ещё не в комнате.
  // Гость после одобрения переподключается по guestAccess уже с правом публикации.
  const access = hostAccess ?? guestAccess ?? (stream ? viewerAccess : null);
  const publish = !!hostAccess || !!guestAccess;
  const {
    remoteVideoTracks,
    remoteAudioTracks,
    localVideoTrack,
    isConnecting,
    error,
    cameraError,
    retryCamera,
  } = useLiveRoom({ access, publish });

  // Токен публикации выдаётся один раз и живёт в sessionStorage — открыв эфир без него
  // (другая вкладка, перезапуск браузера), хост уже нечем продолжить вести.
  const hostLostAccess = isHostByStream && isLive && !hostAccess;

  const handleEnd = () => {
    endLive.mutate(streamId, {
      onSuccess: (stats) => {
        toast.success(
          `Эфир завершён. Зрителей: ${stats.uniqueViewers}, сердечек: ${stats.likesCount}.`,
        );
        sessionStorage.removeItem(`live-access-${streamId}`);
        router.push("/live/my");
      },
    });
  };

  const handleGuest = () => {
    if (guestRequested) {
      cancelRequest.mutate(undefined, {
        onSuccess: () => {
          setGuestRequested(false);
          toast("Заявка отменена");
        },
      });
      return;
    }
    requestGuest.mutate(undefined, {
      onSuccess: () => {
        setGuestRequested(true);
        toast.success("Заявка отправлена — ждём решения ведущего");
      },
    });
  };

  if (streamQuery.isPending) {
    return (
      <div className="mx-auto w-full max-w-5xl p-6">
        <Skeleton className="aspect-video w-full rounded-xl" />
      </div>
    );
  }

  if (streamQuery.isError || !stream) {
    return <div className="p-8 text-center text-muted-foreground">Эфир не найден</div>;
  }

  // Своя камера у хоста, видео хоста — у зрителя.
  const hostTrack = isHost ? localVideoTrack : (remoteVideoTracks[0]?.track ?? null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black md:flex-row">
      {/* Голос ведущего/гостей — скрытые <audio>. Без них зрители не слышат эфир. */}
      {remoteAudioTracks.map(({ participantId, track }) => (
        <LiveAudio key={participantId} track={track} />
      ))}
      <div className="relative flex-1">
        {hostTrack ? (
          <LiveVideo track={hostTrack} muted={isHost} />
        ) : cameraError && isHost && isLive ? (
          // Камеру не удалось включить (занята другим приложением/вкладкой или запрещена).
          // Эфир при этом идёт — даём внятную причину и кнопку повтора, а не чёрный экран.
          <div className="flex size-full flex-col items-center justify-center gap-3 bg-neutral-900 px-6 text-center text-sm text-white/70">
            <p>Камера или микрофон недоступны: {cameraError}</p>
            <p className="text-white/50">
              Закройте другие приложения, использующие камеру, разрешите доступ и повторите.
            </p>
            <Button size="sm" variant="secondary" onClick={retryCamera}>
              Повторить
            </Button>
          </div>
        ) : (
          <div className="flex size-full items-center justify-center bg-neutral-900 px-6 text-center text-sm text-white/60">
            {!isLive
              ? "Эфир завершён"
              : hostLostAccess
                ? "Доступ к камере потерян при перезагрузке страницы. Завершите эфир и начните новый."
                : error
                  ? `Не удалось подключиться: ${error}`
                  : isConnecting
                    ? "Подключаемся к эфиру…"
                    : "Ждём видео ведущего…"}
          </div>
        )}

        {/* Шапка: кто ведёт, статус, зрители. */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/70 to-transparent p-4">
          <div className="flex items-center gap-2">
            <Avatar className="size-9 ring-2 ring-white/80">
              <AvatarImage src={resolveAvatarUrl(stream.host.avatar)} alt={stream.host.userName} />
              <AvatarFallback>{stream.host.userName.slice(0, 1).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{stream.host.userName}</p>
              {stream.title && <p className="truncate text-xs text-white/70">{stream.title}</p>}
            </div>
            {isLive && (
              <span className="rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase">
                Эфир
              </span>
            )}
            <span className="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-xs text-white">
              <Eye className="size-3.5" />
              {numberFormat.format(stream.currentViewers)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-white">
              <Heart className="size-4" />
              {numberFormat.format(stream.likesCount)}
            </span>
            <button
              type="button"
              aria-label="Комментарии и управление"
              onClick={() => setShowPanel((v) => !v)}
              className="rounded-full bg-black/50 p-2 text-white md:hidden"
            >
              <MessageCircle className="size-5" />
            </button>
            <button
              type="button"
              aria-label={isHost ? "Завершить эфир" : "Выйти"}
              onClick={isHost ? handleEnd : () => router.back()}
              className="rounded-full bg-black/50 p-2 text-white"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Гости — маленькими плитками поверх видео. */}
        {remoteVideoTracks.length > 1 && (
          <div className="absolute right-4 bottom-24 flex flex-col gap-2">
            {remoteVideoTracks.slice(1).map(({ participantId, track }) => (
              <div key={participantId} className="h-32 w-24 overflow-hidden rounded-lg ring-2 ring-white/40">
                <LiveVideo track={track} />
              </div>
            ))}
          </div>
        )}

        {/* До одобрения — кнопка заявки. После одобрения (guestAccess) её место занимает
            собственное превью гостя, чтобы он видел, что камера включилась. */}
        {isLive && !isHost && !guestAccess && (
          <button
            type="button"
            onClick={handleGuest}
            className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <Hand className="size-4" />
            {guestRequested ? "Отменить заявку" : "Попроситься в эфир"}
          </button>
        )}

        {/* Самопросмотр гостя-ведущего: подтверждает, что камера ожила и его видят.
            Зеркалим (-scale-x-100), как в любом видеозвонке. */}
        {!isHost && guestAccess && (
          <div className="absolute bottom-4 left-4 h-44 w-32 overflow-hidden rounded-xl bg-neutral-900 ring-2 ring-white/60">
            {localVideoTrack ? (
              <LiveVideo track={localVideoTrack} muted className="-scale-x-100" />
            ) : cameraError ? (
              <div className="flex size-full flex-col items-center justify-center gap-2 p-2 text-center text-[11px] text-white/70">
                <span>Камера недоступна</span>
                <Button size="sm" variant="secondary" onClick={retryCamera}>
                  Повторить
                </Button>
              </div>
            ) : (
              <div className="flex size-full items-center justify-center p-2 text-center text-[11px] text-white/60">
                Включаем камеру…
              </div>
            )}
            <span className="absolute top-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] font-medium text-white">
              Вы в эфире
            </span>
          </div>
        )}
      </div>

      {/* Правая колонка: комментарии всегда, управление — только хосту. */}
      <aside
        className={`${showPanel ? "flex" : "hidden"} h-[45vh] shrink-0 flex-col gap-4 border-t border-white/10 bg-neutral-950 p-4 md:flex md:h-auto md:w-[360px] md:border-t-0 md:border-l`}
      >
        {isHost && (
          <div className="max-h-[45%] overflow-y-auto">
            <LiveHostPanel streamId={streamId} />
          </div>
        )}
        <div className="min-h-0 flex-1">
          <LiveComments streamId={streamId} isHost={isHost} isLive={!!isLive} />
        </div>
      </aside>
    </div>
  );
}
