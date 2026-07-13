"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ru } from "date-fns/locale";
import { Heart } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDeleteComment } from "@/features/posts/hooks";
import type { PostComment } from "@/features/posts/types";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

interface CommentListProps {
  postId: number;
  comments: PostComment[];
  onReply: (userName: string) => void;
}

export function CommentList({ postId, comments, onReply }: CommentListProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const deleteComment = useDeleteComment(postId);
  // Лайк комментария на бэкенде не реализован (в PostComment нет полей лайка),
  // поэтому «сердечко» — локальное состояние ради UX, без сохранения на сервере.
  const [likedIds, setLikedIds] = useState<Record<number, boolean>>({});

  if (comments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Пока нет комментариев.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => {
        const isOwn = comment.userId === currentUserId;
        const isLiked = !!likedIds[comment.postCommentId];
        return (
          <li key={comment.postCommentId} className="flex items-start gap-3">
            <Link href={`/profile/${comment.userId}`} className="shrink-0">
              <Avatar className="size-8">
                <AvatarImage src={resolveImageUrl(comment.userImage)} alt={comment.userName ?? ""} />
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
                <span>
                  {formatDistanceToNowStrict(new Date(comment.dateCommented), { locale: ru })}
                </span>
                <button
                  type="button"
                  className="font-semibold transition-colors hover:text-foreground"
                  onClick={() => onReply(comment.userName ?? "")}
                >
                  Ответить
                </button>
                {isOwn && (
                  <button
                    type="button"
                    className="font-semibold transition-colors hover:text-foreground"
                    onClick={() => deleteComment.mutate(comment.postCommentId)}
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>

            <button
              type="button"
              aria-label={isLiked ? "Убрать отметку с комментария" : "Нравится комментарий"}
              onClick={() =>
                setLikedIds((prev) => ({
                  ...prev,
                  [comment.postCommentId]: !prev[comment.postCommentId],
                }))
              }
              className="mt-1.5 shrink-0"
            >
              <Heart
                className={cn(
                  "size-3.5 transition-colors",
                  isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-foreground",
                )}
              />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
