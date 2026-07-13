"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useInView } from "react-intersection-observer";

import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/features/posts/types";

import { PostGridItem } from "./PostGridItem";

interface PostGridProps {
  posts: Post[];
  isLoading: boolean;
  isError?: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  emptyMessage: string;
  /** Богатое пустое состояние (иконка + заголовок), переопределяет emptyMessage. */
  emptyState?: ReactNode;
}

export function PostGrid({
  posts,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  emptyMessage,
  emptyState,
}: PostGridProps) {
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      onLoadMore();
    }
  }, [inView, hasNextPage, isFetchingNextPage, onLoadMore]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }).map((_, index) => (
          <Skeleton key={index} className="aspect-square" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="py-16 text-center text-sm text-destructive">
        Не удалось загрузить публикации
      </p>
    );
  }

  if (posts.length === 0) {
    if (emptyState) return <>{emptyState}</>;
    return <p className="py-16 text-center text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-1">
        {posts.map((post) => (
          <PostGridItem key={post.postId} post={post} />
        ))}
      </div>
      {hasNextPage && <div ref={ref} className="h-px" />}
    </div>
  );
}
