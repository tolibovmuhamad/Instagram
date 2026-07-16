"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MessageCircle } from "lucide-react";

import type { Post } from "@/features/posts/types";
import { useBrokenImage } from "@/lib/hooks/use-broken-image";
import { resolveImageUrl } from "@/lib/utils/image";

export function PostGridItem({ post }: { post: Post }) {
  const filename = post.images[0];
  const thumbnail = resolveImageUrl(filename);
  // Файл мог пропасть с сервера — не показываем «битую картинку» (см. useBrokenImage).
  const { isBroken, imageProps } = useBrokenImage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/post/${post.id}`}
        className="group relative block aspect-square overflow-hidden bg-muted"
      >
        {thumbnail && !isBroken(filename) ? (
          <Image
            src={thumbnail}
            alt={post.title || "Пост"}
            fill
            sizes="(max-width: 768px) 33vw, 300px"
            className="object-cover"
            {...imageProps(filename)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Нет фото
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-4 bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1 text-sm font-medium">
            <Heart className="size-4 fill-white" /> {post.likeCount}
          </span>
          <span className="flex items-center gap-1 text-sm font-medium">
            <MessageCircle className="size-4 fill-white" /> {post.commentCount}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
