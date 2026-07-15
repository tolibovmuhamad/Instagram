"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCommentReplies, useDeleteComment, useLikeComment } from "@/features/posts/hooks";
import type { PostComment } from "@/features/posts/types";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

// Ответ всегда уходит в ту же ветку: у корневого комментария родитель — он сам,
// у ответа — id его родителя (треды двухуровневые, глубже бэкенд не хранит).
type ReplyHandler = (parentCommentId: number, userName: string) => void;

interface CommentListProps {
  postId: number;
  comments: PostComment[] | undefined;
  isLoading?: boolean;
  /** Бэкенд ещё не отдаёт список комментариев — см. getPostComments. */
  isUnavailable?: boolean;
  onReply: ReplyHandler;
}

function CommentRow({
  comment,
  postId,
  onReply,
}: {
  comment: PostComment;
  postId: number;
  onReply: ReplyHandler;
}) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const deleteComment = useDeleteComment(postId);
  const likeComment = useLikeComment(postId);
  const isOwn = comment.userId === currentUserId;
  const parentId = comment.parentCommentId ?? comment.id;

  return (
    <div className="flex items-start gap-3">
      <Link href={`/profile/${comment.userId}`} className="shrink-0">
        <Avatar className="size-8">
          <AvatarImage src={resolveAvatarUrl(comment.userImage)} alt={comment.userName ?? ""} />
          <AvatarFallback>{(comment.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <Link href={`/profile/${comment.userId}`} className="font-semibold">
            {comment.userName ?? "Пользователь"}
          </Link>{" "}
          <span className="break-words">{comment.comment}</span>
        </p>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
          <span>{formatDistanceToNowStrict(new Date(comment.createdAt), { locale: ru })}</span>
          {comment.likesCount > 0 && <span>{comment.likesCount} отм. «Нравится»</span>}
          <button
            type="button"
            className="font-semibold transition-colors hover:text-foreground"
            onClick={() => onReply(parentId, comment.userName ?? "")}
          >
            Ответить
          </button>
          {isOwn && (
            <button
              type="button"
              className="font-semibold transition-colors hover:text-foreground"
              onClick={() => deleteComment.mutate(comment.id)}
            >
              Удалить
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        aria-label={comment.isLiked ? "Убрать отметку с комментария" : "Нравится комментарий"}
        onClick={() => likeComment.mutate(comment.id)}
        className="mt-1.5 shrink-0"
      >
        <Heart
          className={cn(
            "size-3.5 transition-colors",
            comment.isLiked
              ? "fill-red-500 text-red-500"
              : "text-muted-foreground hover:text-foreground",
          )}
        />
      </button>
    </div>
  );
}

function CommentThread({
  comment,
  postId,
  onReply,
}: {
  comment: PostComment;
  postId: number;
  onReply: ReplyHandler;
}) {
  const [expanded, setExpanded] = useState(false);
  const repliesQuery = useCommentReplies(comment.id, expanded);
  const replies = repliesQuery.data?.items ?? [];

  // Свой (или чужой) новый ответ увеличивает repliesCount после рефетча — раскрываем
  // ветку, чтобы ответ сразу был виден под родителем, а не прятался за «Посмотреть ответы».
  const prevRepliesCount = useRef(comment.repliesCount);
  useEffect(() => {
    if (comment.repliesCount > prevRepliesCount.current) setExpanded(true);
    prevRepliesCount.current = comment.repliesCount;
  }, [comment.repliesCount]);

  return (
    <li className="space-y-3">
      <CommentRow comment={comment} postId={postId} onReply={onReply} />

      {comment.repliesCount > 0 && (
        <div className="ml-11 space-y-3">
          {expanded &&
            replies.map((reply) => (
              <CommentRow key={reply.id} comment={reply} postId={postId} onReply={onReply} />
            ))}

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex items-center gap-3 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="h-px w-6 bg-border" aria-hidden />
            {repliesQuery.isPending && expanded
              ? "Загрузка…"
              : expanded
                ? "Скрыть ответы"
                : `Посмотреть ответы (${comment.repliesCount})`}
          </button>
        </div>
      )}
    </li>
  );
}

export function CommentList({ postId, comments, isLoading, isUnavailable, onReply }: CommentListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Загружаем комментарии…</p>
      </div>
    );
  }

  if (isUnavailable) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Комментарии временно недоступны: API не отдаёт их список. Оставить новый комментарий
          можно — он сохранится.
        </p>
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Пока нет комментариев.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <CommentThread key={comment.id} comment={comment} postId={postId} onReply={onReply} />
      ))}
    </ul>
  );
}
