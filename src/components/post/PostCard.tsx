"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeletePost } from "@/features/posts/hooks";
import type { Post } from "@/features/posts/types";
import { formatTimeAgoShort } from "@/lib/utils/date";
import { resolveAvatarUrl } from "@/lib/utils/image";
import { useAuthStore } from "@/store/auth";

import { PostActionsBar } from "./PostActionsBar";
import { PostMedia } from "./PostMedia";

/** Порог, после которого подпись сворачивается за «… ещё», как в Instagram. */
const CAPTION_PREVIEW_LENGTH = 125;

export function PostCard({ post }: { post: Post }) {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const isOwnPost = currentUserId === post.userId;
  const deletePost = useDeletePost();
  const [isCaptionExpanded, setIsCaptionExpanded] = useState(false);

  const handleDelete = () => {
    deletePost.mutate(post.id, {
      onSuccess: () => toast.success("Пост удалён"),
    });
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Ссылка скопирована");
  };

  const caption = post.content ?? "";
  const isCaptionLong = caption.length > CAPTION_PREVIEW_LENGTH;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-5 border-b pb-5"
    >
      <header className="flex items-center justify-between pb-3">
        <Link href={`/profile/${post.userId}`} className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={resolveAvatarUrl(post.userImage)} alt={post.userName ?? ""} />
            <AvatarFallback>{(post.userName ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm leading-tight">
              <span className="font-semibold">{post.userName ?? "Пользователь"}</span>
              <span className="text-muted-foreground">
                {" "}
                • {formatTimeAgoShort(post.createdAt)}
              </span>
            </span>
            {post.title && (
              <span className="text-xs leading-tight text-muted-foreground">{post.title}</span>
            )}
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon" className="size-8" aria-label="Меню поста" />}
          >
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem render={<Link href={`/post/${post.id}`} />}>
              Перейти к публикации
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopyLink}>Скопировать ссылку</DropdownMenuItem>
            {isOwnPost && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                  Удалить
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <Link href={`/post/${post.id}`}>
        <PostMedia images={post.images} alt={post.title ?? "Пост"} variant="feed" />
      </Link>

      <PostActionsBar post={post} showCounts className="px-0 pt-3" />

      {caption && (
        <p className="pt-2 text-sm">
          <Link href={`/profile/${post.userId}`} className="font-semibold">
            {post.userName ?? "Пользователь"}
          </Link>{" "}
          {!isCaptionLong || isCaptionExpanded ? (
            caption
          ) : (
            <>
              {caption.slice(0, CAPTION_PREVIEW_LENGTH).trimEnd()}…{" "}
              <button
                type="button"
                onClick={() => setIsCaptionExpanded(true)}
                className="text-muted-foreground"
              >
                ещё
              </button>
            </>
          )}
        </p>
      )}
    </motion.article>
  );
}
