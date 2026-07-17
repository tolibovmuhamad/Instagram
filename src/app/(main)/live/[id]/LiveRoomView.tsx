"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Hand, Heart, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";

import { LiveComments } from "@/components/live/LiveComments";
import { LiveHostPanel } from "@/components/live/LiveHostPanel";
import { LiveVideo } from "@/components/live/LiveVideo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCancelGuestRequest,
  useEndLive,
  useJoinLive,
  useLeaveLive,
  useLiveStream,
  useRequestGuest,
} from "@/features/live/hooks";
import type { LiveAccess } from "@/features/live/types";
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
  const [access, setAccess] = useState<LiveAccess | null>(() => readStoredAccess(streamId));
  const [showPanel, setShowPanel] = useState(false);
  const [guestRequested, setGuestRequested] = useState(false);

  const streamQuery = useLiveStream(streamId);
  const stream = streamQuery.data;
  const isHost = !!stream && stream.host.userId === currentUserId;
  const isLive = stream?.status === "Live";

  const join = useJoinLive();
  const leave = useLeaveLive();
  const endLive = useEndLive();
  const requestGuest = useRequestGuest(streamId);
  const cancelRequest = useCancelGuestRequest(streamId);

  const { mutate: doJoin } = join;

  // Зритель получает доступ через join (setState в колбэке мутации — уже после await,
  // каскада не даёт). У хоста токен уже прочитан при инициализации состояния.
  useEffect(() => {
    if (!stream || access || isHost || !isLive) return;
    doJoin(streamId, { onSuccess: setAccess });
  }, [stream, isHost, isLive, streamId, access, doJoin]);

  // Уходя со страницы, зритель обязан выйти из эфира — иначе он навсегда останется
  // в списке смотрящих у хоста.
  useEffect(() => {
    if (isHost || !isLive) return;
    return () => {
      leave.mutate(streamId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, isLive, streamId]);

  // Подключаемся только когда известно, кто мы: иначе первый рендер (stream ещё грузится,
  // isHost=false) подключил бы хоста без публикации, а потом пришлось бы переподключаться.
  const { remoteVideoTracks, localVideoTrack, isConnecting, error } = useLiveRoom({
    access: stream ? access : null,
    publish: isHost,
  });

  // Токен публикации выдаётся один раз и живёт в sessionStorage — перезагрузка страницы
  // хоста его теряет, и продолжить вести эфир уже нечем.
  const hostLostAccess = isHost && isLive && !access;

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
      <div className="relative flex-1">
        {hostTrack ? (
          <LiveVideo track={hostTrack} muted={isHost} />
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

        {isLive && !isHost && (
          <button
            type="button"
            onClick={handleGuest}
            className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/25"
          >
            <Hand className="size-4" />
            {guestRequested ? "Отменить заявку" : "Попроситься в эфир"}
          </button>
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
