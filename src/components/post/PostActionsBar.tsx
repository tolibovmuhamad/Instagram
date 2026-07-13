"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bookmark, Heart, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

import { useLikePost, useToggleFavorite } from "@/features/posts/hooks";
import { cn } from "@/lib/utils";

// Узкий структурный тип вместо полного Post — так же подходит для Reel (это тот же
// пост под капотом, просто отфильтрованный по видео), не заставляя реели притворяться Post.
interface LikeableFavoritablePost {
  postId: number;
  postLike: boolean;
  postLikeCount: number;
  postFavorite: boolean;
}

interface PostActionsBarProps {
  post: LikeableFavoritablePost;
  /** "vertical" — колонка крупных белых иконок для тёмной подложки Reels. */
  variant?: "horizontal" | "vertical";
}

export function PostActionsBar({ post, variant = "horizontal" }: PostActionsBarProps) {
  const likePost = useLikePost();
  const toggleFavorite = useToggleFavorite();

  const handleShare = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.postId}`);
    toast.success("Ссылка скопирована");
  };

  if (variant === "vertical") {
    return (
      <div className="flex flex-col items-center gap-5 text-white">
        <motion.button
          type="button"
          aria-label={post.postLike ? "Убрать лайк" : "Поставить лайк"}
          whileTap={{ scale: 1.3 }}
          onClick={() => likePost.mutate(post.postId)}
          className="flex flex-col items-center gap-1"
        >
          <Heart className={cn("size-7", post.postLike && "fill-red-500 text-red-500")} />
          <span className="text-xs">{post.postLikeCount}</span>
        </motion.button>
        <Link href={`/post/${post.postId}`} aria-label="Комментарии" className="flex flex-col items-center gap-1">
          <MessageCircle className="size-7" />
        </Link>
        <button type="button" aria-label="Поделиться" onClick={handleShare}>
          <Send className="size-7" />
        </button>
        <button
          type="button"
          aria-label={post.postFavorite ? "Убрать из сохранённого" : "Сохранить"}
          onClick={() => toggleFavorite.mutate(post.postId)}
        >
          <Bookmark className={cn("size-7", post.postFavorite && "fill-current")} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3 pt-2">
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          aria-label={post.postLike ? "Убрать лайк" : "Поставить лайк"}
          whileTap={{ scale: 1.3 }}
          onClick={() => likePost.mutate(post.postId)}
        >
          <Heart className={cn("size-6", post.postLike && "fill-red-500 text-red-500")} />
        </motion.button>
        <Link href={`/post/${post.postId}`} aria-label="Комментарии">
          <MessageCircle className="size-6" />
        </Link>
        <button type="button" aria-label="Поделиться" onClick={handleShare}>
          <Send className="size-6" />
        </button>
      </div>
      <button
        type="button"
        aria-label={post.postFavorite ? "Убрать из сохранённого" : "Сохранить"}
        onClick={() => toggleFavorite.mutate(post.postId)}
      >
        <Bookmark className={cn("size-6", post.postFavorite && "fill-current")} />
      </button>
    </div>
  );
}
