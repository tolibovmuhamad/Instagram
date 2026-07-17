"use client";

import { useEffect, useRef, useState } from "react";
import { Heart, Pin, Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useAddLiveComment,
  useDeleteLiveComment,
  useLiveComments,
  usePinLiveComment,
  useSendLiveLike,
} from "@/features/live/hooks";
import type { LiveComment } from "@/features/live/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

function CommentRow({
  comment,
  streamId,
  isHost,
}: {
  comment: LiveComment;
  streamId: number;
  isHost: boolean;
}) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const pin = usePinLiveComment(streamId);
  const remove = useDeleteLiveComment(streamId);
  // Удалять может автор комментария ИЛИ хост эфира — так же, как на бэкенде.
  const canDelete = isHost || comment.user.userId === currentUserId;

  return (
    <div className={cn("group flex items-start gap-2", comment.isPinned && "rounded-lg bg-white/10 p-2")}>
      <Avatar className="size-7 shrink-0">
        <AvatarImage src={resolveAvatarUrl(comment.user.avatar)} alt={comment.user.userName} />
        <AvatarFallback className="text-[10px]">
          {comment.user.userName.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {comment.isPinned && (
          <span className="mb-0.5 flex items-center gap-1 text-[10px] font-semibold text-white/70">
            <Pin className="size-2.5" />
            Закреплено
          </span>
        )}
        <p className="text-sm leading-snug text-white">
          <span className="font-semibold">{comment.user.userName}</span>{" "}
          <span className="break-words text-white/90">{comment.text}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {isHost && (
          <button
            type="button"
            aria-label={comment.isPinned ? "Открепить комментарий" : "Закрепить комментарий"}
            onClick={() => pin.mutate(comment.id)}
            className="p-1 text-white/70 hover:text-white"
          >
            <Pin className="size-3.5" />
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            aria-label="Удалить комментарий"
            onClick={() => remove.mutate(comment.id)}
            className="p-1 text-white/70 hover:text-white"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function LiveComments({
  streamId,
  isHost,
  isLive,
}: {
  streamId: number;
  isHost: boolean;
  isLive: boolean;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const commentsQuery = useLiveComments(streamId, isLive);
  const addComment = useAddLiveComment(streamId);
  const sendLike = useSendLiveLike(streamId);

  const comments = commentsQuery.data?.items ?? [];
  // Сервер отдаёт новые сверху, в эфире привычнее лента снизу вверх.
  const ordered = [...comments].reverse();
  const pinned = ordered.find((c) => c.isPinned);
  const rest = ordered.filter((c) => !c.isPinned);

  // Прокрутка к свежим — но только пока эфир идёт.
  useEffect(() => {
    if (isLive) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [comments.length, isLive]);

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    addComment.mutate(value, { onSuccess: () => setText("") });
  };

  return (
    <div className="flex h-full flex-col gap-3">
      {pinned && <CommentRow comment={pinned} streamId={streamId} isHost={isHost} />}

      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {commentsQuery.isPending && <p className="text-sm text-white/60">Загружаем комментарии…</p>}
        {!commentsQuery.isPending && rest.length === 0 && (
          <p className="text-sm text-white/60">
            {isLive ? "Пока никто ничего не написал." : "Комментариев не было."}
          </p>
        )}
        {rest.map((comment) => (
          <CommentRow key={comment.id} comment={comment} streamId={streamId} isHost={isHost} />
        ))}
      </div>

      {isLive && (
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Добавьте комментарий…"
            aria-label="Добавить комментарий к эфиру"
            className="h-10 flex-1 rounded-full border border-white/40 bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/60"
          />
          {!isHost && (
            <button
              type="button"
              aria-label="Отправить сердечко"
              onClick={() => sendLike.mutate()}
              className="shrink-0 p-1 text-white transition-transform active:scale-125"
            >
              <Heart className="size-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
