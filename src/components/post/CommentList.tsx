"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Trash2 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDeleteComment } from "@/features/posts/hooks";
import type { PostComment } from "@/features/posts/types";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

interface CommentListProps {
  postId: number;
  comments: PostComment[];
}

export function CommentList({ postId, comments }: CommentListProps) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const deleteComment = useDeleteComment(postId);

  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">Пока нет комментариев</p>
    );
  }

  return (
    <ul className="space-y-4">
      {comments.map((comment) => (
        <li key={comment.postCommentId} className="flex items-start gap-2">
          <Link href={`/profile/${comment.userId}`}>
            <Avatar className="size-8">
              <AvatarImage
                src={resolveImageUrl(comment.userImage)}
                alt={comment.userName ?? ""}
              />
              <AvatarFallback>
                {(comment.userName ?? "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 text-sm">
            <p>
              <Link href={`/profile/${comment.userId}`} className="font-medium">
                {comment.userName ?? "Пользователь"}
              </Link>{" "}
              {comment.comment}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.dateCommented), {
                addSuffix: true,
                locale: ru,
              })}
            </p>
          </div>
          {comment.userId === currentUserId && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Удалить комментарий"
              onClick={() => deleteComment.mutate(comment.postCommentId)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
