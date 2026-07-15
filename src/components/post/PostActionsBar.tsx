"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { useLikePost, useToggleFavorite } from "@/features/posts/hooks";
import { cn } from "@/lib/utils";

// Узкий структурный тип вместо полного Post — так же подходит для Reel (это тот же
// пост под капотом, просто с флагом isReel), не заставляя реели притворяться Post.
interface LikeableFavoritablePost {
  id: number;
  isLiked: boolean;
  likeCount: number;
  isFavorite: boolean;
  commentCount: number;
}

interface PostActionsBarProps {
  post: LikeableFavoritablePost;
  /** "vertical" — колонка крупных белых иконок для тёмной подложки Reels. */
  variant?: "horizontal" | "vertical";
  /** Счётчики лайков/комментариев рядом с иконками, как в ленте Instagram 2026. */
  showCounts?: boolean;
  className?: string;
}

export function PostActionsBar({
  post,
  variant = "horizontal",
  showCounts = false,
  className,
}: PostActionsBarProps) {
  const likePost = useLikePost();
  const toggleFavorite = useToggleFavorite();

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success("Ссылка скопирована");
  };

  if (variant === "vertical") {
    return (
      <div className="flex flex-col items-center gap-5 text-white">
        <motion.button
          type="button"
          aria-label={post.isLiked ? "Убрать лайк" : "Поставить лайк"}
          whileTap={{ scale: 1.3 }}
          onClick={() => likePost.mutate(post.id)}
          className="flex flex-col items-center gap-1"
        >
          <Heart className={cn("size-7", post.isLiked && "fill-red-500 text-red-500")} />
          <span className="text-xs">{post.likeCount}</span>
        </motion.button>
        <Link href={`/post/${post.id}`} aria-label="Комментарии" className="flex flex-col items-center gap-1">
          <MessageCircle className="size-7" />
          <span className="text-xs">{post.commentCount}</span>
        </Link>
        <button type="button" aria-label="Поделиться" onClick={handleShare}>
          <Send className="size-7" />
        </button>
        <button
          type="button"
          aria-label={post.isFavorite ? "Убрать из сохранённого" : "Сохранить"}
          onClick={() => toggleFavorite.mutate(post.id)}
        >
          <Bookmark className={cn("size-7", post.isFavorite && "fill-current")} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-between px-3 pt-2", className)}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <motion.button
            type="button"
            aria-label={post.isLiked ? "Убрать лайк" : "Поставить лайк"}
            whileTap={{ scale: 1.3 }}
            onClick={() => likePost.mutate(post.id)}
            className="transition-opacity hover:opacity-60"
          >
            <Heart className={cn("size-6", post.isLiked && "fill-red-500 text-red-500")} />
          </motion.button>
          {showCounts && post.likeCount > 0 && (
            <span className="text-sm font-semibold">{post.likeCount}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href={`/post/${post.id}`}
            aria-label="Комментарии"
            className="transition-opacity hover:opacity-60"
          >
            <MessageCircle className="size-6" />
          </Link>
          {showCounts && post.commentCount > 0 && (
            <span className="text-sm font-semibold">{post.commentCount}</span>
          )}
        </div>

        <button
          type="button"
          aria-label="Поделиться"
          onClick={handleShare}
          className="transition-opacity hover:opacity-60"
        >
          <Send className="size-6" />
        </button>
      </div>
      <button
        type="button"
        aria-label={post.isFavorite ? "Убрать из сохранённого" : "Сохранить"}
        onClick={() => toggleFavorite.mutate(post.id)}
        className="transition-opacity hover:opacity-60"
      >
        <Bookmark className={cn("size-6", post.isFavorite && "fill-current")} />
      </button>
    </div>
  );
}
