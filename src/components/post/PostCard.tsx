"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePost } from "@/features/posts/hooks";
import type { Post } from "@/features/posts/types";
import { resolveImageUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { PostActionsBar } from "./PostActionsBar";
import { PostMedia } from "./PostMedia";

function pluralizeLikes(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "отметка «Нравится»";
  return "отметок «Нравится»";
}

export function PostCard({ post }: { post: Post }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnPost = currentUserId === post.userId;
  const deletePost = useDeletePost();

  const handleDelete = () => {
    deletePost.mutate(post.postId, {
      onSuccess: () => toast.success("Пост удалён"),
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="border-b pb-4"
    >
      <header className="flex items-center justify-between px-3 py-2">
        <Link href={`/profile/${post.userId}`} className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarImage src={resolveImageUrl(post.userImage)} alt={post.userName ?? ""} />
            <AvatarFallback>{(post.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{post.userName ?? "Пользователь"}</span>
        </Link>

        {isOwnPost && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={<Button variant="ghost" size="icon" className="size-8" aria-label="Меню поста" />}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </header>

      <Link href={`/post/${post.postId}`}>
        <PostMedia images={post.images} alt={post.title ?? "Пост"} />
      </Link>

      <PostActionsBar post={post} />

      <div className="space-y-1 px-3 pt-2 text-sm">
        {post.postLikeCount > 0 && (
          <p className="font-medium">
            {post.postLikeCount} {pluralizeLikes(post.postLikeCount)}
          </p>
        )}
        {post.content && (
          <p>
            <span className="font-medium">{post.userName}</span> {post.content}
          </p>
        )}
        {post.commentCount > 0 && (
          <Link href={`/post/${post.postId}`} className="block text-muted-foreground">
            Показать все комментарии ({post.commentCount})
          </Link>
        )}
        <p className="text-xs text-muted-foreground uppercase">
          {formatDistanceToNow(new Date(post.datePublished), { addSuffix: true, locale: ru })}
        </p>
      </div>
    </motion.article>
  );
}
